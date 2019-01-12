// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { MSIVmTokenCredentials } from "../../lib/credentials/msiVmTokenCredentials";
import { expect, assert } from "chai";
import { HttpClient, HttpOperationResponse, WebResource, HttpHeaders } from "@azure/ms-rest-js";

describe("MSI Vm Authentication", () => {

  function setupNockResponse(msiEndpoint?: string, expectedRequestHeaders?: any, response?: any, error?: any): HttpClient {
    if (!msiEndpoint) {
      msiEndpoint = "http://169.254.169.254/metadata/identity/oauth2/token";
    }

    const isMatch = (actualRequest: WebResource, expectedRequestHeaders: any) => {
      return actualRequest.url === `${msiEndpoint}?api-version=${expectedRequestHeaders.apiVersion}&resource=${encodeURIComponent(expectedRequestHeaders.resource)}`;
    };

    const httpClient = {
      sendRequest: async (req: WebResource): Promise<HttpOperationResponse> => {
        if (error === undefined && isMatch(req, expectedRequestHeaders)) {
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

  it("should get token from the virtual machine with MSI service running at default endpoint", async () => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      token_type: "Bearer"
    };

    const expectedQuery = {
      "apiVersion": "2018-02-01",
      "resource": "https://management.azure.com/"
    };

    const httpClient = setupNockResponse(undefined, expectedQuery, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ httpClient: httpClient });
    const response = await msiCredsObj.getToken();
    expect(response).to.exist;
    expect(response!.accessToken).to.exist;
    expect(response!.tokenType).to.exist;
  });

  it("should get token from the virtual machine with MSI service running at custom endpoint", async () => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      token_type: "Bearer"
    };

    const expectedQuery = {
      "apiVersion": "2018-02-01",
      "resource": "https://management.azure.com/"
    };
    const customMsiEndpoint = "http://localhost:50342/oauth2/token";
    const httpClient = setupNockResponse(customMsiEndpoint, expectedQuery, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ msiEndpoint: customMsiEndpoint, httpClient: httpClient });
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

  it("should append schema to schema-less custom MSI endpoint", async () => {
    const customMsiEndpoint = "localhost:5987/path";
    const msiCredsObj = new MSIVmTokenCredentials({ msiEndpoint: customMsiEndpoint });
    expect(msiCredsObj.msiEndpoint).to.equal(`http://${customMsiEndpoint}`);
  });

  it("should set default api-version", async () => {
    const msiCredsObj = new MSIVmTokenCredentials();
    expect(msiCredsObj.apiVersion).to.equal("2018-02-01");
  });

  it("should set custom api-version", async () => {
    const expectedApiVersion = "2020-02-20";
    const msiCredsObj = new MSIVmTokenCredentials({ apiVersion: expectedApiVersion });
    expect(msiCredsObj.apiVersion).to.equal(expectedApiVersion);
  });

  it("should set default HTTP method", async () => {
    const msiCredsObj = new MSIVmTokenCredentials();
    expect(msiCredsObj.httpMethod).to.equal("GET");
  });

  it("should set custom HTTP method", async () => {
    const expectedHttpMethod = "PATCH";
    const msiCredsObj = new MSIVmTokenCredentials({ httpMethod: expectedHttpMethod });
    expect(msiCredsObj.httpMethod).to.equal("PATCH");
  });
});
