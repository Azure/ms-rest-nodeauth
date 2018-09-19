// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as url from "url";
import { ServiceClientCredentials, ServiceCallback, WebResource, Constants, TokenCredentials } from "ms-rest-js";
import { MSIAppServiceTokenCredentials } from "./msiAppServiceTokenCredentials";
import { MSIVmTokenCredentials } from "./msiVmTokenCredentials";
import { MSITokenCredentials } from "./msiTokenCredentials";
import { AuthenticationContext } from "adal-node";
import { ApplicationTokenCredentials } from "./applicationTokenCredentials";
import { UserTokenCredentials } from "./userTokenCredentials";
import { DeviceTokenCredentials } from "./deviceTokenCredentials";
import { TokenCredentialsBase } from "./tokenCredentialsBase";

/**
 * An object that performs authentication for Key Vault.
 * @class
 * @param {KeyVaultCredentials~authRequest} authenticator  A callback that receives a challenge and returns an authentication token.
 * @param {object} challengeCache A object used to store a previous challenge
 * @param {credentials} credentials - Credentials needed for the client to connect to Azure.
 */
export class KeyVaultCredentials implements ServiceClientCredentials {
  authenticator: (challenge: object, callback: any) => any;
  challengeCache: any[];
  credentials: MSITokenCredentials;

  constructor(authenticator: (challenge: object, callback: any) => any, credentials: MSITokenCredentials) {
    this.challengeCache = [];
    this.authenticator = authenticator;
    if (!this.authenticator && !credentials) {
      throw new Error("Either the authenticator callback or a valid credentials must be provided.");
    }
    if (credentials instanceof MSIAppServiceTokenCredentials) {
      this.credentials = new MSIAppServiceTokenCredentials({
        msiEndpoint: credentials.msiEndpoint,
        msiSecret: credentials.msiSecret,
        msiApiVersion: credentials.msiApiVersion,
        resource: credentials.resource
      });
    } else if (credentials instanceof MSIVmTokenCredentials) {
      this.credentials = new MSIVmTokenCredentials({
        resource: credentials.resource,
        port: credentials.port
      });
    } else if (credentials instanceof MSITokenCredentials) {
      throw new Error("MSI-credentials not one of: MSIVmTokenCredentials, MSIAppServiceTokenCredentials");
    } else {
      this.credentials = credentials as any;
    }

    if (!this.authenticator) {
      this.authenticator = this._authenticatorMapper(this.credentials);
    }
  }

  signRequest(webResource: WebResource): Promise<WebResource> {
    // authentication is provided by the createSigningFilter method.
    return Promise.resolve(undefined);
  }

  createSigningFilter(): (resource: WebResource, next: Function, callback: ServiceCallback<any>) => any {
    const self = this;
    return function (resource, next, callback) {
      const nextHandler = function (err, response, body) {
        // If this is not a 401 result, just resume.
        if (!response || response.statusCode !== 401 || !response.headers) {
          return callback(err, response, body);
        }
        // Otherwise we must handle the 401.
        return self.handleUnauthorized(resource, next, err, response, body, callback);
      };
      // Check if we have a cached challenge for this resource.
      const cachedChallenge = self.getCachedChallenge(resource);
      if (!cachedChallenge) {
        // Resume without any challenge. The service may return a 401-unauthorized that will be handled afterwards.
        return next(resource, nextHandler);
      }
      // Calls the authenticator to retrieve an authorization value.
      // Since the authenticator doesn't return a stream, we need to use the interimStream.
      self.authenticator(cachedChallenge, function (err, authorizationValue) {
        if (err) {
          return callback(err);
        }
        if (authorizationValue) {
          // If we have credentials, set in the header.
          resource.headers[Constants.HeaderConstants.AUTHORIZATION] = authorizationValue;
        }
      });
    };
  }

  getCachedChallenge(webResource: WebResource): object {
    const authority = this._getAuthority(webResource.url);
    return this.challengeCache[authority];
  }

  addChallengeToCache(webResource: WebResource, challenge: object): void {
    const authority = this._getAuthority(webResource.url);
    this.challengeCache[authority] = challenge;
  }

  handleUnauthorized(webResource: WebResource, next: Function, err: Error, response: any, body: any, callback: ServiceCallback<any>): any {
    // If the www-authenticate header is not as expected, just resume.
    const wwwAuthenticate = response.headers["www-authenticate"];
    const challenge = wwwAuthenticate ? this._parseAuthorizationHeader(wwwAuthenticate) : undefined;
    if (!challenge || !challenge.authorization || !challenge.resource) {
      return callback(err, response, body);
    }
    // Cache the challenge.
    this.addChallengeToCache(webResource, challenge);
    const authenticate = function (err, authorizationValue) {
      if (err) {
        return callback(err);
      }
      if (authorizationValue) {
        // If we have credentials, set in the header.
        webResource.headers[Constants.HeaderConstants.AUTHORIZATION] = authorizationValue;
      }
      // Resume the call.
      return next(webResource, callback);
    };
    return this.authenticator(challenge, authenticate);
  }

  private _authenticatorMapper(credentials: MSITokenCredentials): Function {
    return function (challenge, callback) {
      // Function to take token Response and format a authorization value
      function _formAuthorizationValue(err, tokenResponse) {
        if (err) {
          return callback(err);
        }

        // Calculate the value to be set in the request's Authorization header and resume the call.
        const authorizationValue = tokenResponse.tokenType + " " + tokenResponse.accessToken;
        return callback(undefined, authorizationValue);
      }

      // Create a new authentication context.
      if (credentials instanceof TokenCredentialsBase) {
        const context = new AuthenticationContext(challenge.authorization, true, credentials.authContext && credentials.authContext.cache);
        if (credentials instanceof ApplicationTokenCredentials) {
          return context.acquireTokenWithClientCredentials(
            challenge.resource, credentials.clientId, credentials.secret, _formAuthorizationValue);
        } else if (credentials instanceof UserTokenCredentials) {
          return context.acquireTokenWithUsernamePassword(
            challenge.resource, credentials.username, credentials.password, credentials.clientId, _formAuthorizationValue);
        } else if (credentials instanceof DeviceTokenCredentials) {
          return context.acquireToken(
            challenge.resource, credentials.username, credentials.clientId, _formAuthorizationValue);
        }
      } else if (credentials instanceof MSITokenCredentials) {
        return credentials.getToken();
      } else {
        callback(new Error("credentials must be one of: ApplicationTokenCredentials, UserTokenCredentials, " +
          "DeviceTokenCredentials, MSITokenCredentials"));
      }
    };
  }

  private _parseAuthorizationHeader(header: string): any {
    if (!header) {
      return undefined;
    }
    const headerParts = header.match(/^(\w+)(?:\s+(.*))?$/); // Header: scheme[ something]
    if (!headerParts) {
      return undefined;
    }
    const scheme = headerParts[1];
    if (scheme.toLowerCase() !== "bearer") {
      return undefined;
    }
    const attributesString = headerParts[2];
    if (!attributesString) {
      return undefined;
    } undefined;
    const attributes = {};
    const attrStrings = attributesString.split(",");
    for (let i = 0; i < attrStrings.length; ++i) {
      const attrString = attrStrings[i];
      const j = attrString.indexOf("=");
      const name = attrString.substring(0, j).trim();
      const value = attrString.substring(j + 1).trim();
      attributes[name] = JSON.parse('{"value":' + value + "}").value;
    }
    return attributes;
  }

  private _getAuthority(uri: string): string {
    const v = url.parse(uri, true, true);
    const protocol = v.protocol ? v.protocol : ":";
    const host = v.host;
    let result = protocol;
    if (v.slashes) {
      result += "//";
    }
    result += host;
    return result;
  }
}
