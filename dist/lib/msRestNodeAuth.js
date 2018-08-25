"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const tokenCredentialsBase_1 = require("./credentials/tokenCredentialsBase");
exports.TokenCredentialsBase = tokenCredentialsBase_1.TokenCredentialsBase;
const applicationTokenCredentials_1 = require("./credentials/applicationTokenCredentials");
exports.ApplicationTokenCredentials = applicationTokenCredentials_1.ApplicationTokenCredentials;
const deviceTokenCredentials_1 = require("./credentials/deviceTokenCredentials");
exports.DeviceTokenCredentials = deviceTokenCredentials_1.DeviceTokenCredentials;
const userTokenCredentials_1 = require("./credentials/userTokenCredentials");
exports.UserTokenCredentials = userTokenCredentials_1.UserTokenCredentials;
const msiTokenCredentials_1 = require("./credentials/msiTokenCredentials");
exports.MSITokenCredentials = msiTokenCredentials_1.MSITokenCredentials;
const authConstants_1 = require("./util/authConstants");
exports.AuthConstants = authConstants_1.AuthConstants;
const login_1 = require("./login");
exports.interactiveLogin = login_1.interactive;
exports.loginWithAuthFile = login_1.withAuthFile;
exports.loginWithAuthFileWithAuthResponse = login_1.withAuthFileWithAuthResponse;
exports.interactiveLoginWithAuthResponse = login_1.withInteractiveWithAuthResponse;
exports.loginWithMSI = login_1.withMSI;
exports.loginWithServicePrincipalSecret = login_1.withServicePrincipalSecret;
exports.loginWithServicePrincipalSecretWithAuthResponse = login_1.withServicePrincipalSecretWithAuthResponse;
exports.loginWithUsernamePassword = login_1.withUsernamePassword;
exports.loginWithUsernamePasswordWithAuthResponse = login_1.withUsernamePasswordWithAuthResponse;
//# sourceMappingURL=msRestNodeAuth.js.map