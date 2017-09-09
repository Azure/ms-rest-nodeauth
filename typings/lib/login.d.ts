import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenCredentialsBase } from "./credentials/tokenCredentialsBase";
import { TokenAudience } from "./util/authConstants";
import { SubscriptionInfo } from "./subscriptionManagement/subscriptionUtils";
import { MSITokenResponse } from "./credentials/msiTokenCredentials";
/**
 * @interface OptionalInteractiveParameters - Describes optional parameters for serviceprincipal/secret authentication.
 */
export interface OptionalServicePrincipalParameters {
    tokenAudience?: TokenAudience;
    environment?: AzureEnvironment;
    tokenCache?: any;
}
/**
 * @interface OptionalInteractiveParameters - Describes optional parameters for username/password authentication.
 */
export interface OptionalUsernamePasswordParameters extends OptionalServicePrincipalParameters {
    clientId?: string;
    domain?: string;
}
/**
 * @interface OptionalInteractiveParameters - Describes optional parameters for interactive authentication.
 */
export interface OptionalInteractiveParameters extends OptionalUsernamePasswordParameters {
    /**
     * @property {object|function} [userCodeResponseLogger] A logger that logs the user code response message required for interactive login. When
     * this option is specified the usercode response message will not be logged to console.
     */
    userCodeResponseLogger?: any;
    /**
     * @property {string} [language] The language code specifying how the message should be localized to. Default value 'en-us'.
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
     * @property {Array<SubscriptionInfo>} [subscriptions] List of associated subscriptions.
     */
    subscriptions?: SubscriptionInfo[];
}
/**
 * @interface OptionalAuthFileParameters - Describes optional parameters for login withAuthFile.
 */
export interface OptionalAuthFileParameters {
    /**
     * @property {string} [filePath] - Absolute file path to the auth file. If not provided
     * then please set the environment variable AZURE_AUTH_LOCATION.
     */
    filePath?: string;
    /**
     * @property {string} [subscriptionEnvVariableName] - The subscriptionId environment variable
     * name. Default is 'AZURE_SUBSCRIPTION_ID'.
     */
    subscriptionEnvVariableName?: string;
}
/**
 * @interface OptionalMSIParameters - Describes optional parameters for MSI authentication.
 */
export interface OptionalMSIParameters {
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
export declare function withUsernamePasswordWithAuthResponse(username: string, password: string, options?: OptionalUsernamePasswordParameters): Promise<AuthResponse>;
export declare function withServicePrincipalSecretWithAuthResponse(clientId: string, secret: string, domain: string, options?: OptionalServicePrincipalParameters): Promise<AuthResponse>;
export declare function withAuthFileWithAuthResponse(options?: OptionalAuthFileParameters): Promise<AuthResponse>;
export declare function withInteractiveWithAuthResponse(options?: OptionalInteractiveParameters): Promise<AuthResponse>;
export declare function withAuthFile(): Promise<TokenCredentialsBase>;
export declare function withAuthFile(options: OptionalAuthFileParameters): Promise<TokenCredentialsBase>;
export declare function withAuthFile(options: OptionalAuthFileParameters, callback: Function): void;
export declare function withAuthFile(callback: any): void;
export declare function interactive(): Promise<TokenCredentialsBase>;
export declare function interactive(options: OptionalInteractiveParameters): Promise<TokenCredentialsBase>;
export declare function interactive(options: OptionalInteractiveParameters, callback: Function): void;
export declare function interactive(callback: any): void;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string): Promise<TokenCredentialsBase>;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: OptionalServicePrincipalParameters): Promise<TokenCredentialsBase>;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: OptionalServicePrincipalParameters, callback: Function): void;
export declare function withServicePrincipalSecret(clientId: string, secret: string, domain: string, callback: any): void;
export declare function withUsernamePassword(username: string, password: string): Promise<TokenCredentialsBase>;
export declare function withUsernamePassword(username: string, password: string, options: OptionalUsernamePasswordParameters): Promise<TokenCredentialsBase>;
export declare function withUsernamePassword(username: string, password: string, callback: any): void;
export declare function withUsernamePassword(username: string, password: string, options: OptionalUsernamePasswordParameters, callback: Function): void;
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
export declare function withMSI(domain: string, options: OptionalMSIParameters): Promise<MSITokenResponse>;
export declare function withMSI(domain: string, options: OptionalMSIParameters, callback: Function): void;
export declare function withMSI(domain: string, callback: any): any;
