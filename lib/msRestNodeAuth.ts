// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenCredentialsBase, TokenResponse } from "./credentials/tokenCredentialsBase";
import { ApplicationTokenCredentials } from "./credentials/applicationTokenCredentials";
import { DeviceTokenCredentials } from "./credentials/deviceTokenCredentials";
import { UserTokenCredentials } from "./credentials/userTokenCredentials";
import { MSITokenCredentials, MSITokenResponse } from "./credentials/msiTokenCredentials";
import { AuthConstants, TokenAudience } from "./util/authConstants";
import { LinkedSubscription, LinkedUser, UserType } from "./subscriptionManagement/subscriptionUtils";
import {
  AuthResponse, LoginWithAuthFileOptions, InteractiveLoginOptions,
  MSIOptions, AzureTokenCredentialsOptions, LoginWithUsernamePasswordOptions,
  interactive, withAuthFile, withAuthFileWithAuthResponse, withInteractiveWithAuthResponse,
  withMSI, withServicePrincipalSecret, withServicePrincipalSecretWithAuthResponse,
  withUsernamePassword, withUsernamePasswordWithAuthResponse
} from "./login";

export {
  TokenCredentialsBase, TokenResponse, ApplicationTokenCredentials, DeviceTokenCredentials,
  UserTokenCredentials, MSITokenCredentials, MSITokenResponse, AuthConstants, TokenAudience,
  AuthResponse, LoginWithAuthFileOptions, InteractiveLoginOptions, MSIOptions,
  AzureTokenCredentialsOptions, LoginWithUsernamePasswordOptions,
  interactive as interactiveLogin,
  withInteractiveWithAuthResponse as interactiveLoginWithAuthResponse,
  withUsernamePassword as loginWithUsernamePassword,
  withUsernamePasswordWithAuthResponse as loginWithUsernamePasswordWithAuthResponse,
  withServicePrincipalSecret as loginWithServicePrincipalSecret,
  withServicePrincipalSecretWithAuthResponse as loginWithServicePrincipalSecretWithAuthResponse,
  withAuthFile as loginWithAuthFile,
  withAuthFileWithAuthResponse as loginWithAuthFileWithAuthResponse,
  withMSI as loginWithMSI,
  LinkedSubscription, LinkedUser, UserType
};