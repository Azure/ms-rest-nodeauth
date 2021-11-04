# Migrate from @azure/ms-rest-nodeauth to @azure/identity@^2.0.1

[npm-ms-rest-nodeauth]: https://www.npmjs.com/package/@azure/ms-rest-nodeauth
[npm-azure-identity]: https://www.npmjs.com/package/@azure/identity

[`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] is deprecated in favor of [`@azure/identity`][npm-azure-identity].
Our new Identity package supports the same authentication scenarios as `@azure/ms-rest-nodeauth`,
and includes a variety of new features in a way that remains consistent across languages.
This document outlines the steps needed to migrate to the identity package [@azure/identity version 2.0.1](https://www.npmjs.com/package/@azure/identity/v/2.0.1).
We also include a summary of the new features only available through `@azure/identity`.

## Table of contents

- [Install @azure/identity](#install-azureidentity)
- [Find your credential](#find-your-credential)
- [Compatible with ms-rest-js](#compatible-with-ms-rest-js)
- [Use getToken](#use-gettoken)
- [Pass a scope](#pass-a-scope)
- [Authenticate with national clouds](#authenticate-with-national-clouds)
- [New features](#new-features)
- [Troubleshooting](#troubleshooting)
- [Provide feedback](#provide-feedback)
- [Contributing](#contributing)

## Install @azure/identity

Run the following command to install our new identity package:

```
npm install --save @azure/identity@^2.0.1
```

Once you're ready to remove `@azure/ms-rest-nodeauth`, you can remove it with:

```
npm remove --save @azure/ms-rest-nodeauth
```

## Find your credential

Both `@azure/ms-rest-nodeauth` and `@azure/identity` expose credential classes used by the Azure SDK clients. Some of them have the same name, like the `AzureCliCredential`, however, most of the credential names have changed:

| `@azure/ms-rest-nodeauth` credential name | `@azure/identity` credential name |
| --- | --- |
| ApplicationTokenCredentials | ClientSecretCredential |
| ApplicationTokenCertificateCredentials | ClientCertificateCredential |
| DeviceTokenCredentials | DeviceCodeCredential |
| MSIAppServiceTokenCredentials | ManagedIdentityCredential |
| MSITokenCredentials | ManagedIdentityCredential |
| MSIVmTokenCredentials | ManagedIdentityCredential |
| UserTokenCredentials | UsernamePasswordCredential |

The next section shows that we have made the `@azure/identity` credentials backwards compatible with Azure clients based on `@azure/ms-rest-js`. However, the new Azure SDK clients are not compatible with the `@azure/ms-rest-nodeauth` credentials.

## Compatible with ms-rest-js

Since `@azure/ms-rest-nodeauth` is generally used to authenticate clients compatible with `@azure/ms-rest-js`, we have been working to adapt `@azure/ms-rest-js-` packages to be compatible with `@azure/identity` credentials. Today, you can pass any `@azure/identity` credential to a `ServiceClient` and the authentication will work as usual:

```diff
- import { AzureCliCredential } from "@azure/ms-rest-nodeauth";
+ import { AzureCliCredential } from "@azure/identity";
import * as msRest from "@azure/ms-rest-js";

async function main() {
  const credential = new AzureCliCredential();
  const client = new msRest.ServiceClient(credential);
  try {
    const req: msRest.RequestPrepareOptions = {
      url: `https://management.azure.com/<path>`,
      method: "GET",
    };

    client.sendRequest(req).then(function (res: msRest.HttpOperationResponse) {
      console.log(res.bodyAsText);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
```

## Use getToken

Besides credentials, `@azure/ms-rest-nodeauth` also exposed methods to retrieve tokens outside of the Azure service clients. These methods were usually prefixed by `loginWith` or ending in `login`, like `loginWithServicePrincipalSecretWithAuthResponse` or `interactiveLogin`. The `@azure/identity` package does not expose equivalent methods. To retrieve access tokens outside of the Azure SDK clients, we recommend calling the credentials `getToken` directly.

For example, if you were using `interactiveLogin()`, you would need to wait for this method to finish before continuing in your code. The equivalent in `@azure/identity` is the `DeviceCodeCredential`, which you need to instantiate first, and then call to the `getToken` asynchronous method to authenticate.

```diff
- import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
+ import { DeviceCodeCredential } from "@azure/identity";

async function main() {
+ const credential = new DeviceCodeCredential();
  try {
-   const authres = await msRestNodeAuth.interactiveLogin();
-   console.log(authres);
+   const accessToken = await credential.getToken("https://graph.microsoft.com/.default");
+   console.log(accessToken);
  } catch (err) {
    console.log(err);
  }
}

main();
```

In `@azure/identity`, all credentials have a `getToken` asynchronous method with standardized response type, `AccessToken`, which always contains only two properties, `expiresOnTimestamp`, which is a number, and `token`, which is a string.

## Pass a scope

While in `@azure/ms-rest-nodeauth` a `tokenAudience` could be passed through the constructor of the credentials, or a `resource` passed through the `AccessTokenOptions` of the `getAccessToken` method, in `@azure/identity`, we call them **scopes**, and they must be passed through as the first parameter to the credentials' `getToken` method, as follows:

```diff
- import { AzureCliCredential } from "@azure/ms-rest-nodeauth";
+ import { AzureCliCredential } from "@azure/identity";

async function main() {
  const credential = new AzureCliCredential();
  try {
-   const accessToken = await credential.getAccessToken({ resource: "https://graph.microsoft.com/.default" });
+   const accessToken = await credential.getAccessToken("https://graph.microsoft.com/.default");
    console.log(accessToken);
  } catch (err) {
    console.log(err);
  }
}

main();
```

## Authenticate with national clouds

While for `@azure/ms-rest-nodeauth` you would use `@azure/ms-rest-azure-env` to specify a national cloud, on `@azure/identity`, you will need to provide an `authorityHost` through the credentials' constructor and the correct `scope` through the `getToken` method.

`@azure/identity` offers a utility object `AzureAuthorityHosts` that contains authority hosts of common national clouds. Here's an example on how to authenticate with national clouds using `@azure/identity`:

```ts
import { AzureAuthorityHosts, ClientSecretCredential } from "@azure/identity";
const credential = new ClientSecretCredential(
  "<YOUR_TENANT_ID>",
  "<YOUR_CLIENT_ID>",
  "<YOUR_CLIENT_SECRET>",
  {
    authorityHost: AzureAuthorityHosts.AzureGovernment
  }
);
```

If you're using `@azure/ms-rest-js`, you also need to specify a `baseUri` on the `ServiceClient`, pointing to the correct scope in the national cloud you're working with. A complete example follows:

```diff
- import { ApplicationTokenCredentials } from "@azure/ms-rest-nodeauth";
+ import { ClientSecretCredential, AzureAuthorityHosts } from "@azure/identity";
- import { Environment } from "@azure/ms-rest-azure-env";

import * as msRest from "@azure/ms-rest-js";
import * as dotenv from "dotenv";

dotenv.config();

const clientId = process.env.AZURE_CLIENT_ID;
const domain = process.env.AZURE_TENANT_ID;
const tenantId = process.env.AZURE_TENANT_ID;
const secret = "process.env.AZURE_CLIENT_SECRET;
const tokenAudience = "https://graph.microsoft.com/";
- const environment = Environment.ChinaCloud;

async function main() {
- const credential = new ApplicationTokenCredentials(clientId, domain, secret, tokenAudience, environment);
+ const credential = new ClientSecretCredential(tenantId, clientId, secret, tokenAudience, {
+  authorityHost: AzureAuthorityHosts.AzureChina
+ });
  const client = new msRest.ServiceClient(credential, {
-    baseUri: environment.resourceManagerEndpointUrl,
+    baseUri: "https://management.chinacloudapi.cn"
  });
  try {
    const req: msRest.RequestPrepareOptions = {
      url: `https://management.azure.com/<path>`,
      method: "GET",
    };

    client.sendRequest(req).then(function (res: msRest.HttpOperationResponse) {
      console.log(res.bodyAsText);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
```

## New features

`@azure/identity` also includes a new set of features only available after upgrading. Some of them are:

- `DefaultAzureCredential`, a credential that simplifies getting started with the SDK by using credentials available in the environment, either using an account logged into the Azure CLI, or logged in via PowerShell, or Visual Studio Code plugins or environment variables.
- `EnvironmentCredential` reads values from the environment variables, like `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_CLIENT_SECRET`, `AZURE_CLIENT_CERTIFICATE_PATH`, `AZURE_USERNAME` and `AZURE_PASSWORD`, and then uses the appropriate credential to authenticate.
- `PowerShellCredential` authenticates with credentials previously used on Microsoft PowerShell.
- `ManagedIdentityCredential` authenticates applications deployed on Azure services.
- `InteractiveBrowserCredential` which authenticates interactively by opening a new browser windows.
- `AuthorizationCodeCredential` uses the [Authorization Code Flow](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow).
- `OnBehalfOfCredential` uses the [On-Behalf-of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow).

And two plugin packages:

- [@azure/identity-cache-persistence](https://www.npmjs.com/package/@azure/identity-cache-persistence) adds a persistence layer to the credentials cache.
- [@azure/identity-vscode](https://www.npmjs.com/package/@azure/identity-vscode) lets users authenticate through the credentials used on the Visual Studio Code editor through the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension.

You can find more information about the new features in:

- The [@azure/identity README](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md).
- The [advanced samples on @azure/identity](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/samples/AzureIdentityExamples.md).

## Troubleshooting

On `@azure/identity`, we provide a [troubleshooting guide](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/Troubleshooting.md), which includes solutions to many common problems users have encountered. Errors and exception logs on the new package link to this troubleshooting guide.

## Provide feedback

If you encounter bugs or have suggestions, [open an issue](https://github.com/Azure/azure-sdk-for-js/issues).

## Contributing

To contribute to this library, see the [contributing guide](https://github.com/Azure/azure-sdk-for-js/blob/main/CONTRIBUTING.md).
