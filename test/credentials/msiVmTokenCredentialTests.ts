/**
 * Copyright (c) Microsoft.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MSIVmTokenCredentials } from "../../lib/credentials/msiVmTokenCredentials";
import { expect, assert } from "chai";
import { HttpClient, HttpOperationResponse, WebResource, HttpHeaders } from "ms-rest-js";

describe("MSI Vm Authentication", () => {

  function setupNockResponse(port?: number, request?: any, response?: any, error?: any): HttpClient {
    if (!port) {
      port = 50342;
    }

    const isMatch = (actualRequest: WebResource, expectedResource: any) => {
      return actualRequest.url === `http://localhost:${port}/oauth2/token` && actualRequest.body === `"resource=${encodeURIComponent(expectedResource.resource)}"`;
    };

    const httpClient = {
      sendRequest: async (req: WebResource): Promise<HttpOperationResponse> => {
        if (error === undefined && isMatch(req, request)) {
          const httpResponse: HttpOperationResponse = {
            request: req,
            status: 200,
            headers: new HttpHeaders(),
            bodyAsText: JSON.stringify(response)
          };
          return Promise.resolve(httpResponse);
        } else {
          return Promise.reject(error);
        }
      }
    };

    return httpClient;
  }

  it("should get token from the virtual machine with MSI service running at default port", async () => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      token_type: "Bearer"
    };

    const requestBodyToMatch = {
      "resource": "https://management.azure.com/"
    };

    const httpClient = setupNockResponse(undefined, requestBodyToMatch, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ httpClient: httpClient });
    const response = await msiCredsObj.getToken();
    expect(response).to.exist;
    expect(response!.accessToken).to.exist;
    expect(response!.tokenType).to.exist;
  });

  it("should get token from the virtual machine with MSI service running at custom port", async () => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      token_type: "Bearer"
    };

    const requestBodyToMatch = {
      "resource": "https://management.azure.com/"
    };

    const customPort = 50341;
    const httpClient = setupNockResponse(customPort, requestBodyToMatch, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ port: customPort, httpClient: httpClient });
    const response = await msiCredsObj.getToken();
    expect(response).to.exist;
    expect(response!.accessToken).to.exist;
    expect(response!.tokenType).to.exist;
  });

  it("should throw on requests with bad resource", async () => {
    const errorMessage = "unknown";
    const errorDescription = "Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log";
    const errorResponse = {
      "error": errorMessage,
      "error_description": errorDescription
    };

    const requestBodyToMatch = {
      "resource": "badvalue"
    };

    const httpClient = setupNockResponse(undefined, requestBodyToMatch, undefined, errorResponse);
    const msiCredsObj = new MSIVmTokenCredentials({ "resource": "badvalue", httpClient: httpClient });

    try {
      await msiCredsObj.getToken();
      assert.fail(undefined, undefined, "getToken should throw an exception");
    } catch (err) {
      expect(err).to.exist;
      expect((err as any).error).to.equal(errorMessage);
      expect((err as any).error_description).to.equal(errorDescription);
    }
  });

  it("should throw on request with empty resource", async () => {
    const errorMessage = "bad_resource_200";
    const errorDescription = "Invalid Resource";
    const errorResponse = {
      "error": errorMessage,
      "error_description": errorDescription
    };

    const requestBodyToMatch = {
      "resource": "  "
    };

    const httpClient = setupNockResponse(undefined, requestBodyToMatch, undefined, errorResponse);
    const msiCredsObj = new MSIVmTokenCredentials({ "resource": "  ", httpClient: httpClient });

    try {
      await msiCredsObj.getToken();
      assert.fail(undefined, undefined, "getToken should throw an exception");
    } catch (err) {
      expect(err).to.exist;
      expect((err as any).error).to.equal(errorMessage);
      expect((err as any).error_description).to.equal(errorDescription);
    }
  });
});
