import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenCredentialsBase } from "./credentials/tokenCredentialsBase";
import { ApplicationTokenCredentials } from "./credentials/applicationTokenCredentials";
import { DeviceTokenCredentials } from "./credentials/deviceTokenCredentials";
import { UserTokenCredentials } from "./credentials/userTokenCredentials";
import { TokenAudience } from "./util/authConstants";
import { LinkedSubscription } from "./subscriptionManagement/subscriptionUtils";
import { MSITokenResponse } from "./credentials/msiTokenCredentials";
/**
 * @interface AzureTokenCredentialsOptions - Describes optional parameters for serviceprincipal/secret authentication.
 */
export interface AzureTokenCredentialsOptions {
    /**
     * @property {TokenAudience} [tokenAudience] - The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
     * then domain should also be provided and its value should not be the default "common" tenant.
     * It must be a string (preferrably in a guid format).
     */
    tokenAudience?: TokenAudience;
    /**
     * @property {AzureEnvironment} [environment] - The Azure environment to authenticate with.
     */
    environment?: AzureEnvironment;
    /**
     * @property {any} [tokenCache] - The token cache. Default value is MemoryCache from adal.
     */
    tokenCache?: any;
}
/**
 * @interface LoginWithUsernamePasswordOptions - Describes optional parameters for username/password authentication.
 */
export interface LoginWithUsernamePasswordOptions extends AzureTokenCredentialsOptions {
    /**
     * @property {string} [clientId] - The active directory application client id.
     * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
     * for an example.
     */
    clientId?: string;
    /**
     * @property {string} [domain] - The domain or tenant id containing this application. Default value is "common".
     */
    domain?: string;
}
/**
 * @interface InteractiveLoginOptions - Describes optional parameters for interactive authentication.
 */
export interface InteractiveLoginOptions extends LoginWithUsernamePasswordOptions {
    /**
     * @property {object|function} [userCodeResponseLogger] A logger that logs the user code response message required for interactive login. When
     * this option is specified the usercode response message will not be logged to console.
     */
    userCodeResponseLogger?: any;
    /**
     * @property {string} [language] The language code specifying how the message should be localized to. Default value "en-us".
     */
    language?: string;
}
/**
 * @interface AuthResponse - Describes the authentication response.
 */
export interface AuthResponse {
    /**
     *  @property {TokenCredentialsBase} credentials - The credentials object.
     */
    credentials: TokenCredentialsBase;
    /**
     * @property {Array<LinkedSubscription>} [subscriptions] List of associated subscriptions.
     */
    subscriptions?: LinkedSubscription[];
}
/**
 * @interface LoginWithAuthFileOptions - Describes optional parameters for login withAuthFile.
 */
export interface LoginWithAuthFileOptions {
    /**
     * @property {string} [filePath] - Absolute file path to the auth file. If not provided
     * then please set the environment variable AZURE_AUTH_LOCATION.
     */
    filePath?: string;
    /**
     * @property {string} [subscriptionEnvVariableName] - The subscriptionId environment variable
     * name. Default is "AZURE_SUBSCRIPTION_ID".
     */
    subscriptionEnvVariableName?: string;
}
/**
 * @interface LoginWithMSIOptions - Describes optional parameters for MSI authentication.
 */
export interface LoginWithMSIOptions {
    /**
     * @property {number} port - Port on which the MSI service is running on the host VM. Default port is 50342
     */
    port?: number;
    /**
     * @property {string} resource - The resource uri or token audience for which the token is needed.
     * For e.g. it can be:
     * - resourcemanagement endpoint "https://management.azure.com"(default)
     * - management endpoint "https://management.core.windows.net/"
     */
    resource?: string;
    /**
     * @property {string} aadEndpoint - The add endpoint for authentication. default - "https://login.microsoftonline.com"
     */
    aadEndpoint?: string;
}
/**
 * Provides a UserTokenCredentials object and the list of subscriptions associated with that userId across all the applicable tenants.
 * This method is applicable only for organizational ids that are not 2FA enabled otherwise please use interactive login.
 *
 * @param {string} username The user name for the Organization Id account.
 * @param {string} password The password for the Organization Id account.
 * @param {object} [options] Object representing optional parameters.
 * @param {string} [options.clientId] The active directory application client id.
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
 * then domain should also be provided and its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
 * @param {string} [options.domain] The domain or tenant id containing this application. Default value "common".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with.
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 *
 * @returns {Promise<AuthResponse>} A Promise that resolves to AuthResponse that contains "credentials" and optional "subscriptions" array and rejects with an Error.
 */
export declare function withUsernamePasswordWithAuthResponse(username: string, password: string, options?: LoginWithUsernamePasswordOptions): Promise<AuthResponse>;
/**
 * Provides an ApplicationTokenCredentials object and the list of subscriptions associated with that servicePrinicpalId/clientId across all the applicable tenants.
 *
 * @param {string} clientId The active directory application client id also known as the SPN (ServicePrincipal Name).
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 * @param {string} secret The application secret for the service principal.
 * @param {string} domain The domain or tenant id containing this application.
 * @param {object} [options] Object representing optional parameters.
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with.
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 *
 * @returns {Promise<AuthResponse>} A Promise that resolves to AuthResponse that contains "credentials" and optional "subscriptions" array and rejects with an Error.
 */
export declare function withServicePrincipalSecretWithAuthResponse(clientId: string, secret: string, domain: string, options?: AzureTokenCredentialsOptions): Promise<AuthResponse>;
/**
 * Before using this method please install az cli from https://github.com/Azure/azure-cli/releases. Then execute `az ad sp create-for-rbac --sdk-auth > ${yourFilename.json}`.
 * If you want to create the sp for a different cloud/environment then please execute:
 * 1. az cloud list
 * 2. az cloud set –n <name of the environment>
 * 3. az ad sp create-for-rbac --sdk-auth > auth.json
 *
 * If the service principal is already created then login with service principal info:
 * 3. az login --service-principal -u <clientId> -p <clientSecret> -t <tenantId>
 * 4. az account show --sdk-auth > auth.json
 *
 * Authenticates using the service principal information provided in the auth file. This method will set
 * the subscriptionId from the auth file to the user provided environment variable in the options
 * parameter or the default "AZURE_SUBSCRIPTION_ID".
 *
 * @param {object} [options] - Optional parameters
 * @param {string} [options.filePath] - Absolute file path to the auth file. If not provided
 * then please set the environment variable AZURE_AUTH_LOCATION.
 * @param {string} [options.subscriptionEnvVariableName] - The subscriptionId environment variable
 * name. Default is "AZURE_SUBSCRIPTION_ID".
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {Promise<AuthResponse>} A Promise that resolves to AuthResponse that contains "credentials" and optional "subscriptions" array and rejects with an Error.
 */
export declare function withAuthFileWithAuthResponse(options?: LoginWithAuthFileOptions): Promise<AuthResponse>;
/**
 * Provides a url and code that needs to be copy and pasted in a browser and authenticated over there. If successful, the user will get a
 * DeviceTokenCredentials object and the list of subscriptions associated with that userId across all the applicable tenants.
 *
 * @param {object} [options] Object representing optional parameters.
 *
 * @param {string} [options.clientId] The active directory application client id.
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 *
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph".If tokenAudience is provided
 * then domain should also be provided its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
 *
 * @param {string} [options.domain] The domain or tenant id containing this application. Default value is "common".
 *
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with. Default environment is "Public Azure".
 *
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 *
 * @param {object} [options.language] The language code specifying how the message should be localized to. Default value "en-us".
 *
 * @param {object|function} [options.userCodeResponseLogger] A logger that logs the user code response message required for interactive login. When
 * this option is specified the usercode response message will not be logged to console.
 *
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {Promise<AuthResponse>} A Promise that resolves to AuthResponse that contains "credentials" and optional "subscriptions" array and rejects with an Error.
 */
export declare function withInteractiveWithAuthResponse(options?: InteractiveLoginOptions): Promise<AuthResponse>;
/**
 * Before using this method please install az cli from https://github.com/Azure/azure-cli/releases. Then execute `az ad sp create-for-rbac --sdk-auth > ${yourFilename.json}`.
 * If you want to create the sp for a different cloud/environment then please execute:
 * 1. az cloud list
 * 2. az cloud set –n <name of the environment>
 * 3. az ad sp create-for-rbac --sdk-auth > auth.json
 *
 * If the service principal is already created then login with service principal info:
 * 3. az login --service-principal -u <clientId> -p <clientSecret> -t <tenantId>
 * 4. az account show --sdk-auth > auth.json
 *
 * Authenticates using the service principal information provided in the auth file. This method will set
 * the subscriptionId from the auth file to the user provided environment variable in the options
 * parameter or the default "AZURE_SUBSCRIPTION_ID".
 *
 * @param {object} [options] - Optional parameters
 * @param {string} [options.filePath] - Absolute file path to the auth file. If not provided
 * then please set the environment variable AZURE_AUTH_LOCATION.
 * @param {string} [options.subscriptionEnvVariableName] - The subscriptionId environment variable
 * name. Default is "AZURE_SUBSCRIPTION_ID".
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                               - The Error object if an error occurred, null otherwise.
 *                 {ApplicationTokenCredentials} [credentials]  - The ApplicationTokenCredentials object.
 *                 {Array}                [subscriptions]       - List of associated subscriptions across all the applicable tenants.
 *    {Promise} A promise is returned.
 *             @resolve {ApplicationTokenCredentials} The ApplicationTokenCredentials object.
 *             @reject {Error} - The error object.
 */
export declare function withAuthFile(): Promise<TokenCredentialsBase>;
export declare function withAuthFile(options: LoginWithAuthFileOptions): Promise<TokenCredentialsBase>;
export declare function withAuthFile(options: LoginWithAuthFileOptions, callback: {
    (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void;
}): void;
export declare function withAuthFile(callback: any): void;
/**
 * Provides a url and code that needs to be copy and pasted in a browser and authenticated over there. If successful, the user will get a
 * DeviceTokenCredentials object and the list of subscriptions associated with that userId across all the applicable tenants.
 *
 * @param {object} [options] Object representing optional parameters.
 * @param {string} [options.clientId] The active directory application client id.
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph".If tokenAudience is provided
 * then domain should also be provided its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
 * @param {string} [options.domain] The domain or tenant id containing this application. Default value is "common".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with. Default environment is "Public Azure".
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 * @param {object} [options.language] The language code specifying how the message should be localized to. Default value "en-us".
 * @param {object|function} [options.userCodeResponseLogger] A logger that logs the user code response message required for interactive login. When
 * this option is specified the usercode response message will not be logged to console.
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                           - The Error object if an error occurred, null otherwise.
 *                 {DeviceTokenCredentials} [credentials]   - The DeviceTokenCredentials object.
 *                 {Array}                [subscriptions]   - List of associated subscriptions across all the applicable tenants.
 *    {Promise} A promise is returned.
 *             @resolve {DeviceTokenCredentials} The DeviceTokenCredentials object.
 *             @reject {Error} - The error object.
 */
export declare function interactive(): Promise<TokenCredentialsBase>;
export declare function interactive(options: InteractiveLoginOptions): Promise<TokenCredentialsBase>;
export declare function interactive(options: InteractiveLoginOptions, callback: {
    (err: Error, credentials: DeviceTokenCredentials, subscriptions: Array<LinkedSubscription>): void;
}): void;
export declare function interactive(callback: any): void;
/**
 * Provides an ApplicationTokenCredentials object and the list of subscriptions associated with that servicePrinicpalId/clientId across all the applicable tenants.
 *
 * @param {string} clientId The active directory application client id also known as the SPN (ServicePrincipal Name).
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 * @param {string} secret The application secret for the service principal.
 * @param {string} domain The domain or tenant id containing this application.
 * @param {object} [options] Object representing optional parameters.
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with.
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                               - The Error object if an error occurred, null otherwise.
 *                 {ApplicationTokenCredentials} [credentials]  - The ApplicationTokenCredentials object.
 *                 {Array}                [subscriptions]       - List of associated subscriptions across all the applicable tenants.
 *    {Promise} A promise is returned.
 *             @resolve {ApplicationTokenCredentials} The ApplicationTokenCredentials object.
 *             @reject {Error} - The error object.
 */
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string): Promise<TokenCredentialsBase>;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: AzureTokenCredentialsOptions): Promise<TokenCredentialsBase>;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: AzureTokenCredentialsOptions, callback: {
    (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void;
}): void;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, callback: any): void;
/**
 * Provides a UserTokenCredentials object and the list of subscriptions associated with that userId across all the applicable tenants.
 * This method is applicable only for organizational ids that are not 2FA enabled otherwise please use interactive login.
 *
 * @param {string} username The user name for the Organization Id account.
 * @param {string} password The password for the Organization Id account.
 * @param {object} [options] Object representing optional parameters.
 * @param {string} [options.clientId] The active directory application client id.
 * See {@link https://azure.microsoft.com/en-us/documentation/articles/active-directory-devquickstarts-dotnet/ Active Directory Quickstart for .Net}
 * for an example.
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid value is "graph". If tokenAudience is provided
 * then domain should also be provided and its value should not be the default "common" tenant. It must be a string (preferrably in a guid format).
 * @param {string} [options.domain] The domain or tenant id containing this application. Default value "common".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with.
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                         - The Error object if an error occurred, null otherwise.
 *                 {UserTokenCredentials} [credentials]   - The UserTokenCredentials object.
 *                 {Array}                [subscriptions] - List of associated subscriptions across all the applicable tenants.
 *    {Promise} A promise is returned.
 *             @resolve {UserTokenCredentials} The UserTokenCredentials object.
 *             @reject {Error} - The error object.
 */
export declare function withUsernamePassword(username: string, password: string): Promise<TokenCredentialsBase>;
export declare function withUsernamePassword(username: string, password: string, options: LoginWithUsernamePasswordOptions): Promise<TokenCredentialsBase>;
export declare function withUsernamePassword(username: string, password: string, callback: any): void;
export declare function withUsernamePassword(username: string, password: string, options: LoginWithUsernamePasswordOptions, callback: {
    (err: Error, credentials: UserTokenCredentials, subscriptions: Array<LinkedSubscription>): void;
}): void;
/**
 * Before using this method please install az cli from https://github.com/Azure/azure-cli/releases.
 * If you have an Azure virtual machine provisioned with az cli and has MSI enabled,
 * you can then use this method to get auth tokens from the VM.
 *
 * To create a new VM, enable MSI, please execute this command:
 * az vm create -g <resource_group_name> -n <vm_name> --assign-identity --image <os_image_name>
 * Note: the above command enables a service endpoint on the host, with a default port 50342
 *
 * To enable MSI on a already provisioned VM, execute the following command:
 * az vm --assign-identity -g <resource_group_name> -n <vm_name> --port <custom_port_number>
 *
 * To know more about this command, please execute:
 * az vm --assign-identity -h
 *
 * Authenticates using the identity service running on an Azure virtual machine.
 * This method makes a request to the authentication service hosted on the VM
 * and gets back an access token.
 *
 * @param {string} [domain] - The domain or tenant id. This is a required parameter.
 * @param {object} [options] - Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed.
 * For e.g. it can be:
 * - resourcemanagement endpoint "https://management.azure.com"(default)
 * - management endpoint "https://management.core.windows.net/"
 * @param {string} [options.aadEndpoint] - The add endpoint for authentication. default - "https://login.microsoftonline.com"
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]            - The Error object if an error occurred, null otherwise.
 *                 {object} [tokenResponse]  - The tokenResponse (token_type and access_token are the two important properties)
 *    {Promise} A promise is returned.
 *             @resolve {MSITokenResponse} - The tokenResponse.
 *             @reject {Error} - The error object.
 */
export declare function withMSI(domain: string): Promise<MSITokenResponse>;
export declare function withMSI(domain: string, options: LoginWithMSIOptions): Promise<MSITokenResponse>;
export declare function withMSI(domain: string, options: LoginWithMSIOptions, callback: {
    (err: Error, credentials: MSITokenResponse): void;
}): void;
export declare function withMSI(domain: string, callback: any): any;
