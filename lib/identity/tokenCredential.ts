// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { AbortSignalLike } from "@azure/ms-rest-js";

/**
 * Represents a credential capable of providing an authentication token.
 */
export abstract class TokenCredential {
  /**
   * Gets the token provided by this credential.
   *
   * @param scopes The list of scopes for which the token will have access.
   * @param aborter The AbortSignalLike used for aborting the token request.
   */
  public abstract getToken(
    scopes: string[],
    aborter?: AbortSignalLike
  ): Promise<string>;
}
