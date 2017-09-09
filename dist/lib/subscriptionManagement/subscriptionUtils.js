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
const msRest = require("ms-rest-ts");
const applicationTokenCredentials_1 = require("../credentials/applicationTokenCredentials");
const authConstants_1 = require("../util/authConstants");
/**
 * Builds an array of tenantIds.
 * @param {TokenCredentialsBase} credentials
 * @param {string} apiVersion default value 2016-06-01
 * @returns {Promise<string[]>} resolves to an array of tenantIds and rejects with an error.
 */
function buildTenantList(credentials, apiVersion = "2016-06-01") {
    return __awaiter(this, void 0, void 0, function* () {
        if (credentials.domain && credentials.domain !== authConstants_1.AuthConstants.AAD_COMMON_TENANT) {
            return Promise.resolve([credentials.domain]);
        }
        let client = new msRest.ServiceClient(credentials);
        let baseUrl = credentials.environment.resourceManagerEndpointUrl;
        let reqUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}tenants?api-version=${apiVersion}`;
        let req = {
            url: reqUrl,
            method: "GET",
        };
        let res;
        try {
            res = yield client.sendRequest(req);
        }
        catch (err) {
            return Promise.reject(err);
        }
        let result = [];
        let tenants = res.bodyAsJson;
        for (let tenant in tenants.value) {
            result.push(tenant.tenantId);
        }
        return Promise.resolve(result);
    });
}
exports.buildTenantList = buildTenantList;
function getSubscriptionsFromTenants(credentials, tenantList, apiVersion = "2016-06-01") {
    return __awaiter(this, void 0, void 0, function* () {
        let subscriptions = [];
        let userType = 'user';
        let username;
        let originalDomain = credentials.domain;
        if (credentials instanceof applicationTokenCredentials_1.ApplicationTokenCredentials) {
            userType = 'servicePrincipal';
            username = credentials.clientId;
        }
        else {
            username = credentials.username;
        }
        for (let tenant of tenantList) {
            credentials.domain = tenant;
            let client = new msRest.ServiceClient(credentials);
            let baseUrl = credentials.environment.resourceManagerEndpointUrl;
            let reqUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}subscriptions?api-version=${apiVersion}`;
            let req = {
                url: reqUrl,
                method: "GET",
            };
            let res;
            try {
                res = yield client.sendRequest(req);
            }
            catch (err) {
                return Promise.reject(err);
            }
            let subscriptionList = res.bodyAsJson.value;
            subscriptions = subscriptions.concat(subscriptionList.map((s) => {
                s.tenantId = tenant;
                s.user = { name: username, type: userType };
                s.environmentName = credentials.environment.name;
                s.name = s.displayName;
                s.id = s.subscriptionId;
                delete s.displayName;
                delete s.subscriptionId;
                delete s.subscriptionPolicies;
                return s;
            }));
        }
        // Reset the original domain.
        credentials.domain = originalDomain;
        return Promise.resolve(subscriptions);
    });
}
exports.getSubscriptionsFromTenants = getSubscriptionsFromTenants;
//# sourceMappingURL=subscriptionUtils.js.map