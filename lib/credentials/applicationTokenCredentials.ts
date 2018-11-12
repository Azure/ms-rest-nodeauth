// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenCredentialsBase } from "./tokenCredentialsBase";
import { Environment } from "@azure/ms-rest-azure-env";
import { AuthConstants, TokenAudience } from "../util/authConstants";
import { TokenResponse, ErrorResponse } from "adal-node";

export class ApplicationTokenCredentials extends TokenCredentialsBase {

  readonly secret: string;

  /**
   * Creates a new ApplicationTokenCredentials object.
   * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
   * for detailed instructions on creating an Azure Active Directory application.
   * @constructor
   * @param {string} clientId The active directory application client id.
   * @param {string} domain The domain or tenant id containing this application.
   * @param {string} secret The authentication secret for the application.
   * @param {string} [tokenAudience] The audience for which the token is requested. Valid values are 'graph', 'batch', or any other resource like 'https://vault.azure.com/'.
   * If tokenAudience is 'graph' then domain should also be provided and its value should not be the default 'common' tenant. It must be a string (preferrably in a guid format).
   * @param {Environment} [environment] The azure environment to authenticate with.
   * @param {object} [tokenCache] The token cache. Default value is the MemoryCache object from adal.
   */
  public constructor(
    clientId: string,
    domain: string,
    secret: string,
    tokenAudience?: TokenAudience,
    environment?: Environment,
    tokenCache?: any) {

    if (!Boolean(secret) || typeof secret.valueOf() !== "string") {
      throw new Error("secret must be a non empty string.");
    }
    super(clientId, domain, tokenAudience, environment as any, tokenCache);

    this.secret = secret;
  }

  /**
   * Tries to get the token from cache initially. If that is unsuccessfull then it tries to get the token from ADAL.
   * @returns {Promise<TokenResponse>} A promise that resolves to TokenResponse and rejects with an Error.
   */
  public getToken(): Promise<TokenResponse> {
    return this.getTokenFromCache()
      .then((tokenResponse) => tokenResponse)
      .catch((error) => {
        if (error.message.startsWith(AuthConstants.SDK_INTERNAL_ERROR)) {
          return Promise.reject(error);
        }

        const resource = this.getActiveDirectoryResourceId();
        return new Promise((resolve, reject) => {
          this.authContext.acquireTokenWithClientCredentials(resource, this.clientId, this.secret,
            (error: any, tokenResponse: TokenResponse | ErrorResponse) => {
              if (error) {
                return reject(error);
              }

              if (tokenResponse.error || tokenResponse.errorDescription) {
                return reject(tokenResponse);
              }

              return resolve(tokenResponse);
            });
        });
      });
  }

  protected getTokenFromCache(): Promise<any> {
    const self = this;

    // a thin wrapper over the base implementation. try get token from cache, additionaly clean up cache if required.
    return super.getTokenFromCache(undefined).then((tokenResponse: TokenResponse) => {
      return Promise.resolve(tokenResponse);
    }).catch((error: any) => {
      // Remove the stale token from the tokencache. ADAL gives the same error message "Entry not found in cache."
      // for entry not being present in the cache and for accessToken being expired in the cache. We do not want the token cache
      // to contain the expired token, we clean it up here.
      return self.removeInvalidItemsFromCache({ _clientId: self.clientId }).then((status) => {
        if (status.result) {
          return Promise.reject(error);
        }
        const msg = status && status.details && status.details.message ? status.details.message : status.details;
        return Promise.reject(new Error(AuthConstants.SDK_INTERNAL_ERROR + " : "
          + "critical failure while removing expired token for service principal from token cache. "
          + msg));
      });
    });
  }

  /**
   * Removes invalid items from token cache. This method is different. Here we never reject in case of error.
   * Rather we resolve with an object that says the result is false and error information is provided in
   * the details property of the resolved object. This is done to do better error handling in the above function
   * where removeInvalidItemsFromCache() is called.
   * @param {object} query The query to be used for finding the token for service principal from the cache
   * @returns {result: boolean, details?: Error} resultObject with more info.
   */
  private removeInvalidItemsFromCache(query: object): Promise<{ result: boolean, details?: Error }> {
    const self = this;
    return new Promise<{ result: boolean, details?: Error }>((resolve) => {
      self.tokenCache.find(query, (error: Error, entries: any[]) => {
        if (error) {
          return resolve({ result: false, details: error });
        }

        if (entries && entries.length > 0) {
          // return resolve(self.tokenCache.remove(entries, () => resolve({ result: true })));
          return new Promise((resolve) => {
            return self.tokenCache.remove(entries, (err: Error) => {
              if (err) {
                return resolve({ result: false, details: err });
              }
              return resolve({ result: true });
            });
          });
        } else {
          return resolve({ result: true });
        }
      });
    });
  }
}