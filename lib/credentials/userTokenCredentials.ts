// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenCredentialsBase, TokenResponse } from "./tokenCredentialsBase";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenAudience } from "../util/authConstants";

export class UserTokenCredentials extends TokenCredentialsBase {

  private readonly username: string;
  private readonly password: string;

  /**
   * Creates a new UserTokenCredentials object.
   *
   * @constructor
   * @param {string} clientId The active directory application client id.
   * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
   * for an example.
   * @param {string} domain The domain or tenant id containing this application.
   * @param {string} username The user name for the Organization Id account.
   * @param {string} password The password for the Organization Id account.
   * @param {string} [tokenAudience] The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
   * then domain should also be provided its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
   * @param {AzureEnvironment} [environment] The azure environment to authenticate with.
   * @param {object} [tokenCache] The token cache. Default value is the MemoryCache object from adal.
   */
  public constructor(
    clientId: string,
    domain: string,
    username: string,
    password: string,
    tokenAudience?: TokenAudience,
    environment?: AzureEnvironment,
    tokenCache?: any) {

    if (!Boolean(clientId) || typeof clientId.valueOf() !== "string") {
      throw new Error("clientId must be a non empty string.");
    }

    if (!Boolean(domain) || typeof domain.valueOf() !== "string") {
      throw new Error("domain must be a non empty string.");
    }

    if (!Boolean(username) || typeof username.valueOf() !== "string") {
      throw new Error("username must be a non empty string.");
    }

    if (!Boolean(password) || typeof password.valueOf() !== "string") {
      throw new Error("password must be a non empty string.");
    }

    super(clientId, domain, tokenAudience, environment as any, tokenCache);

    this.username = username;
    this.password = password;
  }

  private crossCheckUserNameWithToken(username: string, userIdFromToken: string): boolean {
    // to maintain the casing consistency between "azureprofile.json" and token cache. (RD 1996587)
    // use the "userId" here, which should be the same with "username" except the casing.
    return (username.toLowerCase() === userIdFromToken.toLowerCase());
  }

  /**
   * Tries to get the token from cache initially. If that is unsuccessful then it tries to get the token from ADAL.
   * @returns {Promise<TokenResponse>}
   * {object} [tokenResponse] The tokenResponse (tokenType and accessToken are the two important properties).
   * @memberof UserTokenCredentials
   */
  public async getToken(): Promise<TokenResponse> {
    try {
      return await this.getTokenFromCache(this.username);
    } catch (error) {
      const self = this;
      const resource = this.getActiveDirectoryResourceId();

      return new Promise<TokenResponse>((resolve, reject) => {
        self.authContext.acquireTokenWithUsernamePassword(resource, self.username, self.password, self.clientId,
          (error: Error, tokenResponse: TokenResponse) => {
            if (error) {
              reject(error);
            }
            if (self.crossCheckUserNameWithToken(self.username, tokenResponse.userId)) {
              resolve((tokenResponse as TokenResponse));
            } else {
              reject(`The userId "${tokenResponse.userId}" in access token doesn"t match the username "${self.username}" provided during authentication.`);
            }
          });
      });
    }
  }
}