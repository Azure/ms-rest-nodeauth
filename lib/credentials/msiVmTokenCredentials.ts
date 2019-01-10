// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { MSITokenCredentials, MSIOptions, MSITokenResponse } from "./msiTokenCredentials";
import { RequestPrepareOptions, HttpOperationResponse, WebResource, URLBuilder } from "@azure/ms-rest-js";

/**
 * @interface MSIVmOptions Defines the optional parameters for authentication with MSI for Virtual Machine.
 */
export interface MSIVmOptions extends MSIOptions {
  /**
   * @property {string} [msiEndpoint] - Azure Instance Metadata Service identity endpoint.
   *
   * The default and recommended endpoint is "http://169.254.169.254/metadata/identity/oauth2/token"
   * per https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview
   */
  msiEndpoint?: string;
}

/**
 * @class MSIVmTokenCredentials
 */
export class MSIVmTokenCredentials extends MSITokenCredentials {
  msiEndpoint: string;

  constructor(options?: MSIVmOptions) {
    if (!options) options = {};
    super(options);

    if (!options.msiEndpoint) {
      options.msiEndpoint = "http://169.254.169.254/metadata/identity/oauth2/token";
    } else if (typeof options.msiEndpoint !== "string") {
      throw new Error("msiEndpoint must be a string.");
    }

    const urlBuilder = URLBuilder.parse(options.msiEndpoint);
    if (!urlBuilder.getScheme()) {
      options.msiEndpoint = `http://${options.msiEndpoint}`;
    }

    this.msiEndpoint = options.msiEndpoint;
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
      url: this.msiEndpoint,
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