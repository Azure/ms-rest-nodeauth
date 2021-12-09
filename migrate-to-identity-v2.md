# Migrate from @azure/ms-rest-nodeauth to @azure/identity v2

[npm-ms-rest-nodeauth]: https://www.npmjs.com/package/@azure/ms-rest-nodeauth
[npm-azure-identity]: https://www.npmjs.com/package/@azure/identity

The [`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] package is mainly used to authenticate requests to the Azure Resource Manager from packages with names that start with `@azure/arm-`. The newer [`@azure/identity`][npm-azure-identity] package supports all the authentication mechanisms supported by [`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] and more.

This document outlines the steps needed to migrate from [`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] to [`@azure/identity`][npm-azure-identity] when working with the packages that talk to Azure Resource Manager (i.e. the ones with names starting from `@azure/arm-`). Please ignore this document if you are using [`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] with other Azure packages.

Important dates:

- **By mid 2021**, the `@azure/arm-` packages started supporting credentials from [`@azure/identity`][npm-azure-identity] and `@azure/ms-rest-nodeauth` side by side.
- **Starting on December 2021**, new major versions of the `@azure/arm-` packages will be dropping support for [`@azure/ms-rest-nodeauth`][npm-ms-rest-nodeauth] altogether and will only support credentials from `@azure/identity`.


## Table of contents

- [Install @azure/identity](#install-azureidentity)
- [Find your credential](#find-your-credential)
- [Authenticate with national clouds](#authenticate-with-national-clouds)
- [List subscriptions](#list-subscriptions)
- [AuthFile to AzureCliCredential](#authfile-to-azureclicredential)
- [If you use getToken](#if-you-use-gettoken)
- [Regarding scopes](#regarding-scopes)
- [New features](#new-features)
- [Troubleshooting](#troubleshooting)
- [Provide feedback](#provide-feedback)
- [Contributing](#contributing)

## Install @azure/identity

Run the following command to install the new Identity client library in your existing project:

```
npm install --save @azure/identity@^2.0.1
```

Once you're ready to remove `@azure/ms-rest-nodeauth` from your project, either remove it manually from the `package.json` file or remove it with:

```
npm remove --save @azure/ms-rest-nodeauth
```

## Find your credential

Both `@azure/ms-rest-nodeauth` and `@azure/identity` expose credential classes used by the Azure SDK clients. 

The `@azure/ms-rest-nodeauth` package also exposes methods that return the credential after making an initial call to get the access token using the same credential. Each of these methods have a counterpart whose name ends with `withAuthResponse` which does the same, but also returns a list of subscriptions related to the authenticated account.

The new `@azure/identity` package does not expose such methods. You will need to use the `@azure/arm-subscriptions` package to fetch the subscriptions.

The following table lists login methods from `@azure/ms-rest-nodeauth` along with the credential they return and their equivalent credentials in `@azure/identity`.

| `@azure/ms-rest-nodeauth` login method | `@azure/identity` credential name |
| --- | --- |
| `interactiveLogin`, which returns `DeviceTokenCredentials` | `DeviceCodeCredential` |
| `loginWithUsernamePassword` and `loginWithUsernamePasswordWithAuthResponse` which return `UserTokenCredentials` | `UsernamePasswordCredential`. See the [list subscriptions](#list-subscriptions) section. |
| `loginWithServicePrincipalSecret`, which returns `ApplicationTokenCredentials` | `ClientSecretCredential` |
| `loginWithAuthFile` and `loginWithAuthFileWithAuthResponse`, when they return `ApplicationTokenCredentials` | `AzureCliCredential`. See [AuthFile to AzureCliCredential](#authfile-to-azureclicredential) section and the [list subscriptions](#list-subscriptions) section. |
| `loginWithAuthFile` and `loginWithAuthFileWithAuthResponse`, when they return `ApplicationTokenCertificateCredentials` | `ClientCertificateCredential`. See [AuthFile to AzureCliCredential](#authfile-to-azureclicredential) section and the [list subscriptions](#list-subscriptions) section. |
| `loginWithVmMSI`, which returns `MSIVmTokenCredentials` | `ManagedIdentityCredential` |
| `loginWithAppServiceMSI`, which returns `MSIAppServiceTokenCredentials` | `ManagedIdentityCredential` |
| `loginWithServicePrincipalCertificate` and `loginWithServicePrincipalCertificateWithAuthResponse`, which return `ApplicationTokenCertificateCredentials` | `ClientCertificateCredential`. See the [list subscriptions](#list-subscriptions) section. |

Our HTTP pipelines will manage the authentication, including the caching and refreshing of tokens internally. After passing the credentials to the SDK clients, developers can focus directly on calling the client methods. For example:

```ts
import { DefaultAzureCredential } from "@azure/identity";
import { KeyClient } from "@azure/keyvault-keys";

/**
 * For more information: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity#defaultazurecredential
 */

async function main() {
  const credential = new DefaultAzureCredential();

  const keyVaultUrl = "https://key-vault-name.vault.azure.net";
  const client = new KeyClient(keyVaultUrl, credential);
  
  // After this point, users would generally only use the client methods.

  // Here, we retrieve the properties of the existing keys in a Key Vault.
  console.log(await client.listPropertiesOfKeys().next());
}

main();
```

## Authenticate with national clouds

While for `@azure/ms-rest-nodeauth`, you would use `@azure/ms-rest-azure-env` to specify a national cloud, on `@azure/identity`, you will need to provide an `authorityHost` through the credentials' constructor.

`@azure/identity` offers a utility object `AzureAuthorityHosts` that contains authority hosts of common national clouds. Here's an example of authenticating with national clouds using `@azure/identity`:

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

You will continue specifying a `baseUri` when creating the client in the Azure package to point to the correct scope relative to a national cloud. An example follows:

```diff
- import { ApplicationTokenCredentials } from "@azure/ms-rest-nodeauth";
+ import { ClientSecretCredential, AzureAuthorityHosts } from "@azure/identity";
- import { Environment } from "@azure/ms-rest-azure-env";
import { SubscriptionClient } from "@azure/arm-subscriptions";

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
  const client = new SubscriptionClient(credential, {
-  baseUri: environment.resourceManagerEndpointUrl,
+  baseUri: "https://management.chinacloudapi.cn"
  });

  const subscriptions = await client.subscriptions.list();
  console.log(subscriptions);
}

main().catch(console.error);
```

If you need the access token separately, make sure to provide the correct scope to the `getToken()` method of the credential. More information about the `getToken()` method in the [If you use getToken](#if-you-use-gettoken) section.

### List subscriptions

While the `*WithAuthResponse methods of the `@azure/ms-rest-nodeauth` return an `AuthResponse` type containing the authenticated credentials and a list of subscriptions, retrieving Azure subscriptions isn't integrated in the `@azure/identity` package. This feature is available through the external [`@azure/arm-subscriptions`](https://www.npmjs.com/package/@azure/arm-subscriptions) package.

First, install `@azure/arm-subscriptions` by running the following command:

```
npm install --save @azure/arm-subscriptions
```

Then, use any of the `@azure/identity` credentials to retrieve the account subscriptions, as follows:

```ts
import { DefaultAzureCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";
const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];

async function main() {
  const credential = new DefaultAzureCredential();
  const client = new SubscriptionClient(credential, subscriptionId);
  const subscriptions = await client.subscriptions.list();
}

main();
```

### AuthFile to AzureCliCredential

Using `@azure/ms-rest-nodeauth`, it is possible to authenticate with the path to a file generated by running the following Azure CLI commands:

```azurecli
az login --service-principal -u <clientId> -p <clientSecret> -t <tenantId>
az account show --sdk-auth > auth.json
```

The path to this file would then be sent to either `loginWithAuthFile` or `loginWithAuthFileWithAuthResponse`, as follows:

```ts
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const options: msRestNodeAuth.LoginWithAuthFileOptions = {
  filePath: "<file path to auth file>",
};
msRestNodeAuth.loginWithAuthFileWithAuthResponse(options).then((authRes) => {
  console.log(authRes);
  console.log(process.env["AZURE_SUBSCRIPTION_ID"]);
}).catch(console.error);
```

Auth files would contain critical information about the account logged in, such as secrets and certificates.

`@azure/identity` instead has `AzureCliCredential`, which uses the account logged in through the Azure CLI (by calling to `az login` before running your Node.js program).

The following diff shows the code changes needed to migrate from `loginWithAuthFileWithAuthResponse` to the `AzureCliCredential`:

```diff
import { SubscriptionClient } from "@azure/arm-subscriptions";
- import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
+ import { AzureCliCredential } from "@azure/identity";

async function main() {
+ const credential = new AzureCliCredential();
- const authres = await msRestNodeAuth.msRestNodeAuth.loginWithAuthFileWithAuthResponse({
-   filePath: "<file path to auth file>",
- });
- console.log(authres);
- const credential = authres.credentials;

  const client = new SubscriptionClient(credential);
  const subscriptions = await client.subscriptions.list();
  console.log(subscriptions);
}

main().catch(console.error);
```

### If you use getToken

If direct control of the authentication flow is necessary, call the credential `getToken` method directly.

In `@azure/identity`, all credentials have an asynchronous `getToken` method with standardized response type `AccessToken`. `AccessToken` always contains only two properties:

- `expiresOnTimestamp`, which is a number.
- `token`, which is a string.

Consider the following example of migrating from the `interactiveLogin()` method to the `DeviceCodeCredential`'s `getToken` method:

```diff
- import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
+ import { DeviceCodeCredential } from "@azure/identity";

async function main() {
- const credential = await msRestNodeAuth.interactiveLogin();
- const tokenResponse = await credential.getToken();
- console.log(tokenResponse);
+ const credential = new DeviceCodeCredential();
+ const accessToken = await credential.getToken("https://graph.microsoft.com/.default");
+ console.log(accessToken);
}

main().catch(console.error);
```

Credentials that require user interaction, like the `DeviceCodeCredential`, now also expose a new `authenticate()` method. This method allows developers to control when to request user interaction. For more information, see [Identity Examples - Control user interaction](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/samples/AzureIdentityExamples.md#control-user-interaction).

## Regarding scopes

In `@azure/ms-rest-nodeauth`, a `tokenAudience` can be passed through the constructor of the credentials. Alternatively, a `resource` can be passed through the `AccessTokenOptions` of the `getAccessToken` method. In `@azure/identity`, we call them **scopes**. They're sent as the first parameter to the credentials' `getToken` method.

While scopes (or resources) are generally provided to the new credentials internally by the Azure SDK clients, a scope is necessary in the authentication flows where it's required to call to `getToken` directly.

Scopes generally include permissions. For example, to request a token that could have read access to the currently authenticated user, the scope would be `https://graph.microsoft.com/User.Read`. An app may also request any available permission, as defined through the app registration on the Azure portal, by sending a request ending in `/.default` as the scope. For more information about Azure scopes and permissions, see [Permissions and consent in the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent).

The following example code shows how to migrate from using `@azure/ms-rest-nodeauth`'s `tokenAudience` to `@azure/identity`'s `getToken`, with a scope that grants Key Vault access:

```diff
- import { interactiveLogin } from "@azure/ms-rest-nodeauth";
+ import { AzureCliCredential } from "@azure/identity";

async function main() {
-  const authResponse = await interactiveLogin({
-    tokenAudience: "https://vault.azure.net/"
-  });
+  const credential = new AzureCliCredential("https://vault.azure.net/.default");
}

main().catch(console.error);
```

## New features

`@azure/identity` also includes a new set of features only available after upgrading. Some of them are:

- `DefaultAzureCredential`, a credential that simplifies getting started with the client library by using credentials available in the environment, using:
  - Environment variables.
  - Or environment-specific credentials available on deployed Azure services.
  - Or credentials previously used to authenticate via the Visual Studio Code [extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) (which requires the [@azure/identity-vscode plugin](https://www.npmjs.com/package/@azure/identity-vscode)).
  - Or an account logged into the Azure CLI.
  - Or an account logged in via PowerShell.
- `EnvironmentCredential` reads values from the environment variables, then uses the appropriate credential to authenticate. Environment variables may include: 
  - `AZURE_CLIENT_ID`
  - `AZURE_TENANT_ID`
  - `AZURE_CLIENT_SECRET`
  - `AZURE_CLIENT_CERTIFICATE_PATH`
  - `AZURE_USERNAME`
  - `AZURE_PASSWORD`
- `PowerShellCredential` authenticates with credentials previously used on Microsoft PowerShell.
- `ManagedIdentityCredential` authenticates apps deployed on Azure services.
- `InteractiveBrowserCredential` which authenticates interactively by opening a new browser windows.
- `AuthorizationCodeCredential` uses the [Authorization Code Flow](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow).
- `OnBehalfOfCredential` uses the [On-Behalf-Of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow).

And two plugin packages:

- [@azure/identity-cache-persistence](https://www.npmjs.com/package/@azure/identity-cache-persistence) adds a persistence layer to the credentials cache.
- [@azure/identity-vscode](https://www.npmjs.com/package/@azure/identity-vscode) lets users authenticate through the credentials used on the Visual Studio Code editor through the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension.

You can find more information about the new features in:

- The [@azure/identity README](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md).
- The [advanced samples on @azure/identity](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/samples/AzureIdentityExamples.md).

## Troubleshooting

For `@azure/identity`, see the [troubleshooting guide](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/Troubleshooting.md). The guide includes solutions to many common problems users have encountered. Errors and exception logs on the new package link to this troubleshooting guide.

## Provide feedback

If you encounter bugs or have suggestions, [open an issue](https://github.com/Azure/azure-sdk-for-js/issues).

## Contributing

To contribute to this library, see the [contributing guide](https://github.com/Azure/azure-sdk-for-js/blob/main/CONTRIBUTING.md).
