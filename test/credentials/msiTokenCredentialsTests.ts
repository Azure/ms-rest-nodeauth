import { expect } from "chai";
import "mocha";
import nock from "nock";

describe("MSI authentication", () => {

  function setupNockResponse(port: number, requestBodyToMatch: any, response: any, error: any) {
    if (!port) {
      port = 50342;
    }

    const basePath = `http://localhost:${port}`;
    const interceptor = nock(basePath).post("/oauth2/token",
      function (body: any) {
        return JSON.stringify(body) === JSON.stringify(requestBodyToMatch);
      });

    if (!error) {
      interceptor.reply(200, response);
    } else {
      interceptor.replyWithError(error);
    }
  }

  it("should get token from the virtual machine with MSI service running at default port", () => {
    setupNockResponse;
  });



});