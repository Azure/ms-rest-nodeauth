import { TokenCredentialsBase, TokenResponse } from "./tokenCredentialsBase";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenAudience } from "../util/authConstants";
export declare class ApplicationTokenCredentials extends TokenCredentialsBase {
    private readonly secret;
    /**
     * Creates a new ApplicationTokenCredentials object.
     * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
     * for detailed instructions on creating an Azure Active Directory application.
     * @constructor
     * @param {string} clientId The active directory application client id.
     * @param {string} domain The domain or tenant id containing this application.
     * @param {string} secret The authentication secret for the application.
     * @param {string} [tokenAudience] The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
     * then domain should also be provided its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
     * @param {AzureEnvironment} [environment] The azure environment to authenticate with.
     * @param {object} [tokenCache] The token cache. Default value is the MemoryCache object from adal.
     */
    constructor(clientId: string, domain: string, secret: string, tokenAudience?: TokenAudience, environment?: AzureEnvironment, tokenCache?: any);
    /**
     * Tries to get the token from cache initially. If that is unsuccessfull then it tries to get the token from ADAL.
     * @returns {Promise<TokenResponse>} A promise that resolves to TokenResponse and rejects with an Error.
     */
    getToken(): Promise<TokenResponse>;
    protected getTokenFromCache(): Promise<any>;
    /**
     * Removes invalid items from token cache. This method is different. Here we never reject in case of error.
     * Rather we resolve with an object that says the result is false and error information is provided in
     * the details property of the resolved object. This is done to do better error handling in the above function
     * where removeInvalidItemsFromCache() is called.
     * @param {object} query The query to be used for finding the token for service principal from the cache
     * @returns {result: boolean, details?: Error} resultObject with more info.
     */
    private removeInvalidItemsFromCache(query);
}
