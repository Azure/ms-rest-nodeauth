// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { MSITokenCredentials, MSIOptions, MSITokenResponse } from "./msiTokenCredentials";
import { RequestPrepareOptions, HttpOperationResponse, WebResource } from "@azure/ms-rest-js";

/**
 * @interface MSIVmOptions Defines the optional parameters for authentication with MSI for Virtual Machine.
 */
export interface MSIVmOptions extends MSIOptions {
  /**
   * @prop {number} [port] - port on which the MSI service is running on the host VM. Default port is 50342
   */
  port?: number;
}

/**
 * @class MSIVmTokenCredentials
 */
export class MSIVmTokenCredentials extends MSITokenCredentials {
  port: number;

  constructor(options?: MSIVmOptions) {
    if (!options) options = {};
    super(options);
    if (!options.port) {
      options.port = 50342; // default port where token service runs.
    } else if (typeof options.port !== "number") {
      throw new Error("port must be a number.");
    }

    this.port = options.port;
  }

  /**
   * Prepares and sends a POST request to a service endpoint hosted on the Azure VM, which responds with the access token.
   * @return {Promise<MSITokenResponse>} Promise with the tokenResponse (tokenType and accessToken are the two important properties).
   */
  async getToken(): Promise<MSITokenResponse> {
    const reqOptions = this.prepareRequestOptions();
    let opRes: HttpOperationResponse;
    let result: MSITokenResponse;

    opRes = await this._httpClient.sendRequest(reqOptions);
    result = this.parseTokenResponse(opRes.bodyAsText!) as MSITokenResponse;
    if (!result.tokenType) {
      throw new Error(`Invalid token response, did not find tokenType. Response body is: ${opRes.bodyAsText}`);
    } else if (!result.accessToken) {
      throw new Error(`Invalid token response, did not find accessToken. Response body is: ${opRes.bodyAsText}`);
    }


    return result;
  }

  protected prepareRequestOptions(): WebResource {
    const resource = encodeURIComponent(this.resource);
    const reqOptions: RequestPrepareOptions = {
      url: `http://localhost:${this.port}/oauth2/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Metadata": "true"
      },
      body: `resource=${resource}`,
      method: "POST"
    };

    const webResource = new WebResource();
    return webResource.prepare(reqOptions);
  }
}