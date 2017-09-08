// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

const adal = require("adal");
import * as fs from "fs";
import * as msRest from "ms-rest-ts";
import { AzureEnvironment } from "ms-rest-azure-env";
import { TokenResponse, TokenCredentialsBase } from "./credentials/tokenCredentialsBase";
import { ApplicationTokenCredentials } from "./credentials/applicationTokenCredentials";
import { DeviceTokenCredentials } from "./credentials/deviceTokenCredentials";
import { UserTokenCredentials } from "./credentials/userTokenCredentials";
import { AuthConstants, TokenAudience } from "./util/authConstants";
import { buildTenantList, getSubscriptionsFromTenants, SubscriptionInfo } from "./subscriptionManagement/subscriptionUtils";
import { MSITokenCredentials, MSITokenResponse } from "./credentials/msiTokenCredentials";

function turnOnLogging() {
  let log = adal.Logging;
  log.setLoggingOptions(
    {
      level: log.LOGGING_LEVEL.VERBOSE,
      log: function (level: any, message: any, error: any) {
        level;
        console.info(message);
        if (error) {
          console.error(error);
        }
      }
    });
}

if (process.env['AZURE_ADAL_LOGGING_ENABLED']) {
  turnOnLogging();
}

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
  userCodeResponseLogger?: any
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

export async function withUsernamePasswordWithAuthResponse(username: string, password: string, options?: OptionalUsernamePasswordParameters): Promise<AuthResponse> {
  if (!options) {
    options = {};
  }
  if (!options.clientId) {
    options.clientId = AuthConstants.DEFAULT_ADAL_CLIENT_ID;
  }
  if (!options.domain) {
    options.domain = AuthConstants.AAD_COMMON_TENANT;
  }
  let creds: UserTokenCredentials;
  let result: TokenResponse;
  let tenantList: string[] = [];
  let subscriptionList: SubscriptionInfo[] = [];
  try {
    creds = new UserTokenCredentials(options.clientId, options.domain, username, password, options.tokenAudience, options.environment);
    result = await creds.getToken();
    // The token cache gets propulated for all the tenants as a part of building the tenantList.
    tenantList = await buildTenantList(creds);
    // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
    if (!(options.tokenAudience && options.tokenAudience === TokenAudience.graph)) {
      subscriptionList = await getSubscriptionsFromTenants(creds, tenantList);
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
}

export async function withServicePrincipalSecretWithAuthResponse(clientId: string, secret: string, domain: string, options?: OptionalServicePrincipalParameters): Promise<AuthResponse> {
  if (!options) {
    options = {};
  }
  let creds: ApplicationTokenCredentials;
  let result: TokenResponse;
  let subscriptionList: SubscriptionInfo[] = [];
  try {
    creds = new ApplicationTokenCredentials(clientId, domain, secret, options.tokenAudience, options.environment);
    result = await creds.getToken();
    // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
    if (!(options.tokenAudience && options.tokenAudience === TokenAudience.graph)) {
      subscriptionList = await getSubscriptionsFromTenants(creds, [domain]);
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
}

function validateAuthFileContent(credsObj: any, filePath: string) {
  if (!credsObj) {
    throw new Error('Please provide a credsObj to validate.');
  }
  if (!filePath) {
    throw new Error('Please provide a filePath.');
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
  if (!authFileUrl || (authFileUrl && typeof authFileUrl.valueOf() !== 'string')) {
    throw new Error('authFileUrl cannot be null or undefined and must be of type string.');
  }

  if (!envUrl || (envUrl && typeof envUrl.valueOf() !== 'string')) {
    throw new Error('envUrl cannot be null or undefined and must be of type string.');
  }

  authFileUrl = authFileUrl.endsWith('/') ? authFileUrl.slice(0, -1) : authFileUrl;
  envUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return (authFileUrl.toLowerCase() === envUrl.toLowerCase());
}

export async function withAuthFileWithAuthResponse(options?: OptionalAuthFileParameters): Promise<AuthResponse> {
  if (!options) options = { filePath: '' };
  let filePath = options.filePath || process.env[AuthConstants.AZURE_AUTH_LOCATION];
  let subscriptionEnvVariableName = options.subscriptionEnvVariableName || 'AZURE_SUBSCRIPTION_ID';
  if (!filePath) {
    let msg = `Either provide an absolute file path to the auth file or set/export the environment variable - ${AuthConstants.AZURE_AUTH_LOCATION}.`;
    return Promise.reject(new Error(msg));
  }
  let content: string, credsObj: any = {}, optionsForSpSecret: any = {};
  try {
    content = fs.readFileSync(filePath, { encoding: 'utf8' });
    credsObj = JSON.parse(content);
    validateAuthFileContent(credsObj, filePath);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!credsObj.managementEndpointUrl) {
    credsObj.managementEndpointUrl = credsObj.resourceManagerEndpointUrl;
  }
  //setting the subscriptionId from auth file to the environment variable
  process.env[subscriptionEnvVariableName] = credsObj.subscriptionId;
  //get the AzureEnvironment or create a new AzureEnvironment based on the info provided in the auth file
  let envFound: any = {
    name: ''
  };
  let envNames = Object.keys(Object.getPrototypeOf(AzureEnvironment)).slice(1);
  for (let i = 0; i < envNames.length; i++) {
    let env = envNames[i];
    let environmentObj = (AzureEnvironment as any)[env];
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
    //create a new environment with provided info.
    let envParams: any = {
      //try to find a logical name or set the filepath as the env name.
      name: credsObj.managementEndpointUrl.match(/.*management\.core\.(.*)\..*/i)[1] || filePath
    };
    let keys = Object.keys(credsObj);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (key.match(/^(clientId|clientSecret|subscriptionId|tenantId)$/ig) === null) {
        if (key === 'activeDirectoryEndpointUrl' && !key.endsWith('/')) {
          envParams[key] = credsObj[key] + '/';
        } else {
          envParams[key] = credsObj[key];
        }
      }
    }
    if (!envParams.activeDirectoryResourceId) {
      envParams.activeDirectoryResourceId = credsObj.managementEndpointUrl;
    }
    if (!envParams.portalUrl) {
      envParams.portalUrl = 'https://portal.azure.com';
    }
    optionsForSpSecret.environment = AzureEnvironment.add(envParams);
  }
  return withServicePrincipalSecretWithAuthResponse(credsObj.clientId, credsObj.clientSecret, credsObj.tenantId, optionsForSpSecret);
}



export async function withInteractiveWithAuthResponse(options?: OptionalInteractiveParameters): Promise<AuthResponse> {
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
  let interactiveOptions: any = {};
  interactiveOptions.tokenAudience = options.tokenAudience;
  interactiveOptions.environment = options.environment;
  interactiveOptions.domain = options.domain;
  interactiveOptions.clientId = options.clientId;
  interactiveOptions.tokenCache = options.tokenCache;
  interactiveOptions.language = options.language;
  interactiveOptions.userCodeResponseLogger = options.userCodeResponseLogger;
  let authorityUrl: string = interactiveOptions.environment.activeDirectoryEndpointUrl + interactiveOptions.domain;
  let authContext: any = new adal.AuthenticationContext(authorityUrl, interactiveOptions.environment.validateAuthority, interactiveOptions.tokenCache);
  interactiveOptions.context = authContext;
  let tenantList: string[] = [];
  let subscriptionList: SubscriptionInfo[] = [];
  let getUserCode = new Promise<any>((resolve, reject) => {
    return authContext.acquireUserCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, interactiveOptions.language, (err: Error, userCodeResponse: any) => {
      if (err) {
        return reject(err);
      }
      if (interactiveOptions.userCodeResponseLogger) {
        interactiveOptions.userCodeResponseLogger(userCodeResponse.message);
      } else {
        console.log(userCodeResponse.message);
      }
      return resolve(userCodeResponse.message);
    });
  });

  return getUserCode.then((userCodeResponse) => {
    return authContext.acquireTokenWithDeviceCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, userCodeResponse, async (error: Error, tokenResponse: any) => {
      if (error) {
        return Promise.reject(error);
      }
      interactiveOptions.username = tokenResponse.userId;
      interactiveOptions.authorizationScheme = tokenResponse.tokenType;
      try {
        let creds: DeviceTokenCredentials = new DeviceTokenCredentials(interactiveOptions.clientId,
          interactiveOptions.domain, interactiveOptions.userName, interactiveOptions.tokenAudience,
          interactiveOptions.environment, interactiveOptions.tokenCache);
        tenantList = await buildTenantList(creds);
        if (!(interactiveOptions.tokenAudience && interactiveOptions.tokenAudience === TokenAudience.graph)) {
          subscriptionList = await getSubscriptionsFromTenants(creds, tenantList);
        }
        return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
      } catch (err) {
        return Promise.reject(err);
      }
    });
  });
}

export function withAuthFile(): Promise<TokenCredentialsBase>;
export function withAuthFile(options: OptionalAuthFileParameters): Promise<TokenCredentialsBase>;
export function withAuthFile(options: OptionalAuthFileParameters, callback: Function): void
export function withAuthFile(callback: any): void
export function withAuthFile(options?: OptionalAuthFileParameters, callback?: Function): any {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  let cb = callback as Function;
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
      return cb(null, authRes.credentials, authRes.subscriptions);
    });
  }
}

export function interactive(): Promise<TokenCredentialsBase>;
export function interactive(options: OptionalInteractiveParameters): Promise<TokenCredentialsBase>;
export function interactive(options: OptionalInteractiveParameters, callback: Function): void
export function interactive(callback: any): void
export function interactive(options?: OptionalInteractiveParameters, callback?: Function): any {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  let cb = callback as Function;
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
      return cb(null, authRes.credentials, authRes.subscriptions);
    });
  }
}

export function withServicePrincipalSecret(clientId: string, secret: string, domain: string): Promise<TokenCredentialsBase>;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: OptionalServicePrincipalParameters): Promise<TokenCredentialsBase>;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options: OptionalServicePrincipalParameters, callback: Function): void
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, callback: any): void;
export function withServicePrincipalSecret(clientId: string, secret: string, domain: string, options?: OptionalServicePrincipalParameters, callback?: Function): any {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  let cb = callback as Function;
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
      return cb(null, authRes.credentials, authRes.subscriptions);
    });
  }
}

export function withUsernamePassword(username: string, password: string): Promise<TokenCredentialsBase>;
export function withUsernamePassword(username: string, password: string, options: OptionalUsernamePasswordParameters): Promise<TokenCredentialsBase>;
export function withUsernamePassword(username: string, password: string, callback: any): void;
export function withUsernamePassword(username: string, password: string, options: OptionalUsernamePasswordParameters, callback: Function): void;
export function withUsernamePassword(username: string, password: string, options?: OptionalUsernamePasswordParameters, callback?: Function): any {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  let cb = callback as Function;
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
      return cb(null, authRes.credentials, authRes.subscriptions);
    });
  }
}

/**
 * Initializes MSITokenCredentials class and calls getToken and returns a token response.
 * 
 * @param {string} domain -- required. The tenant id.
 * @param {object} options -- Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed. Default - "https://management.azure.com"
 * @param {string} [options.aadEndpoint] - The add endpoint for authentication. default - "https://login.microsoftonline.com"
 * @param {any} callback - the callback function.
 */
function _withMSI(domain: string, options?: OptionalMSIParameters): Promise<MSITokenResponse> {
  if (!options) {
    options = {};
  }
  const creds = new MSITokenCredentials(domain, options.port, options.resource, options.aadEndpoint);
  return creds.getToken();
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
export function withMSI(domain: string): Promise<MSITokenResponse>;
export function withMSI(domain: string, options: OptionalMSIParameters): Promise<MSITokenResponse>;
export function withMSI(domain: string, options: OptionalMSIParameters, callback: Function): void
export function withMSI(domain: string, callback: any): any
export function withMSI(domain: string, options?: OptionalMSIParameters, callback?: Function): any {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }
  let cb = callback as Function;
  if (!callback) {
    return _withMSI(domain, options);
  } else {
    msRest.promiseToCallback(_withMSI(domain, options))((err: Error, tokenRes: MSITokenResponse) => {
      if (err) {
        return cb(err);
      }
      return cb(null, tokenRes);
    });
  }
}

