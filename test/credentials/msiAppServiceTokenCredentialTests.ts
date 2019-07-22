// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as msRestAzure from "../../lib/login";
import { MSIAppServiceTokenCredentials } from "../../lib/credentials/msiAppServiceTokenCredentials";
import { expect, assert } from "chai";
import { WebResource, HttpHeaders, HttpClient, HttpOperationResponse } from "@azure/ms-rest-js";

describe("MSI App Service Authentication", function () {

  function getMockHttpClient(response?: any, error?: any): HttpClient {
    const httpClient = {
      sendRequest: async (request: WebResource): Promise<HttpOperationResponse> => {
        if (error === undefined) {
          const httpResponse: HttpOperationResponse = {
            request: request,
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

  describe("Credential getToken()", async () => {
    it("should get token from the App service MSI by providing optional properties", async () => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };

      const httpClient = getMockHttpClient(mockResponse);
      const msiCredsObj = new MSIAppServiceTokenCredentials({
        msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
        msiSecret: "69418689F1E342DD946CB82994CDA3CB",
        httpClient: httpClient
      });

      const response = await msiCredsObj.getToken();
      expect(response).to.exist;
      expect(response!.accessToken).to.exist;
      expect(response!.tokenType).to.exist;
    });

    it("should get token from the App service MSI by reading the environment variables", async () => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };


      const httpClient = getMockHttpClient(mockResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
      const msiCredsObj = new MSIAppServiceTokenCredentials({ httpClient: httpClient });
      const response = await msiCredsObj.getToken();
      expect(response).to.exist;
      expect(response!.accessToken).to.exist;
      expect(response!.tokenType).to.exist;
    });

    it("should return an AccessToken when invoked as a TokenCredential", async () => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };

      const httpClient = getMockHttpClient(mockResponse);
      const msiCredsObj = new MSIAppServiceTokenCredentials({
        msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
        msiSecret: "69418689F1E342DD946CB82994CDA3CB",
        httpClient: httpClient
      });

      const response = await msiCredsObj.getToken("scope");
      expect(response).to.exist;
      expect(response!.token).to.exist;
      expect(response!.expiresOnTimestamp).to.exist;
    });


    it('should throw if the response contains "ExceptionMessage"', async function () {
      const errorResponse = {
        "error": "unknown",
        "error_description": "ExceptionMessage: Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
      };

      const httpClient = getMockHttpClient(undefined, errorResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
      const msiCredsObj = new MSIAppServiceTokenCredentials({ httpClient: httpClient });
      try {
        await msiCredsObj.getToken();
        assert.fail(undefined, undefined, "getToken should throw an exception");
      }
      catch (err) {
        expect(err);
      }
    });
  });

  describe("loginWithAppServiceMSI (callback)", () => {

    it("should successfully provide MSIAppServiceTokenCredentials object by providing optional properties", (done) => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };

      const httpClient = getMockHttpClient(mockResponse);

      const options = {
        msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
        msiSecret: "69418689F1E342DD946CB82994CDA3CB",
        httpClient: httpClient
      };

      msRestAzure.loginWithAppServiceMSI(options, (error, response) => {
        expect(error).to.not.exist;
        expect(response).to.exist;
        expect(response instanceof MSIAppServiceTokenCredentials).to.be.true;
        done();
      });
    });

    it("should successfully provide MSIAppServiceTokenCredentials object by reading the environment variables", async () => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };

      const httpClient = getMockHttpClient(mockResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";

      const response = await msRestAzure.loginWithAppServiceMSI({ httpClient: httpClient });

      expect(response).to.exist;
      expect(response instanceof MSIAppServiceTokenCredentials).to.be.true;
    });

    it('should throw if the response contains "ExceptionMessage"', async () => {
      const errorResponse = {
        "error": "unknown",
        "error_description": "ExceptionMessage: Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
      };

      const httpClient = getMockHttpClient(undefined, errorResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";

      try {
        await msRestAzure.loginWithAppServiceMSI({ httpClient: httpClient });
        assert.fail(undefined, undefined, "loginWithAppServiceMSI should throw an exception");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });
});
