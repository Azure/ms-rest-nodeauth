// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenCredential } from "./tokenCredential";
import {
  BaseRequestPolicy,
  RequestPolicy,
  RequestPolicyOptions,
  Constants,
  HttpHeaders,
  HttpOperationResponse,
  WebResource
} from "@azure/ms-rest-js";

/**
 *
 * Provides a RequestPolicy that can request a token from a TokenCredential
 * implementation and then apply it to the Authorization header of a request
 * as a Bearer token.
 *
 */
export class BearerTokenAuthenticationPolicy extends BaseRequestPolicy {
  /**
   * Creates a new BearerTokenAuthenticationPolicy object.
   *
   * @param nextPolicy The next RequestPolicy in the request pipeline.
   * @param options Options for this RequestPolicy.
   * @param credential The TokenCredential implementation that can supply the bearer token.
   * @param scope The scope for which the bearer token applies.
   */
  constructor(
    nextPolicy: RequestPolicy,
    options: RequestPolicyOptions,
    private credential: TokenCredential,
    private scope: string
  ) {
    super(nextPolicy, options);
  }

  /**
   * Applies the Bearer token to the request through the Authorization header.
   * @param webResource
   */
  public async sendRequest(
    webResource: WebResource
  ): Promise<HttpOperationResponse> {
    if (!webResource.headers) webResource.headers = new HttpHeaders();
    const token = await this.credential.getToken(
      [this.scope],
      webResource.abortSignal
    );
    webResource.headers.set(
      Constants.HeaderConstants.AUTHORIZATION,
      `Bearer ${token}`
    );
    return this._nextPolicy.sendRequest(webResource);
  }
}
