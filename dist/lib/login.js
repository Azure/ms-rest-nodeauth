"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const adal = require("adal-node");
const fs = require("fs");
const msRest = require("ms-rest-js");
const ms_rest_azure_env_1 = require("ms-rest-azure-env");
const applicationTokenCredentials_1 = require("./credentials/applicationTokenCredentials");
const deviceTokenCredentials_1 = require("./credentials/deviceTokenCredentials");
const userTokenCredentials_1 = require("./credentials/userTokenCredentials");
const authConstants_1 = require("./util/authConstants");
const subscriptionUtils_1 = require("./subscriptionManagement/subscriptionUtils");
const msiTokenCredentials_1 = require("./credentials/msiTokenCredentials");
function turnOnLogging() {
    const log = adal.Logging;
    log.setLoggingOptions({
        level: log.LOGGING_LEVEL.VERBOSE,
        log: function (level, message, error) {
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
function withUsernamePasswordWithAuthResponse(username, password, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options) {
            options = {};
        }
        if (!options.clientId) {
            options.clientId = authConstants_1.AuthConstants.DEFAULT_ADAL_CLIENT_ID;
        }
        if (!options.domain) {
            options.domain = authConstants_1.AuthConstants.AAD_COMMON_TENANT;
        }
        let creds;
        let tenantList = [];
        let subscriptionList = [];
        try {
            creds = new userTokenCredentials_1.UserTokenCredentials(options.clientId, options.domain, username, password, options.tokenAudience, options.environment);
            yield creds.getToken();
            // The token cache gets propulated for all the tenants as a part of building the tenantList.
            tenantList = yield subscriptionUtils_1.buildTenantList(creds);
            // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
            if (!(options.tokenAudience && options.tokenAudience === "graph")) {
                subscriptionList = yield subscriptionUtils_1.getSubscriptionsFromTenants(creds, tenantList);
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
    });
}
exports.withUsernamePasswordWithAuthResponse = withUsernamePasswordWithAuthResponse;
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
function withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options) {
            options = {};
        }
        let creds;
        let subscriptionList = [];
        try {
            creds = new applicationTokenCredentials_1.ApplicationTokenCredentials(clientId, domain, secret, options.tokenAudience, options.environment);
            yield creds.getToken();
            // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
            if (!(options.tokenAudience && options.tokenAudience === "graph")) {
                subscriptionList = yield subscriptionUtils_1.getSubscriptionsFromTenants(creds, [domain]);
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
    });
}
exports.withServicePrincipalSecretWithAuthResponse = withServicePrincipalSecretWithAuthResponse;
function validateAuthFileContent(credsObj, filePath) {
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
function foundManagementEndpointUrl(authFileUrl, envUrl) {
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
function withAuthFileWithAuthResponse(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options)
            options = { filePath: "" };
        const filePath = options.filePath || process.env[authConstants_1.AuthConstants.AZURE_AUTH_LOCATION];
        const subscriptionEnvVariableName = options.subscriptionEnvVariableName || "AZURE_SUBSCRIPTION_ID";
        if (!filePath) {
            const msg = `Either provide an absolute file path to the auth file or set/export the environment variable - ${authConstants_1.AuthConstants.AZURE_AUTH_LOCATION}.`;
            return Promise.reject(new Error(msg));
        }
        let content, credsObj = {};
        const optionsForSpSecret = {};
        try {
            content = fs.readFileSync(filePath, { encoding: "utf8" });
            credsObj = JSON.parse(content);
            validateAuthFileContent(credsObj, filePath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        if (!credsObj.managementEndpointUrl) {
            credsObj.managementEndpointUrl = credsObj.resourceManagerEndpointUrl;
        }
        // setting the subscriptionId from auth file to the environment variable
        process.env[subscriptionEnvVariableName] = credsObj.subscriptionId;
        // get the AzureEnvironment or create a new AzureEnvironment based on the info provided in the auth file
        const envFound = {
            name: ""
        };
        const envNames = Object.keys(ms_rest_azure_env_1.AzureEnvironment);
        for (let i = 0; i < envNames.length; i++) {
            const env = envNames[i];
            const environmentObj = ms_rest_azure_env_1.AzureEnvironment[env];
            if (environmentObj &&
                environmentObj.managementEndpointUrl &&
                foundManagementEndpointUrl(credsObj.managementEndpointUrl, environmentObj.managementEndpointUrl)) {
                envFound.name = environmentObj.name;
                break;
            }
        }
        if (envFound.name) {
            optionsForSpSecret.environment = ms_rest_azure_env_1.AzureEnvironment[envFound.name];
        }
        else {
            // create a new environment with provided info.
            const envParams = {
                // try to find a logical name or set the filepath as the env name.
                name: credsObj.managementEndpointUrl.match(/.*management\.core\.(.*)\..*/i)[1] || filePath
            };
            const keys = Object.keys(credsObj);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key.match(/^(clientId|clientSecret|subscriptionId|tenantId)$/ig) === null) {
                    if (key === "activeDirectoryEndpointUrl" && !key.endsWith("/")) {
                        envParams[key] = credsObj[key] + "/";
                    }
                    else {
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
            optionsForSpSecret.environment = ms_rest_azure_env_1.AzureEnvironment.add(envParams);
        }
        return withServicePrincipalSecretWithAuthResponse(credsObj.clientId, credsObj.clientSecret, credsObj.tenantId, optionsForSpSecret);
    });
}
exports.withAuthFileWithAuthResponse = withAuthFileWithAuthResponse;
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
function withInteractiveWithAuthResponse(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options) {
            options = {};
        }
        if (!options) {
            options = {};
        }
        if (!options.environment) {
            options.environment = ms_rest_azure_env_1.AzureEnvironment.Azure;
        }
        if (!options.domain) {
            options.domain = authConstants_1.AuthConstants.AAD_COMMON_TENANT;
        }
        if (!options.clientId) {
            options.clientId = authConstants_1.AuthConstants.DEFAULT_ADAL_CLIENT_ID;
        }
        if (!options.tokenCache) {
            options.tokenCache = new adal.MemoryCache();
        }
        if (!options.language) {
            options.language = authConstants_1.AuthConstants.DEFAULT_LANGUAGE;
        }
        const interactiveOptions = {};
        interactiveOptions.tokenAudience = options.tokenAudience;
        interactiveOptions.environment = options.environment;
        interactiveOptions.domain = options.domain;
        interactiveOptions.clientId = options.clientId;
        interactiveOptions.tokenCache = options.tokenCache;
        interactiveOptions.language = options.language;
        interactiveOptions.userCodeResponseLogger = options.userCodeResponseLogger;
        const authorityUrl = interactiveOptions.environment.activeDirectoryEndpointUrl + interactiveOptions.domain;
        const authContext = new adal.AuthenticationContext(authorityUrl, interactiveOptions.environment.validateAuthority, interactiveOptions.tokenCache);
        interactiveOptions.context = authContext;
        let userCodeResponse;
        let creds;
        const getUserCode = new Promise((resolve, reject) => {
            return authContext.acquireUserCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, interactiveOptions.language, (err, userCodeRes) => {
                if (err) {
                    return reject(err);
                }
                userCodeResponse = userCodeRes;
                if (interactiveOptions.userCodeResponseLogger) {
                    interactiveOptions.userCodeResponseLogger(userCodeResponse.message);
                }
                else {
                    console.log(userCodeResponse.message);
                }
                return resolve(userCodeResponse);
            });
        });
        function getSubscriptions(creds, tenants) {
            if (!(interactiveOptions.tokenAudience && interactiveOptions.tokenAudience === "graph")) {
                return subscriptionUtils_1.getSubscriptionsFromTenants(creds, tenants);
            }
            return Promise.resolve([]);
        }
        return getUserCode.then(() => {
            return new Promise((resolve, reject) => {
                return authContext.acquireTokenWithDeviceCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, userCodeResponse, (error, tokenResponse) => {
                    if (error) {
                        return reject(error);
                    }
                    interactiveOptions.username = tokenResponse.userId;
                    interactiveOptions.authorizationScheme = tokenResponse.tokenType;
                    try {
                        creds = new deviceTokenCredentials_1.DeviceTokenCredentials(interactiveOptions.clientId, interactiveOptions.domain, interactiveOptions.userName, interactiveOptions.tokenAudience, interactiveOptions.environment, interactiveOptions.tokenCache);
                    }
                    catch (err) {
                        return reject(err);
                    }
                    return resolve(creds);
                });
            });
        }).then((creds) => {
            return subscriptionUtils_1.buildTenantList(creds);
        }).then((tenants) => {
            return getSubscriptions(creds, tenants);
        }).then((subscriptions) => {
            return Promise.resolve({ credentials: creds, subscriptions: subscriptions });
        });
    });
}
exports.withInteractiveWithAuthResponse = withInteractiveWithAuthResponse;
function withAuthFile(options, callback) {
    if (!callback && typeof options === "function") {
        callback = options;
        options = undefined;
    }
    const cb = callback;
    if (!callback) {
        return withAuthFileWithAuthResponse(options).then((authRes) => {
            return Promise.resolve(authRes.credentials);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }
    else {
        msRest.promiseToCallback(withAuthFileWithAuthResponse(options))((err, authRes) => {
            if (err) {
                return cb(err);
            }
            return cb(undefined, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withAuthFile = withAuthFile;
function interactive(options, callback) {
    if (!callback && typeof options === "function") {
        callback = options;
        options = undefined;
    }
    const cb = callback;
    if (!callback) {
        return withInteractiveWithAuthResponse(options).then((authRes) => {
            return Promise.resolve(authRes.credentials);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }
    else {
        msRest.promiseToCallback(withInteractiveWithAuthResponse(options))((err, authRes) => {
            if (err) {
                return cb(err);
            }
            return cb(undefined, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.interactive = interactive;
function withServicePrincipalSecret(clientId, secret, domain, options, callback) {
    if (!callback && typeof options === "function") {
        callback = options;
        options = undefined;
    }
    const cb = callback;
    if (!callback) {
        return withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options).then((authRes) => {
            return Promise.resolve(authRes.credentials);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }
    else {
        msRest.promiseToCallback(withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options))((err, authRes) => {
            if (err) {
                return cb(err);
            }
            return cb(undefined, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withServicePrincipalSecret = withServicePrincipalSecret;
function withUsernamePassword(username, password, options, callback) {
    if (!callback && typeof options === "function") {
        callback = options;
        options = undefined;
    }
    const cb = callback;
    if (!callback) {
        return withUsernamePasswordWithAuthResponse(username, password, options).then((authRes) => {
            return Promise.resolve(authRes.credentials);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }
    else {
        msRest.promiseToCallback(withUsernamePasswordWithAuthResponse(username, password, options))((err, authRes) => {
            if (err) {
                return cb(err);
            }
            return cb(undefined, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withUsernamePassword = withUsernamePassword;
/**
 * Initializes MSITokenCredentials class and calls getToken and returns a token response.
 *
 * @param {string} domain - required. The tenant id.
 * @param {object} options - Optional parameters
 * @param {string} [options.port] - port on which the MSI service is running on the host VM. Default port is 50342
 * @param {string} [options.resource] - The resource uri or token audience for which the token is needed. Default - "https://management.azure.com"
 * @param {string} [options.aadEndpoint] - The add endpoint for authentication. default - "https://login.microsoftonline.com"
 * @param {any} callback - the callback function.
 */
function _withMSI(domain, options) {
    if (!options) {
        options = {};
    }
    const creds = new msiTokenCredentials_1.MSITokenCredentials(domain, options.port, options.resource, options.aadEndpoint);
    return creds.getToken();
}
function withMSI(domain, options, callback) {
    if (!callback && typeof options === "function") {
        callback = options;
        options = {};
    }
    const cb = callback;
    if (!callback) {
        return _withMSI(domain, options);
    }
    else {
        msRest.promiseToCallback(_withMSI(domain, options))((err, tokenRes) => {
            if (err) {
                return cb(err);
            }
            return cb(undefined, tokenRes);
        });
    }
}
exports.withMSI = withMSI;
//# sourceMappingURL=login.js.map