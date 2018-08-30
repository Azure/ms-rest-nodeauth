// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as adal from "adal-node";
import * as fs from "fs";
import * as msRest from "ms-rest-js";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenCredentialsBase } from "./credentials/tokenCredentialsBase";
import { ApplicationTokenCredentials } from "./credentials/applicationTokenCredentials";
import { DeviceTokenCredentials } from "./credentials/deviceTokenCredentials";
import { UserTokenCredentials } from "./credentials/userTokenCredentials";
import { AuthConstants, TokenAudience } from "./util/authConstants";
import { buildTenantList, getSubscriptionsFromTenants, LinkedSubscription } from "./subscriptionManagement/subscriptionUtils";
import { MSITokenCredentials } from "./credentials/msiTokenCredentials";
import { MSIVmTokenCredentials } from "./credentials/msiVmTokenCredentials";
import { MSIAppServiceTokenCredentials } from "./credentials/msiAppServiceTokenCredentials";

function turnOnLogging() {
  const log = adal.Logging;
  log.setLoggingOptions(
    {
      level: (<any>adal.LoggingLevel)("VERBOSE"),
      log: function (level: any, message: any, error: any) {
        level;
        console.info(message);
        if (error) {
          console.error(error);
        }
      }
    });
}

if (process.env["AZURE_ADAL_LOGGING_ENABLED"]) {
  turnOnLogging();
}

/**
 * @interface AzureTokenCredentialsOptions - Describes optional parameters for serviceprincipal/secret authentication.
 */
export interface AzureTokenCredentialsOptions {
  /**
   * @property {TokenAudience} [tokenAudience] - The audience for which the token is requested. Valid values are 'graph', 'batch', or any other resource like 'https://vault.azure.com/'.
   * If tokenAudience is 'graph' then domain should also be provided and its value should not be the default 'common' tenant. It must be a string (preferrably in a guid format).
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
 * @interface MSIOptions Defines the optional parameters for authentication with MSI.
 */
export interface MSIOptions {
  /**
   * @prop {string} [resource] -  The resource uri or token audience for which the token is needed.
   * For e.g. it can be:
   * - resourcemanagement endpoint "https://management.azure.com"(default)
   * - management endpoint "https://management.core.windows.net/"
   */
  resource?: string;
}

/**
 * @interface MSIAppServiceOptions Defines the optional parameters for authentication with MSI for AppService.
 */
export interface MSIAppServiceOptions extends MSIOptions {
  /**
   * @property {string} [msiEndpoint] - The local URL from which your app can request tokens.
   * Either provide this parameter or set the environment varaible `MSI_ENDPOINT`.
   * For example: `export MSI_ENDPOINT="http://127.0.0.1:41741/MSI/token/"`
   */
  msiEndpoint?: string;
  /**
   * @property {string} [msiSecret] - The secret used in communication between your code and the local MSI agent.
   * Either provide this parameter or set the environment varaible `MSI_SECRET`.
   * For example: `export MSI_SECRET="69418689F1E342DD946CB82994CDA3CB"`
   */
  msiSecret?: string;
  /**
   * @property {string} [msiApiVersion] - The api-version of the local MSI agent. Default value is "2017-09-01".
   */
  msiApiVersion?: string;
}

/**
 * @interface MSIVmOptions Defines the optional parameters for authentication with MSI for Virtual Machine.
 */
export interface MSIVmOptions extends MSIOptions {
  /**
   * @prop {number} [port] - port on which the MSI service is running on the host VM. Default port is 50342
   */
  port?: number;
}

export interface TokenResponse extends adal.TokenResponse {
  /**
   * @property {number} [notBefore] The time from which the access token becomes usable.
   * The date is represented as the number of seconds from 1970-01-01T0:0:0Z UTC until time of validity for the token.
   */
  notBefore?: number;

  [x: string]: any;
}

/**
 * Generic callback type definition.
 *
 * @property {Error} error - The error occurred if any, while executing the request; otherwise undefined
 * @property {TResult} result - Result when call was successful.
 */
export type Callback<TResult> = (error?: Error, result?: TResult) => void;
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
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid values are 'graph', 'batch', or any other resource like 'https://vault.azure.com/'.
 * If tokenAudience is 'graph' then domain should also be provided and its value should not be the default 'common' tenant. It must be a string (preferrably in a guid format).
 * @param {string} [options.domain] The domain or tenant id containing this application. Default value "common".
 * @param {AzureEnvironment} [options.environment] The azure environment to authenticate with.
 * @param {object} [options.tokenCache] The token cache. Default value is the MemoryCache object from adal.
 *
 * @returns {Promise<AuthResponse>} A Promise that resolves to AuthResponse that contains "credentials" and optional "subscriptions" array and rejects with an Error.
 */
export async function withUsernamePasswordWithAuthResponse(username: string, password: string, options?: LoginWithUsernamePasswordOptions): Promise<AuthResponse> {
  if (!options) {
    options = {};
  }
  if (!options.clientId) {
    options.clientId = AuthConstants.DEFAULT_ADAL_CLIENT_ID;
  }
  if (!options.domain) {
    options.domain = AuthConstants.AAD_COMMON_TENANT;
  }
  if (!options.environment) {
    options.environment = AzureEnvironment.Azure;
  }
  let creds: UserTokenCredentials;
  let tenantList: string[] = [];
  let subscriptionList: LinkedSubscription[] = [];
  try {
    creds = new UserTokenCredentials(options.clientId, options.domain, username, password, options.tokenAudience, options.environment);
    await creds.getToken();
    // The token cache gets propulated for all the tenants as a part of building the tenantList.
    tenantList = await buildTenantList(creds);
    // We only need to get the subscriptionList if the tokenAudience is for a management client.
    if (options.tokenAudience && options.tokenAudience === options.environment.activeDirectoryResourceId) {
      subscriptionList = await getSubscriptionsFromTenants(creds, tenantList);
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
}

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
export async function withServicePrincipalSecretWithAuthResponse(clientId: string, secret: string, domain: string, options?: AzureTokenCredentialsOptions): Promise<AuthResponse> {
  if (!options) {
    options = {};
  }
  if (!options.environment) {
    options.environment = AzureEnvironment.Azure;
  }
  let creds: ApplicationTokenCredentials;
  let subscriptionList: LinkedSubscription[] = [];
  try {
    creds = new ApplicationTokenCredentials(clientId, domain, secret, options.tokenAudience, options.environment);
    await creds.getToken();
    // We only need to get the subscriptionList if the tokenAudience is for a management client.
    if (options.tokenAudience && options.tokenAudience === options.environment.activeDirectoryResourceId) {
      subscriptionList = await getSubscriptionsFromTenants(creds, [domain]);
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
}

function validateAuthFileContent(credsObj: any, filePath: string) {
  if (!credsObj) {
    throw new Error("Please provide a credsObj to validate.");
  }
  if (!filePath) {
    throw new Error("Please provide a filePath.");
  }
  if (!credsObj.clientId) {
    throw new Error(`"clientId" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.clientSecret) {
    throw new Error(`"clientSecret" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.subscriptionId) {
    throw new Error(`"subscriptionId" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.tenantId) {
    throw new Error(`"tenantId" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.activeDirectoryEndpointUrl) {
    throw new Error(`"activeDirectoryEndpointUrl" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.resourceManagerEndpointUrl) {
    throw new Error(`"resourceManagerEndpointUrl" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.activeDirectoryGraphResourceId) {
    throw new Error(`"activeDirectoryGraphResourceId" is missing from the auth file: ${filePath}.`);
  }
  if (!credsObj.sqlManagementEndpointUrl) {
    throw new Error(`"sqlManagementEndpointUrl" is missing from the auth file: ${filePath}.`);
  }
}

function foundManagementEndpointUrl(authFileUrl: string, envUrl: string): boolean {
  if (!authFileUrl || (authFileUrl && typeof authFileUrl.valueOf() !== "string")) {
    throw new Error("authFileUrl cannot be null or undefined and must be of type string.");
  }

  if (!envUrl || (envUrl && typeof envUrl.valueOf() !== "string")) {
    throw new Error("envUrl cannot be null or undefined and must be of type string.");
  }

  authFileUrl = authFileUrl.endsWith("/") ? authFileUrl.slice(0, -1) : authFileUrl;
  envUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  return (authFileUrl.toLowerCase() === envUrl.toLowerCase());
}

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
export async function withAuthFileWithAuthResponse(options?: LoginWithAuthFileOptions): Promise<AuthResponse> {
  if (!options) options = { filePath: "" };
  const filePath = options.filePath || process.env[AuthConstants.AZURE_AUTH_LOCATION];
  const subscriptionEnvVariableName = options.subscriptionEnvVariableName || "AZURE_SUBSCRIPTION_ID";
  if (!filePath) {
    const msg = `Either provide an absolute file path to the auth file or set/export the environment variable - ${AuthConstants.AZURE_AUTH_LOCATION}.`;
    return Promise.reject(new Error(msg));
  }
  let content: string, credsObj: any = {};
  const optionsForSpSecret: any = {};
  try {
    content = fs.readFileSync(filePath, { encoding: "utf8" });
    credsObj = JSON.parse(content);
    validateAuthFileContent(credsObj, filePath);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!credsObj.managementEndpointUrl) {
    credsObj.managementEndpointUrl = credsObj.resourceManagerEndpointUrl;
  }
  // setting the subscriptionId from auth file to the environment variable
  process.env[subscriptionEnvVariableName] = credsObj.subscriptionId;
  // get the AzureEnvironment or create a new AzureEnvironment based on the info provided in the auth file
  const envFound: any = {
    name: ""
  };
  const envNames = Object.keys(AzureEnvironment);
  for (let i = 0; i < envNames.length; i++) {
    const env = envNames[i];
    const environmentObj = (AzureEnvironment as any)[env];
    if (environmentObj &&
      environmentObj.managementEndpointUrl &&
      foundManagementEndpointUrl(credsObj.managementEndpointUrl, environmentObj.managementEndpointUrl)) {
      envFound.name = environmentObj.name;
      break;
    }
  }
  if (envFound.name) {
    optionsForSpSecret.environment = (AzureEnvironment as any)[envFound.name];
  } else {
    // create a new environment with provided info.
    const envParams: any = {
      // try to find a logical name or set the filepath as the env name.
      name: credsObj.managementEndpointUrl.match(/.*management\.core\.(.*)\..*/i)[1] || filePath
    };
    const keys = Object.keys(credsObj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.match(/^(clientId|clientSecret|subscriptionId|tenantId)$/ig) === null) {
        if (key === "activeDirectoryEndpointUrl" && !key.endsWith("/")) {
          envParams[key] = credsObj[key] + "/";
        } else {
          envParams[key] = credsObj[key];
        }
      }
    }
    if (!envParams.activeDirectoryResourceId) {
      envParams.activeDirectoryResourceId = credsObj.managementEndpointUrl;
    }
    if (!envParams.portalUrl) {
      envParams.portalUrl = "https://portal.azure.com";
    }
    optionsForSpSecret.environment = AzureEnvironment.add(envParams);
  }
  return withServicePrincipalSecretWithAuthResponse(credsObj.clientId, credsObj.clientSecret, credsObj.tenantId, optionsForSpSecret);
}


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
export async function withInteractiveWithAuthResponse(options?: InteractiveLoginOptions): Promise<AuthResponse> {
  if (!options) {
    options = {};
  }
  if (!options) {
    options = {};
  }
  if (!options.environment) {
    options.environment = AzureEnvironment.Azure;
  }

  if (!options.domain) {
    options.domain = AuthConstants.AAD_COMMON_TENANT;
  }

  if (!options.clientId) {
    options.clientId = AuthConstants.DEFAULT_ADAL_CLIENT_ID;
  }

  if (!options.tokenCache) {
    options.tokenCache = new adal.MemoryCache();
  }

  if (!options.language) {
    options.language = AuthConstants.DEFAULT_LANGUAGE;
  }

  if (!options.tokenAudience) {
    options.tokenAudience = options.environment.activeDirectoryResourceId;
  }
  const interactiveOptions: any = {};
  interactiveOptions.tokenAudience = options.tokenAudience;
  interactiveOptions.environment = options.environment;
  interactiveOptions.domain = options.domain;
  interactiveOptions.clientId = options.clientId;
  interactiveOptions.tokenCache = options.tokenCache;
  interactiveOptions.language = options.language;
  interactiveOptions.userCodeResponseLogger = options.userCodeResponseLogger;
  const authorityUrl: string = interactiveOptions.environment.activeDirectoryEndpointUrl + interactiveOptions.domain;
  const authContext: any = new adal.AuthenticationContext(authorityUrl, interactiveOptions.environment.validateAuthority, interactiveOptions.tokenCache);
  interactiveOptions.context = authContext;
  let userCodeResponse: any;
  let creds: DeviceTokenCredentials;

  function tryAcquireToken(interactiveOptions: InteractiveLoginOptions, resolve: any, reject: any) {
    authContext.acquireUserCode(interactiveOptions.tokenAudience, interactiveOptions.clientId, interactiveOptions.language, (err: any, userCodeRes: any) => {
      if (err) {
        if (err.error === "authorization_pending") {
          setTimeout(() => {
            tryAcquireToken(interactiveOptions, resolve, reject);
          }, 1000);
        } else {
          return reject(err);
        }
      }
      userCodeResponse = userCodeRes;
      if (interactiveOptions.userCodeResponseLogger) {
        interactiveOptions.userCodeResponseLogger(userCodeResponse.message);
      } else {
        console.log(userCodeResponse.message);
      }
      return resolve(userCodeResponse);
    });
  }

  const getUserCode = new Promise<any>((resolve, reject) => {
    return tryAcquireToken(interactiveOptions, resolve, reject);
  });

  function getSubscriptions(creds: DeviceTokenCredentials, tenants: string[]): Promise<LinkedSubscription[]> {
    if (interactiveOptions.tokenAudience && interactiveOptions.tokenAudience === interactiveOptions.environment.activeDirectoryResourceId) {
      return getSubscriptionsFromTenants(creds, tenants);
    }
    return Promise.resolve(([] as any[]));
  }

  return getUserCode.then(() => {
    return new Promise<DeviceTokenCredentials>((resolve, reject) => {
      return authContext.acquireTokenWithDeviceCode(interactiveOptions.tokenAudience, interactiveOptions.clientId, userCodeResponse, (error: Error, tokenResponse: any) => {
        if (error) {
          return reject(error);
        }
        interactiveOptions.userName = tokenResponse.userId;
        interactiveOptions.authorizationScheme = tokenResponse.tokenType;
        try {
          creds = new DeviceTokenCredentials(interactiveOptions.clientId, interactiveOptions.domain, interactiveOptions.userName,
            interactiveOptions.tokenAudience, interactiveOptions.environment, interactiveOptions.tokenCache);
        } catch (err) {
          return reject(err);
        }
        return resolve(creds);
      });
    });
  }).then((creds) => {
    return buildTenantList(creds);
  }).then((tenants) => {
    return getSubscriptions(creds, tenants);
  }).then((subscriptions) => {
    return Promise.resolve({ credentials: creds, subscriptions: subscriptions });
  });
}

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
export function withAuthFile(): Promise<TokenCredentialsBase>;
export function withAuthFile(options: LoginWithAuthFileOptions): Promise<TokenCredentialsBase>;
export function withAuthFile(options: LoginWithAuthFileOptions, callback: { (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): void;
export function withAuthFile(callback: any): void;
export function withAuthFile(options?: LoginWithAuthFileOptions, callback?: { (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): any {
  if (!callback && typeof options === "function") {
    callback = options;
    options = undefined;
  }
  const cb = callback as Function;
  if (!callback) {
    return withAuthFileWithAuthResponse(options).then((authRes) => {
      return Promise.resolve(authRes.credentials);
    }).catch((err) => {
      return Promise.reject(err);
    });
  } else {
    msRest.promiseToCallback(withAuthFileWithAuthResponse(options))((err: Error, authRes: AuthResponse) => {
      if (err) {
        return cb(err);
      }
      return cb(undefined, authRes.credentials, authRes.subscriptions);
    });
  }
}

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
export function interactive(): Promise<TokenCredentialsBase>;
export function interactive(options: InteractiveLoginOptions): Promise<TokenCredentialsBase>;
export function interactive(options: InteractiveLoginOptions, callback: { (err: Error, credentials: DeviceTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): void;
export function interactive(callback: any): void;
export function interactive(options?: InteractiveLoginOptions, callback?: { (err: Error, credentials: DeviceTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): any {
  if (!callback && typeof options === "function") {
    callback = options;
    options = undefined;
  }
  const cb = callback as Function;
  if (!callback) {
    return withInteractiveWithAuthResponse(options).then((authRes) => {
      return Promise.resolve(authRes.credentials);
    }).catch((err) => {
      return Promise.reject(err);
    });
  } else {
    msRest.promiseToCallback(withInteractiveWithAuthResponse(options))((err: Error, authRes: AuthResponse) => {
      if (err) {
        return cb(err);
      }
      return cb(undefined, authRes.credentials, authRes.subscriptions);
    });
  }
}

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
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string): Promise<TokenCredentialsBase>;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: AzureTokenCredentialsOptions): Promise<TokenCredentialsBase>;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: AzureTokenCredentialsOptions, callback: { (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): void;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, callback: any): void;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options?: AzureTokenCredentialsOptions, callback?: { (err: Error, credentials: ApplicationTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): any {
  if (!callback && typeof options === "function") {
    callback = options;
    options = undefined;
  }
  const cb = callback as Function;
  if (!callback) {
    return withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options).then((authRes) => {
      return Promise.resolve(authRes.credentials);
    }).catch((err) => {
      return Promise.reject(err);
    });
  } else {
    msRest.promiseToCallback(withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options))((err: Error, authRes: AuthResponse) => {
      if (err) {
        return cb(err);
      }
      return cb(undefined, authRes.credentials, authRes.subscriptions);
    });
  }
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
 * @param {string} [options.tokenAudience] The audience for which the token is requested. Valid values are 'graph', 'batch', or any other resource like 'https://vault.azure.com/'.
 * If tokenAudience is 'graph' then domain should also be provided and its value should not be the default 'common' tenant. It must be a string (preferrably in a guid format).
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
export function withUsernamePassword(username: string, password: string): Promise<TokenCredentialsBase>;
export function withUsernamePassword(username: string, password: string, options: LoginWithUsernamePasswordOptions): Promise<TokenCredentialsBase>;
export function withUsernamePassword(username: string, password: string, callback: any): void;
export function withUsernamePassword(username: string, password: string, options: LoginWithUsernamePasswordOptions, callback: { (err: Error, credentials: UserTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): void;
export function withUsernamePassword(username: string, password: string, options?: LoginWithUsernamePasswordOptions, callback?: { (err: Error, credentials: UserTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): any {
  if (!callback && typeof options === "function") {
    callback = options;
    options = undefined;
  }
  const cb = callback as Function;
  if (!callback) {
    return withUsernamePasswordWithAuthResponse(username, password, options).then((authRes) => {
      return Promise.resolve(authRes.credentials);
    }).catch((err) => {
      return Promise.reject(err);
    });
  } else {
    msRest.promiseToCallback(withUsernamePasswordWithAuthResponse(username, password, options))((err: Error, authRes: AuthResponse) => {
      if (err) {
        return cb(err);
      }
      return cb(undefined, authRes.credentials, authRes.subscriptions);
    });
  }
}

/**
 * Initializes MSITokenCredentials class and calls getToken and returns a token response.
 *
 * @param {object} options - Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed. Default - "https://management.azure.com"
 * @param {any} callback - the callback function.
 */
function _withMSI(options?: MSIOptions, callback?: Callback<MSITokenCredentials>): void {
  if (!callback) {
    throw new Error("callback cannot be null or undefined.");
  }
  const creds = new MSIVmTokenCredentials(options);
  creds.getToken(function (err: Error) {
    if (err) return callback(err);
    return callback(undefined, creds);
  });
}

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
 * @param {object} [options] - Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed.
 * For e.g. it can be:
 * - resourcemanagement endpoint "https://management.azure.com"(default)
 * - management endpoint "https://management.core.windows.net/"
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                               - The Error object if an error occurred, null otherwise.
 *                 {object} [tokenResponse]                     - The tokenResponse (tokenType and accessToken are the two important properties)
 *    {Promise} A promise is returned.
 *             @resolve {object} - tokenResponse.
 *             @reject {Error} - error object.
 */
export function loginWithMSI(): Promise<MSITokenCredentials>;
export function loginWithMSI(options: MSIOptions): Promise<MSITokenCredentials>;
export function loginWithMSI(options: MSIOptions, callback: Callback<MSITokenCredentials>): void
export function loginWithMSI(callback: Callback<MSITokenCredentials>): void;
export function loginWithMSI(options?: MSIOptions | Callback<MSITokenCredentials>, callback?: Callback<MSITokenCredentials>): void | Promise<MSITokenCredentials> {
  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }
  if (!callback) {
    return new Promise((resolve, reject) => {
      _withMSI(options, (err: Error, credentials: MSITokenCredentials) => {
        if (err) { reject(err); }
        else { resolve(credentials); }
        return;
      });
    });
  } else {
    return _withMSI(options, callback);
  }
}

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
 * @param {object} [options] - Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed.
 * For e.g. it can be:
 * - resourcemanagement endpoint "https://management.azure.com"(default)
 * - management endpoint "https://management.core.windows.net/"
 * @param {function} [optionalCallback] The optional callback.
 *
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 *
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                               - The Error object if an error occurred, null otherwise.
 *                 {object} [tokenResponse]                     - The tokenResponse (tokenType and accessToken are the two important properties)
 *    {Promise} A promise is returned.
 *             @resolve {object} - tokenResponse.
 *             @reject {Error} - error object.
 */
/*
export function interactive(): Promise<TokenCredentialsBase>;
export function interactive(options: InteractiveLoginOptions): Promise<TokenCredentialsBase>;
export function interactive(options: InteractiveLoginOptions, callback: { (err: Error, credentials: DeviceTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): void;
export function interactive(callback: any): void;
export function interactive(options?: InteractiveLoginOptions, callback?: { (err: Error, credentials: DeviceTokenCredentials, subscriptions: Array<LinkedSubscription>): void }): any {
*/

export function loginWithVmMSI(): Promise<MSIVmTokenCredentials>;
export function loginWithVmMSI(options: MSIVmOptions): Promise<MSIVmTokenCredentials>;
export function loginWithVmMSI(options: MSIVmOptions, callback: Callback<MSIVmTokenCredentials>): void;
export function loginWithVmMSI(callback: Callback<MSIVmTokenCredentials>): void;
export function loginWithVmMSI(options?: MSIVmOptions | Callback<MSIVmTokenCredentials>, callback?: Callback<MSIVmTokenCredentials>): void | Promise<MSIVmTokenCredentials> {
  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }
  if (!callback) {
    return new Promise((resolve, reject) => {
      _withAppServiceMSI(options, (err, credentials) => {
        if (err) { reject(err); }
        else { resolve(credentials); }
        return;
      });
    });
  } else {
    return _withAppServiceMSI(options, callback);
  }
}

loginWithVmMSI()

/**
 * Private method
 */
function _withAppServiceMSI(options, callback) {
  if (!callback) {
    throw new Error("callback cannot be null or undefined.");
  }
  let creds: MSIAppServiceTokenCredentials;
  try {
    creds = new MSIAppServiceTokenCredentials(options);
  } catch (err) {
    return callback(err);
  }
  creds.getToken(function (err) {
    if (err) return callback(err);
    return callback(undefined, creds);
  });
}

/**
 * Authenticate using the App Service MSI.
 * @param {object} [options] - Optional parameters
 * @param {string} [options.msiEndpoint] - The local URL from which your app can request tokens.
 * Either provide this parameter or set the environment varaible `MSI_ENDPOINT`.
 * For example: `MSI_ENDPOINT="http://127.0.0.1:41741/MSI/token/"`
 * @param {string} [options.msiSecret] - The secret used in communication between your code and the local MSI agent.
 * Either provide this parameter or set the environment varaible `MSI_SECRET`.
 * For example: `MSI_SECRET="69418689F1E342DD946CB82994CDA3CB"`
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed.
 * For example, it can be:
 * - resourcemanagement endpoint "https://management.azure.com"(default) 
 * - management endpoint "https://management.core.windows.net/"
 * @param {string} [options.msiApiVersion] - The api-version of the local MSI agent. Default value is "2017-09-01".
 * @param {function} [optionalCallback] -  The optional callback.
 * @returns {function | Promise} If a callback was passed as the last parameter then it returns the callback else returns a Promise.
 * 
 *    {function} optionalCallback(err, credentials)
 *                 {Error}  [err]                               - The Error object if an error occurred, null otherwise.
 *                 {object} [tokenResponse]                     - The tokenResponse (tokenType and accessToken are the two important properties)
 *    {Promise} A promise is returned.
 *             @resolve {object} - tokenResponse.
 *             @reject {Error} - error object.
 */
export function loginWithAppServiceMSI(callback: { (err: Error, credentials: MSIAppServiceTokenCredentials): void }): void;
export function loginWithAppServiceMSI(options?: MSIAppServiceOptions): Promise<MSIAppServiceTokenCredentials>;
export function loginWithAppServiceMSI(options: MSIAppServiceOptions, callback: { (err: Error, credentials: MSIAppServiceTokenCredentials): void }): void {
  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }
  if (!callback) {
    return new Promise((resolve, reject) => {
      _withAppServiceMSI(options, (err, credentials) => {
        if (err) { reject(err); }
        else { resolve(credentials); }
        return;
      });
    });
  } else {
    return _withAppServiceMSI(options, callback);
  }
}
