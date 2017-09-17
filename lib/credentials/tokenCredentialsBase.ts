// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Constants as MSRestConstants, WebResource } from "ms-rest-js";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenAudience } from "../util/authConstants";
const adal = require("adal-node");

export interface TokenResponse {
  readonly tokenType: string;
  readonly accessToken: string;
  readonly [x: string]: any;
}

export abstract class TokenCredentialsBase {
  protected readonly isGraphContext: boolean;
  protected readonly authContext: any;

  public constructor(
    public readonly clientId: string,
    public domain: string,
    public readonly tokenAudience?: TokenAudience,
    public readonly environment = AzureEnvironment.Azure,
    public tokenCache: any = new adal.MemoryCache()) {

    if (!Boolean(clientId) || typeof clientId.valueOf() !== "string") {
      throw new Error("clientId must be a non empty string.");
    }

    if (!Boolean(domain) || typeof domain.valueOf() !== "string") {
      throw new Error("domain must be a non empty string.");
    }

    if (this.tokenAudience === TokenAudience.graph) {
      this.isGraphContext = true;

      if (this.domain.toLowerCase() === "common") {
        throw new Error(`${"If the tokenAudience is specified as \"graph\" then \"domain\" cannot be defaulted to \"commmon\" tenant.\
          It must be the actual tenant (preferrably a string in a guid format)."}`);
      }
    }

    const authorityUrl = this.environment.activeDirectoryEndpointUrl + this.domain;
    this.authContext = new adal.AuthenticationContext(authorityUrl, this.environment.validateAuthority, this.tokenCache);
  }

  protected getActiveDirectoryResourceId(): string {
    const resource = this.isGraphContext
      ? this.environment.activeDirectoryGraphResourceId
      : this.environment.activeDirectoryResourceId;

    return resource;
  }

  protected getTokenFromCache(userName?: string): Promise<TokenResponse> {
    const self = this;
    const resource = this.getActiveDirectoryResourceId();

    return new Promise<TokenResponse>((resolve, reject) => {
      self.authContext.acquireToken(resource, userName, self.clientId, (error: Error, tokenResponse: TokenResponse) => {
        if (error) {
          return reject(error);
        }
        return resolve(tokenResponse);
      });
    });
  }

  /**
   * Tries to get the token from cache initially. If that is unsuccessful then it tries to get the token from ADAL.
   * @returns {Promise<TokenResponse>}
   * {object} [tokenResponse] The tokenResponse (tokenType and accessToken are the two important properties).
   * @memberof TokenCredentialsBase
   */
  public async abstract getToken(): Promise<TokenResponse>;

  /**
   * Signs a request with the Authentication header.
   *
   * @param {webResource} The WebResource to be signed.
   * @param {function(error)}  callback  The callback function.
   * @return {undefined}
   */
  public async signRequest(webResource: WebResource): Promise<WebResource> {
    const tokenResponse = await this.getToken();
    webResource.headers[MSRestConstants.HeaderConstants.AUTHORIZATION] = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;
    return Promise.resolve(webResource);
  }
}