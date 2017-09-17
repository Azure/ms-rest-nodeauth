"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const tokenCredentialsBase_1 = require("./tokenCredentialsBase");
const authConstants_1 = require("../util/authConstants");
class DeviceTokenCredentials extends tokenCredentialsBase_1.TokenCredentialsBase {
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
    constructor(clientId, domain, userName, tokenAudience, environment, tokenCache) {
        if (!userName) {
            userName = "user@example.com";
        }
        if (!domain) {
            domain = authConstants_1.AuthConstants.AAD_COMMON_TENANT;
        }
        if (!clientId) {
            clientId = authConstants_1.AuthConstants.DEFAULT_ADAL_CLIENT_ID;
        }
        super(clientId, domain, tokenAudience, environment, tokenCache);
        this.userName = userName;
    }
    getToken() {
        // For device auth, this is just getTokenFromCache.
        return this.getTokenFromCache(this.userName);
    }
}
exports.DeviceTokenCredentials = DeviceTokenCredentials;
//# sourceMappingURL=deviceTokenCredentials.js.map