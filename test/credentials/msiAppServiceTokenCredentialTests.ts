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

// import * as msRestAzure from "../../lib/login";
import { MSIAppServiceTokenCredentials } from "../../lib/credentials/msiAppServiceTokenCredentials";
import { expect } from "chai";
import { WebResource, HttpHeaders, HttpClient, HttpOperationResponse } from "ms-rest-js";

describe("MSI App Service Authentication", function () {

  function setupNockResponse(response?: any, error?: any): HttpClient {
    const httpClient = {
      sendRequest: async (request: WebResource): Promise<HttpOperationResponse> => {
        if (error === undefined) {
          const httpResponse: HttpOperationResponse = {
            request: request,
            status: 200,
            headers: new HttpHeaders(),
            bodyAsText: response
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
    it("should get token from the App service MSI by providing optional properties", async (done) => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };

      const httpClient = setupNockResponse(undefined, mockResponse);
      const msiCredsObj = new MSIAppServiceTokenCredentials({
        msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
        msiSecret: "69418689F1E342DD946CB82994CDA3CB",
        httpClient: httpClient
      });

      const response = await msiCredsObj.getToken();
      expect(response).to.exist;
      expect(response!.accessToken).to.exist;
      expect(response!.tokenType).to.exist;
      done();
    });

    it("should get token from the App service MSI by reading the environment variables", async (done) => {
      const mockResponse = {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
        expires_in: "3599",
        expires_on: "1502930996",
        resource: "https://management.azure.com/",
        token_type: "Bearer"
      };


      const httpClient = setupNockResponse(undefined, mockResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
      const msiCredsObj = new MSIAppServiceTokenCredentials({ httpClient: httpClient });
      const response = await msiCredsObj.getToken();
      expect(response).to.exist;
      expect(response!.accessToken).to.exist;
      expect(response!.tokenType).to.exist;
      done();
    });

    it('should throw if the response contains "ExceptionMessage"', async function (done) {
      const errorResponse = {
        "error": "unknown",
        "error_description": "ExceptionMessage: Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
      };

      const httpClient = setupNockResponse(undefined, errorResponse);
      process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
      process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
      const msiCredsObj = new MSIAppServiceTokenCredentials({ httpClient: httpClient });
      try {
        const response = await msiCredsObj.getToken();
        expect(response).to.not.exist;
      }
      catch {

      }

      done();
    });
  });

  // describe("loginWithAppServiceMSI", () => {

  //   it("should successfully provide MSIAppServiceTokenCredentials object by providing optional properties", (done) => {
  //     const response = {
  //       access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
  //       expires_in: "3599",
  //       expires_on: "1502930996",
  //       resource: "https://management.azure.com/",
  //       tokenType: "Bearer"
  //     };

  //     setupNockResponse();

  //     const options = {
  //       msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
  //       msiSecret: "69418689F1E342DD946CB82994CDA3CB"
  //     };
  //     msRestAzure.loginWithAppServiceMSI(options, (err, response) => {
  //       expect(err).to.not.exist;
  //       expect(response).to.exist;
  //       expect(response instanceof MSIAppServiceTokenCredentials).to.be.true;
  //       done();
  //     });
  //   });

  //   it("should successfully provide MSIAppServiceTokenCredentials object by reading the environment variables", (done) => {
  //     const response = {
  //       access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
  //       expires_in: "3599",
  //       expires_on: "1502930996",
  //       resource: "https://management.azure.com/",
  //       tokenType: "Bearer"
  //     };

  //     setupNockResponse();
  //     process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
  //     process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
  //     msRestAzure.loginWithAppServiceMSI((err, response) => {
  //       expect(err).to.not.exist;
  //       expect(response).to.exist;
  //       expect(response instanceof MSIAppServiceTokenCredentials).to.be.true;
  //       done();
  //     });
  //   });

  //   it('should throw if the response contains "ExceptionMessage"', function (done) {
  //     const errorResponse = {
  //       "error": "unknown",
  //       "error_description": "ExceptionMessage: Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
  //     };

  //     setupNockResponse();
  //     process.env["MSI_ENDPOINT"] = "http://127.0.0.1:41741/MSI/token/";
  //     process.env["MSI_SECRET"] = "69418689F1E342DD946CB82994CDA3CB";
  //     msRestAzure.loginWithAppServiceMSI((err, response) => {
  //       expect(err).to.exist;
  //       expect(response).to.not.exist;
  //       done();
  //     });
  //   });
  // });
});