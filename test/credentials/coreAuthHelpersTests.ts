// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { assert } from "chai";
import { prepareToken } from "../../lib/credentials/coreAuthHelpers";

describe("prepareToken", function() {
  it("returns an AccessToken when scope is set", function() {
    const expiresOn = new Date();
    const result = prepareToken({
      accessToken: "token",
      expiresOn
    }, "scope");

    assert.deepEqual(result, {
      token: "token",
      expiresOnTimestamp: expiresOn.getTime()
    });
  });

  it("returns an AccessToken with correct timestamp when expiresOn is a string", function() {
    const expiresOn = "06/20/2019 02:57:58 +00:00";
    const result = prepareToken({
      accessToken: "token",
      expiresOn
    }, "scope");

    assert.deepEqual(result, {
      token: "token",
      expiresOnTimestamp: Date.parse(expiresOn)
    });
  });

  it("returns an unmodified TokenResponse when scope is not set", function() {
    const expiresOn = new Date();
    const tokenResponse = {
      accessToken: "token",
      expiresOn
    };

    const result = prepareToken(tokenResponse, undefined);
    assert.deepEqual(result, tokenResponse);
  });
});
