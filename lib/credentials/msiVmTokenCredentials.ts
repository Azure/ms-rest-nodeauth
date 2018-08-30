import { MSITokenCredentials } from "./msiTokenCredentials";
import { MSIVmOptions, TokenResponse, Callback } from "../login";
import * as request from "request";
import { CoreOptions as HttpRequestOptions } from "request";

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
   * @param  {function} callback  The callback in the form (err, result)
   * @return {function} callback
   *                       {Error} [err]  The error if any
   *                       {object} [tokenResponse] The tokenResponse (tokenType and accessToken are the two important properties).
   */
  getToken(callback: Callback<TokenResponse>): void {
    const postUrl = `http://localhost:${this.port}/oauth2/token`;
    const reqOptions = this.prepareRequestOptions();
    request.post(postUrl, reqOptions, (err, _response, body) => {
      if (err) {
        return callback(err);
      }
      try {
        const tokenResponse = this.parseTokenResponse(body);
        if (!tokenResponse.tokenType) {
          throw new Error(`Invalid token response, did not find tokenType. Response body is: ${body}`);
        } else if (!tokenResponse.accessToken) {
          throw new Error(`Invalid token response, did not find accessToken. Response body is: ${body}`);
        }

        return callback(undefined, tokenResponse);
      } catch (error) {
        return callback(error);
      }
    });
  }

  prepareRequestOptions(): HttpRequestOptions {
    const resource = encodeURIComponent(this.resource);
    const reqOptions: HttpRequestOptions = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Metadata": "true"
      },
      body: `resource=${resource}`
    };

    return reqOptions;
  }
}