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

import * as nock from "nock";
import { MSIVmTokenCredentials } from "../../lib/credentials/msiVmTokenCredentials";
import { expect } from "chai";

describe("MSI Vm Authentication", () => {

  function setupNockResponse(port?: number, requestBodyToMatch?: any, response?: any, error?: any) {

    if (!port) {
      port = 50342;
    }

    const basePath = `http://localhost:${port}`;
    const interceptor = nock(basePath).post("/oauth2/token", function (body: any) { return JSON.stringify(body) === JSON.stringify(requestBodyToMatch); });

    if (!error) {
      interceptor.reply(200, response);
    } else {
      interceptor.replyWithError(error);
    }
  }

  it("should get token from the virtual machine with MSI service running at default port", async (done) => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      tokenType: "Bearer"
    };

    const requestBodyToMatch = {
      "resource": "https://management.azure.com/"
    };

    setupNockResponse(undefined, requestBodyToMatch, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials();
    const response = await msiCredsObj.getToken();
    expect(response).to.exist;
    expect(response!.accessToken).to.exist;
    expect(response!.tokenType).to.exist;
    done();
  });

  it("should get token from the virtual machine with MSI service running at custom port", async (done) => {
    const mockResponse = {
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d",
      refresh_token: "",
      expires_in: "3599",
      expires_on: "1502930996",
      not_before: "1502927096",
      resource: "https://management.azure.com/",
      tokenType: "Bearer"
    };

    const requestBodyToMatch = {
      "resource": "https://management.azure.com/"
    };

    const customPort = 50341;
    setupNockResponse(customPort, requestBodyToMatch, mockResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ port: customPort });
    const response = await msiCredsObj.getToken();
    expect(response).to.exist;
    expect(response!.accessToken).to.exist;
    expect(response!.tokenType).to.exist;
    done();
  });

  it("should throw on requests with bad resource", async (done) => {
    const errorResponse = {
      "error": "unkwnown",
      "error_description": "Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
    };

    const requestBodyToMatch = {
      "resource": "badvalue"
    };

    setupNockResponse(undefined, requestBodyToMatch, undefined, errorResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ "resource": "badvalue" });
    const response = await msiCredsObj.getToken();
    //expect(err).to.exist;
    //expect((err as any).error).to.equal("bad_resource_200");
    expect(response).to.not.exist;
    done();
  });

  it("should throw on request with empty resource", async (done) => {
    const errorResponse = { "error": "bad_resource_200", "error_description": "Invalid Resource" };

    const requestBodyToMatch = {
      "resource": "  "
    };

    setupNockResponse(undefined, requestBodyToMatch, undefined, errorResponse);

    const msiCredsObj = new MSIVmTokenCredentials({ "resource": "  " });
    const response = await msiCredsObj.getToken();
    //expect(err).to.exist;
    //expect((err as any).error).to.equal("bad_resource_200");
    expect(response).to.not.exist;
    done();
  });
});
