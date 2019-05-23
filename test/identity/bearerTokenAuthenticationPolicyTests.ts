// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { assert } from "chai";
import { fake } from "sinon";
import {
  HttpHeaders,
  HttpOperationResponse,
  OperationSpec,
  RequestPolicy,
  WebResource,
  RequestPolicyOptions,
  Constants
} from "@azure/ms-rest-js";
import { BearerTokenAuthenticationPolicy } from "../../lib/identity/bearerTokenAuthenticationPolicy";
import { TokenCredential } from "../../lib/identity/tokenCredential";

describe("BearerTokenAuthenticationPolicy", function() {
  const mockPolicy: RequestPolicy = {
    sendRequest(request: WebResource): Promise<HttpOperationResponse> {
      return Promise.resolve({
        request: request,
        status: 200,
        headers: new HttpHeaders()
      });
    }
  };

  it("correctly adds an Authentication header with the Bearer token", async function() {
    const mockToken = "token";
    const tokenScopes = ["scope1", "scope2"];
    const fakeGetToken = fake.returns(Promise.resolve(mockToken));
    const mockCredential: TokenCredential = {
      getToken: fakeGetToken
    };

    const bearerTokenAuthPolicy = new BearerTokenAuthenticationPolicy(
      mockPolicy,
      new RequestPolicyOptions(),
      mockCredential,
      tokenScopes
    );
    const request = createRequest();
    await bearerTokenAuthPolicy.sendRequest(request);

    assert(fakeGetToken.calledWith(tokenScopes, undefined));
    assert.strictEqual(
      request.headers.get(Constants.HeaderConstants.AUTHORIZATION),
      `Bearer ${mockToken}`
    );
  });

  function createRequest(operationSpec?: OperationSpec): WebResource {
    const request = new WebResource();
    request.operationSpec = operationSpec;
    return request;
  }
});
