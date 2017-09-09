// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as msRest from "ms-rest-ts";
import { TokenCredentialsBase } from "../credentials/tokenCredentialsBase";
import { ApplicationTokenCredentials } from "../credentials/applicationTokenCredentials";
import { AuthConstants } from "../util/authConstants"

/**
 * @interface UserType Provides information about user type. It can currently be "user" or "servicePrincipal".
 */
export type UserType = "user" | "servicePrincipal";

/**
 * @interface User Provides information about a user from the authentication perspective.
 */
export interface User {
  /**
   * @property {string} name - The user name. For ApplicationTokenCredentials it can be the clientId or SPN.
   */
  name: string;
  /**
   * @property {string} type - The user type. "user" | "servicePrincipal".
   */
  type: UserType
}

/**
 * @interface SubscriptionInfo Provides information about subscription that was found 
 * during the authentication process. The structure of this type is different from the 
 * subscription object that one gets by making a request to the ResourceManager API.
 */
export interface SubscriptionInfo {
  /**
   * @property {string}
   */
  readonly tenantId: string;
  /**
   * @property {string}
   */
  readonly user: User;
  /**
   * @property {string} environmentName - The environment name in which the subscription exists. 
   * Possible values: "Azure", "AzureChina", "AzureUSGovernment", "AzureGermanCloud" or 
   * some other custom/internal environment name like "Dogfood".
   */
  readonly environmentName: string;
  /**
   * @property {string} name - The display name of the subscription.
   */
  readonly name: string;
  /**
   * @property {string} id - The subscription id, usually a guid.
   */
  readonly id: string;
  /**
   * @property {any} any Placeholder for unknown properties
   */
  readonly [x: string]: any;
}

/**
 * Builds an array of tenantIds.
 * @param {TokenCredentialsBase} credentials 
 * @param {string} apiVersion default value 2016-06-01
 * @returns {Promise<string[]>} resolves to an array of tenantIds and rejects with an error.
 */
export async function buildTenantList(credentials: TokenCredentialsBase, apiVersion = "2016-06-01"): Promise<string[]> {
  if (credentials.domain && credentials.domain !== AuthConstants.AAD_COMMON_TENANT) {
    return Promise.resolve([credentials.domain]);
  }

  let client = new msRest.ServiceClient(credentials);
  let baseUrl = credentials.environment.resourceManagerEndpointUrl;
  let reqUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}tenants?api-version=${apiVersion}`;
  let req: msRest.RequestPrepareOptions = {
    url: reqUrl,
    method: "GET",
  }
  let res: msRest.HttpOperationResponse;
  try {
    res = await client.sendRequest(req);
  } catch (err) {
    return Promise.reject(err);
  }
  let result: string[] = [];
  let tenants: any = res.bodyAsJson;
  for (let tenant in tenants.value) {
    result.push((<any>tenant).tenantId)
  }
  return Promise.resolve(result);
}

export async function getSubscriptionsFromTenants(credentials: TokenCredentialsBase, tenantList: string[], apiVersion = "2016-06-01"): Promise<SubscriptionInfo[]> {
  let subscriptions: SubscriptionInfo[] = [];
  let userType = 'user';
  let username: string;
  let originalDomain = credentials.domain;
  if (credentials instanceof ApplicationTokenCredentials) {
    userType = 'servicePrincipal';
    username = credentials.clientId;
  } else {
    username = (<any>credentials).username;
  }
  for (let tenant of tenantList) {
    credentials.domain = tenant;
    let client = new msRest.ServiceClient(credentials);
    let baseUrl = credentials.environment.resourceManagerEndpointUrl;
    let reqUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}subscriptions?api-version=${apiVersion}`;
    let req: msRest.RequestPrepareOptions = {
      url: reqUrl,
      method: "GET",
    }
    let res: msRest.HttpOperationResponse;
    try {
      res = await client.sendRequest(req);
    } catch (err) {
      return Promise.reject(err);
    }

    let subscriptionList: any[] = (<any>res.bodyAsJson).value;
    subscriptions = subscriptions.concat(subscriptionList.map((s: any) => {
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
}