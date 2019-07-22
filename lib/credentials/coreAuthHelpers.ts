import { AccessToken } from "@azure/core-auth";

interface TokenResponseLike {
  accessToken: string;
  expiresOn?: Date | string;
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
    // Start with a default 'expiresOn' and then replace with
    // the actual 'expiresOn' if one is given
    let expiresOnTimestamp: number = Date.now() + 60 * 60 * 1000;
    if (token.expiresOn) {
      expiresOnTimestamp =
        typeof token.expiresOn === "string"
          ? Date.parse(token.expiresOn)
          : token.expiresOn.getTime();
    }

    return {
      token: token.accessToken,
      expiresOnTimestamp
    } as AccessToken;
  } else {
    return token;
  }
}
