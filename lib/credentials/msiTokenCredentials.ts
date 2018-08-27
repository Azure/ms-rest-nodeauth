// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as msRest from "ms-rest-js";
import { MSIOptions } from "../login";

/**
 * @interface MSITokenResponse - Describes the MSITokenResponse.
 */
export interface MSITokenResponse {
  /**
   * @property {string} token_type - The token type.
   */
  readonly token_type: string;
  /**
   * @property {string} access_token - The access token.
   */
  readonly access_token: string;
  /**
   * @property {any} any - Placeholder for unknown properties.
   */
  readonly [x: string]: any;
}

/**
 * @class MSITokenCredentials - Provides information about managed service identity token credentials.
 * This object can only be used to acquire token on a virtual machine provisioned in Azure with managed service identity.
 */
export class MSITokenCredentials {
  private static readonly defaultPort = 50342;
  private static readonly defaultResource = "https://management.azure.com/";

  port: number;
  resource: string;

  public constructor(
    /**
     * @property {LoginWithMSIOptions} options - Optional parameters
     */
    public options: MSIOptions) {

    if (!options) options = {};

    if (!options.port) {
      options.port = MSITokenCredentials.defaultPort;
    } else if (typeof options.port.valueOf() !== "number") {
      throw new Error("port must be a number.");
    }

    if (!options.resource) {
      options.resource = MSITokenCredentials.defaultResource;
    } else if (typeof options.resource.valueOf() !== "string") {
      throw new Error("resource must be a uri.");
    }

    this.port = options.port;
    this.resource = options.resource;
  }

  /**
   * Prepares and sends a POST request to a service endpoint hosted on the Azure VM, which responds with the access token.
   * @param  {function} callback  The callback in the form (err, result)
   * @return {function} callback
   *                       {Error} [err]  The error if any
   *                       {object} [tokenResponse] The tokenResponse (token_type and access_token are the two important properties).
   */
  async getToken(): Promise<MSITokenResponse> {
    const reqOptions = this.prepareRequestOptions();
    const client = new msRest.ServiceClient();
    let opRes: msRest.HttpOperationResponse;
    let result: MSITokenResponse;
    try {
      opRes = await client.sendRequest(reqOptions);
      result = opRes.parsedBody as MSITokenResponse;
      if (!result.token_type) {
        throw new Error(`Invalid token response, did not find token_type. Response body is: ${opRes.bodyAsText}`);
      } else if (!result.access_token) {
        throw new Error(`Invalid token response, did not find access_token. Response body is: ${opRes.bodyAsText}`);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve(result);
  }

  private prepareRequestOptions(): msRest.RequestPrepareOptions {
    const resource = encodeURIComponent(this.resource);
    const reqOptions: msRest.RequestPrepareOptions = {
      url: `http://localhost:${this.port}/oauth2/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Metadata": "true"
      },
      body: `resource=${resource}`,
      method: "POST"
    };

    return reqOptions;
  }

  /**
   * Signs a request with the Authentication header.
   *
   * @param {webResource} The WebResource to be signed.
   * @param {function(error)}  callback  The callback function.
   * @return {undefined}
   */
  public async signRequest(webResource: msRest.WebResource): Promise<msRest.WebResource> {
    const tokenResponse = await this.getToken();
    webResource.headers.set(msRest.Constants.HeaderConstants.AUTHORIZATION, `${tokenResponse.tokenType} ${tokenResponse.accessToken}`);
    return Promise.resolve(webResource);
  }
}