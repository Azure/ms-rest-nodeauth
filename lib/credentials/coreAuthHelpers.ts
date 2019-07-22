import { AccessToken } from "@azure/core-auth";

interface TokenResponseLike {
  accessToken: string;
  expiresOn: Date | string;
}

/**
 * Prepares a TokenResponse to be returned as a TokenResponse or
 * a @azure/core-auth AccessToken depending on whether the 'scopes'
 * parameter is null or not (the key to determining which getToken
 * method has been called).
 */
export function prepareToken<T extends TokenResponseLike>(
  token: T,
  scopes: string | string[] | undefined): T | AccessToken {
  // Scopes will contain _some_ value if a parameter was passed to getToken
  if (scopes !== undefined) {
    return {
      token: token.accessToken,
      expiresOnTimestamp:
        typeof token.expiresOn === "string"
          ? Date.parse(token.expiresOn)
          : token.expiresOn.getTime()
    } as AccessToken;
  } else {
    return token;
  }
}
