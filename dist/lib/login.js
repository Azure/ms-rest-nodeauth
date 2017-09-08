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
const msRest = require("ms-rest-ts");
const ms_rest_azure_env_1 = require("ms-rest-azure-env");
const applicationTokenCredentials_1 = require("./credentials/applicationTokenCredentials");
const deviceTokenCredentials_1 = require("./credentials/deviceTokenCredentials");
const userTokenCredentials_1 = require("./credentials/userTokenCredentials");
const authConstants_1 = require("./util/authConstants");
const subscriptionUtils_1 = require("./subscriptionManagement/subscriptionUtils");
const msiTokenCredentials_1 = require("./credentials/msiTokenCredentials");
function turnOnLogging() {
    let log = adal.Logging;
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
if (process.env['AZURE_ADAL_LOGGING_ENABLED']) {
    turnOnLogging();
}
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
        let result;
        let tenantList = [];
        let subscriptionList = [];
        try {
            creds = new userTokenCredentials_1.UserTokenCredentials(options.clientId, options.domain, username, password, options.tokenAudience, options.environment);
            result = yield creds.getToken();
            // The token cache gets propulated for all the tenants as a part of building the tenantList.
            tenantList = yield subscriptionUtils_1.buildTenantList(creds);
            // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
            if (!(options.tokenAudience && options.tokenAudience === authConstants_1.TokenAudience.graph)) {
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
function withServicePrincipalSecretWithAuthResponse(clientId, secret, domain, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options) {
            options = {};
        }
        let creds;
        let result;
        let subscriptionList = [];
        try {
            creds = new applicationTokenCredentials_1.ApplicationTokenCredentials(clientId, domain, secret, options.tokenAudience, options.environment);
            result = yield creds.getToken();
            // We dont need to get the subscriptionList if the tokenAudience is graph as graph clients are tenant based.
            if (!(options.tokenAudience && options.tokenAudience === authConstants_1.TokenAudience.graph)) {
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
function foundManagementEndpointUrl(authFileUrl, envUrl) {
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
function withAuthFileWithAuthResponse(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options)
            options = { filePath: '' };
        let filePath = options.filePath || process.env[authConstants_1.AuthConstants.AZURE_AUTH_LOCATION];
        let subscriptionEnvVariableName = options.subscriptionEnvVariableName || 'AZURE_SUBSCRIPTION_ID';
        if (!filePath) {
            let msg = `Either provide an absolute file path to the auth file or set/export the environment variable - ${authConstants_1.AuthConstants.AZURE_AUTH_LOCATION}.`;
            return Promise.reject(new Error(msg));
        }
        let content, credsObj = {}, optionsForSpSecret = {};
        try {
            content = fs.readFileSync(filePath, { encoding: 'utf8' });
            credsObj = JSON.parse(content);
            validateAuthFileContent(credsObj, filePath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        if (!credsObj.managementEndpointUrl) {
            credsObj.managementEndpointUrl = credsObj.resourceManagerEndpointUrl;
        }
        //setting the subscriptionId from auth file to the environment variable
        process.env[subscriptionEnvVariableName] = credsObj.subscriptionId;
        //get the AzureEnvironment or create a new AzureEnvironment based on the info provided in the auth file
        let envFound = {
            name: ''
        };
        let envNames = Object.keys(Object.getPrototypeOf(ms_rest_azure_env_1.AzureEnvironment)).slice(1);
        for (let i = 0; i < envNames.length; i++) {
            let env = envNames[i];
            let environmentObj = ms_rest_azure_env_1.AzureEnvironment[env];
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
            //create a new environment with provided info.
            let envParams = {
                //try to find a logical name or set the filepath as the env name.
                name: credsObj.managementEndpointUrl.match(/.*management\.core\.(.*)\..*/i)[1] || filePath
            };
            let keys = Object.keys(credsObj);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (key.match(/^(clientId|clientSecret|subscriptionId|tenantId)$/ig) === null) {
                    if (key === 'activeDirectoryEndpointUrl' && !key.endsWith('/')) {
                        envParams[key] = credsObj[key] + '/';
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
                envParams.portalUrl = 'https://portal.azure.com';
            }
            optionsForSpSecret.environment = ms_rest_azure_env_1.AzureEnvironment.add(envParams);
        }
        return withServicePrincipalSecretWithAuthResponse(credsObj.clientId, credsObj.clientSecret, credsObj.tenantId, optionsForSpSecret);
    });
}
exports.withAuthFileWithAuthResponse = withAuthFileWithAuthResponse;
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
        let interactiveOptions = {};
        interactiveOptions.tokenAudience = options.tokenAudience;
        interactiveOptions.environment = options.environment;
        interactiveOptions.domain = options.domain;
        interactiveOptions.clientId = options.clientId;
        interactiveOptions.tokenCache = options.tokenCache;
        interactiveOptions.language = options.language;
        interactiveOptions.userCodeResponseLogger = options.userCodeResponseLogger;
        let authorityUrl = interactiveOptions.environment.activeDirectoryEndpointUrl + interactiveOptions.domain;
        let authContext = new adal.AuthenticationContext(authorityUrl, interactiveOptions.environment.validateAuthority, interactiveOptions.tokenCache);
        interactiveOptions.context = authContext;
        let tenantList = [];
        let subscriptionList = [];
        let getUserCode = new Promise((resolve, reject) => {
            return authContext.acquireUserCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, interactiveOptions.language, (err, userCodeResponse) => {
                if (err) {
                    return reject(err);
                }
                if (interactiveOptions.userCodeResponseLogger) {
                    interactiveOptions.userCodeResponseLogger(userCodeResponse.message);
                }
                else {
                    console.log(userCodeResponse.message);
                }
                return resolve(userCodeResponse.message);
            });
        });
        return getUserCode.then((userCodeResponse) => {
            return authContext.acquireTokenWithDeviceCode(interactiveOptions.environment.activeDirectoryResourceId, interactiveOptions.clientId, userCodeResponse, (error, tokenResponse) => __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    return Promise.reject(error);
                }
                interactiveOptions.username = tokenResponse.userId;
                interactiveOptions.authorizationScheme = tokenResponse.tokenType;
                try {
                    let creds = new deviceTokenCredentials_1.DeviceTokenCredentials(interactiveOptions.clientId, interactiveOptions.domain, interactiveOptions.userName, interactiveOptions.tokenAudience, interactiveOptions.environment, interactiveOptions.tokenCache);
                    tenantList = yield subscriptionUtils_1.buildTenantList(creds);
                    if (!(interactiveOptions.tokenAudience && interactiveOptions.tokenAudience === authConstants_1.TokenAudience.graph)) {
                        subscriptionList = yield subscriptionUtils_1.getSubscriptionsFromTenants(creds, tenantList);
                    }
                    return Promise.resolve({ credentials: creds, subscriptions: subscriptionList });
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }));
        });
    });
}
exports.withInteractiveWithAuthResponse = withInteractiveWithAuthResponse;
function withAuthFile(options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    let cb = callback;
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
            return cb(null, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withAuthFile = withAuthFile;
function interactive(options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    let cb = callback;
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
            return cb(null, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.interactive = interactive;
function withServicePrincipalSecret(clientId, secret, domain, options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    let cb = callback;
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
            return cb(null, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withServicePrincipalSecret = withServicePrincipalSecret;
function withUsernamePassword(username, password, options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    let cb = callback;
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
            return cb(null, authRes.credentials, authRes.subscriptions);
        });
    }
}
exports.withUsernamePassword = withUsernamePassword;
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
function _withMSI(domain, options) {
    if (!options) {
        options = {};
    }
    const creds = new msiTokenCredentials_1.MSITokenCredentials(domain, options.port, options.resource, options.aadEndpoint);
    return creds.getToken();
}
function withMSI(domain, options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
    }
    let cb = callback;
    if (!callback) {
        return _withMSI(domain, options);
    }
    else {
        msRest.promiseToCallback(_withMSI(domain, options))((err, tokenRes) => {
            if (err) {
                return cb(err);
            }
            return cb(null, tokenRes);
        });
    }
}
exports.withMSI = withMSI;
//# sourceMappingURL=login.js.map