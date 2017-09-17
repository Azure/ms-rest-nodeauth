import { TokenCredentialsBase, TokenResponse } from "./tokenCredentialsBase";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenAudience } from "../util/authConstants";
export declare class UserTokenCredentials extends TokenCredentialsBase {
    private readonly username;
    private readonly password;
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
    constructor(clientId: string, domain: string, username: string, password: string, tokenAudience?: TokenAudience, environment?: AzureEnvironment, tokenCache?: any);
    private crossCheckUserNameWithToken(username, userIdFromToken);
    /**
     * Tries to get the token from cache initially. If that is unsuccessful then it tries to get the token from ADAL.
     * @returns {Promise<TokenResponse>}
     * {object} [tokenResponse] The tokenResponse (tokenType and accessToken are the two important properties).
     * @memberof UserTokenCredentials
     */
    getToken(): Promise<TokenResponse>;
}
