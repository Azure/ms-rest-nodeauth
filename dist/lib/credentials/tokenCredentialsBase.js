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
const ms_rest_js_1 = require("ms-rest-js");
const ms_rest_azure_env_1 = require("ms-rest-azure-env");
const authConstants_1 = require("../util/authConstants");
const adal = require("adal-node");
class TokenCredentialsBase {
    constructor(clientId, domain, tokenAudience, environment = ms_rest_azure_env_1.AzureEnvironment.Azure, tokenCache = new adal.MemoryCache()) {
        this.clientId = clientId;
        this.domain = domain;
        this.tokenAudience = tokenAudience;
        this.environment = environment;
        this.tokenCache = tokenCache;
        if (!Boolean(clientId) || typeof clientId.valueOf() !== "string") {
            throw new Error("clientId must be a non empty string.");
        }
        if (!Boolean(domain) || typeof domain.valueOf() !== "string") {
            throw new Error("domain must be a non empty string.");
        }
        if (this.tokenAudience === authConstants_1.TokenAudience.graph) {
            this.isGraphContext = true;
            if (this.domain.toLowerCase() === "common") {
                throw new Error(`${"If the tokenAudience is specified as \"graph\" then \"domain\" cannot be defaulted to \"commmon\" tenant.\
          It must be the actual tenant (preferrably a string in a guid format)."}`);
            }
        }
        const authorityUrl = this.environment.activeDirectoryEndpointUrl + this.domain;
        this.authContext = new adal.AuthenticationContext(authorityUrl, this.environment.validateAuthority, this.tokenCache);
    }
    getActiveDirectoryResourceId() {
        const resource = this.isGraphContext
            ? this.environment.activeDirectoryGraphResourceId
            : this.environment.activeDirectoryResourceId;
        return resource;
    }
    getTokenFromCache(userName) {
        const self = this;
        const resource = this.getActiveDirectoryResourceId();
        return new Promise((resolve, reject) => {
            self.authContext.acquireToken(resource, userName, self.clientId, (error, tokenResponse) => {
                if (error) {
                    return reject(error);
                }
                return resolve(tokenResponse);
            });
        });
    }
    /**
     * Signs a request with the Authentication header.
     *
     * @param {webResource} The WebResource to be signed.
     * @param {function(error)}  callback  The callback function.
     * @return {undefined}
     */
    signRequest(webResource) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenResponse = yield this.getToken();
            webResource.headers[ms_rest_js_1.Constants.HeaderConstants.AUTHORIZATION] = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;
            return Promise.resolve(webResource);
        });
    }
}
exports.TokenCredentialsBase = TokenCredentialsBase;
//# sourceMappingURL=tokenCredentialsBase.js.map