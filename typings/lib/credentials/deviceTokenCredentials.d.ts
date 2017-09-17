import { TokenCredentialsBase, TokenResponse } from "./tokenCredentialsBase";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenAudience } from "../util/authConstants";
export declare class DeviceTokenCredentials extends TokenCredentialsBase {
    private readonly userName;
    /**
     * Creates a new DeviceTokenCredentials object that gets a new access token using userCodeInfo (contains user_code, device_code)
     * for authenticating user on device.
     *
     * When this credential is used, the script will provide a url and code. The user needs to copy the url and the code, paste it
     * in a browser and authenticate over there. If successful, the script will get the access token.
     *
     * @constructor
     * @param {string} [clientId] The active directory application client id.
     * @param {string} [domain] The domain or tenant id containing this application. Default value is "common"
     * @param {string} [username] The user name for account in the form: "user@example.com".
     * @param {string} [tokenAudience] The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
     * then domain should also be provided and its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
     * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
     * for an example.
     * @param {AzureEnvironment} [environment] The azure environment to authenticate with. Default environment is "Azure" popularly known as "Public Azure Cloud".
     * @param {object} [tokenCache] The token cache. Default value is the MemoryCache object from adal.
     */
    constructor(clientId?: string, domain?: string, userName?: string, tokenAudience?: TokenAudience, environment?: AzureEnvironment, tokenCache?: any);
    getToken(): Promise<TokenResponse>;
}
