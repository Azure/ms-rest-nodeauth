# ms-rest-nodeauth [![Build Status](https://dev.azure.com/azure-public/adx/_apis/build/status/public.Azure.ms-rest-nodeauth)](https://dev.azure.com/azure-public/adx/_build/latest?definitionId=9)

This library provides different node.js based authentication mechanisms for services in Azure. It also contains rich type definitions thereby providing a good TypeScript experience.

All the authentication methods support callbacks as well as promises. If they are called within an async method in your application then you can use the async/await pattern as well.

Things to consider:

- Many of these authentication methods accept a `domain` to be specified, which accepts `tenants` to be passed in.
- For personal accounts, credentials created without passing a domain won't be able to access most of the account resources automatically.
- In this case you will need to call `buildTenantList` to gather the list of tenants so that the ID of one of them can be passed into the `setDomain` method of the returned credential.
  Once the domain is set, you will be able to access resources from subscriptions in that tenant.

### Example

### username/password based login
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const username = process.env["AZURE_USERNAME"];
const password = process.env["AZURE_PASSWORD"];

msRestNodeAuth.loginWithUsernamePasswordWithAuthResponse(username, password).then((authres) => {
  console.dir(authres, { depth: null })
}).catch((err) => {
  console.log(err);
});
```

### service-principal and secret based login
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const clientId = process.env["CLIENT_ID"];
const secret = process.env["APPLICATION_SECRET"];
const tenantId = process.env["DOMAIN"];

msRestNodeAuth.loginWithServicePrincipalSecretWithAuthResponse(clientId, secret, tenantId).then((authres) => {
  console.dir(authres, { depth: null })
}).catch((err) => {
  console.log(err);
});
```

#### service-principal and certificate based login by providing an ABSOLUTE file path to the .pem file
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const clientId = process.env["CLIENT_ID"];
const tenantId = process.env["DOMAIN"];

msRestNodeAuth.loginWithServicePrincipalCertificateWithAuthResponse(clientId, "/Users/user1/foo.pem", tenantId).then((authres) => {
  console.dir(authres, { depth: null })
}).catch((err) => {
  console.log(err);
});
```

#### service-principal and certificate based login by providing the certificate and private key (contents of the .pem file)
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const clientId = process.env["CLIENT_ID"];
const tenantId = process.env["DOMAIN"];
const certificate = 
`
-----BEGIN PRIVATE KEY-----
xxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxx
-----END PRIVATE KEY-----
-----BEGIN CERTIFICATE-----
yyyyyyyyyyyyyyyyy
yyyyyyyyyyyyyyyyy
-----END CERTIFICATE-----
`;

msRestNodeAuth.loginWithServicePrincipalCertificateWithAuthResponse(clientId, certificate, tenantId).then((authres) => {
  console.dir(authres, { depth: null })
}).catch((err) => {
  console.log(err);
});
```

### interactive/device-code flow login
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

msRestNodeAuth.interactiveLoginWithAuthResponse().then((authres) => {
  console.dir(authres, { depth: null })
}).catch((err) => {
  console.log(err);
});
```

### service-principal authentication from auth file on disk
Before using this method please install az cli from https://github.com/Azure/azure-cli/releases.
Then execute `az ad sp create-for-rbac --sdk-auth > ${yourFilename.json}`.

If you want to create the sp for a different cloud/environment then please execute:
1. az cloud list
2. az cloud set –n <name of the environment>
3. az ad sp create-for-rbac --sdk-auth > auth.json // create sp with **secret**.
  
          OR
          
   az ad sp create-for-rbac --create-cert --sdk-auth > auth.json // create sp with **certificate**.
If the service principal is already created then login with service principal info:
4. az login --service-principal -u `<clientId>` -p `<clientSecret>` -t `<tenantId>`
5. az account show --sdk-auth > auth.json

```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const options: msRestNodeAuth.LoginWithAuthFileOptions = {
  filePath: "<file path to auth file>",
}
msRestNodeAuth.loginWithAuthFileWithAuthResponse(options).then((authRes) => {
  console.log(authRes);
  console.log(process.env["AZURE_SUBSCRIPTION_ID"]);
}).catch((err) => {
  console.log(err);
});
```

### MSI (Managed Service Identity) based login from a virtual machine created in Azure.

The code below works for both system managed and user managed identities. You can leave the `MSIVmOptions` empty if you want to use system managed identity. If you want to use the user managed identity, you must at least provide the `clientId`.

```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const options: msRestNodeAuth.MSIVmOptions = {
  // Azure Instance Metadata Service identity endpoint.
  // The default and recommended endpoint is "http://169.254.169.254/metadata/identity/oauth2/token"
  // per https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview
  //
  //     msiEndpoint: "http://169.254.169.254/metadata/identity/oauth2/token",
  //

  // The API version parameter specifies the Azure Instance Metadata Service version.
  // Use api-version=2018-02-01 (default) or higher.
  //
  //     apiVersion: "2018-02-01",
  //

  // HTTP method used to make HTTP request to MSI service. GET by default.
  //
  //     httpMethod: "GET",
  //

  // The objectId of the managed identity you would like the token for.
  // Required, if your VM has multiple user-assigned managed identities.
  //
  //     objectId: "48f97062-a6f3-48ae-b05b-e6df3468c256",
  //

  // The clientId of the managed identity you would like the token for.
  // Required, if your VM has multiple user-assigned managed identities.
  //
  //     clientId: "48f97062-a6f3-48ae-b05b-e6df3468c256",
  //

  // The `Azure Resource ID` of the managed identity you would like the token for.
  // Required, if your VM has multiple user-assigned managed identities.
  //
  //     identityId: "48f97062-a6f3-48ae-b05b-e6df3468c256",
  //
}

msRestNodeAuth.loginWithVmMSI(options).then((msiTokenRes) => {
  console.log(msiTokenRes);
}).catch((err) => {
  console.log(err);
});
```

### MSI (Managed Service Identity) based login from an AppService or Azure Function created in Azure.
```typescript
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const options: msRestNodeAuth.MSIAppServiceOptions = {
  // The local URL from which your app can request tokens.
  // For example: `export MSI_ENDPOINT="http://127.0.0.1:41741/MSI/token/"`.
  // Many Azure services have the environment variables "MSI_ENDPOINT" or "IDENTITY_ENDPOINT" set.
  // Our client will try to load the endpoint from any of these environment variables by default.
  //
  //     msiEndpoint: process.env["MSI_ENDPOINT"] || process.env["IDENTITY_ENDPOINT"] || "http://127.0.0.1:41741/MSI/token/",
  //

  // The secret used in communication between your code and the local MSI agent.
  // Either provide this parameter or set the environment variable `MSI_SECRET`.
  // For example: `export MSI_SECRET="69418689F1E342DD946CB82994CDA3CB"`
  //
  //     msiSecret: "69418689F1E342DD946CB82994CDA3CB",
  //

  // The api-version of the local MSI agent. Default value is "2017-09-01".
  //
  //     msiApiVersion: "2017-09-01",
  //

  // The clientId of the managed identity you would like the token for.
  // Required, if your app service has user-assigned managed identities.
  clientId: "48f97062-a6f3-48ae-b05b-e6df3468c256"
}

msRestNodeAuth.loginWithAppServiceMSI(options).then((msiTokenRes) => {
  console.log(msiTokenRes);
}).catch((err) => {
  console.log(err);
});
```

### Getting credentials via Azure CLI.

**Pre-requisite**
- **Install azure-cli**. For more information see [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).
- **Login via `az login`**
- Detailed sample over [here](./samples/getCredentialsFromAzureCli.ts).

```typescript
import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import { ServiceClient, RequestPrepareOptions } from "@azure/ms-rest-js";

async function main(): Promise<void> {
  try {
    // Please make sure you have logged in via Azure CLI `az login` before executing this script.
    const creds = await AzureCliCredentials.create();
    const client = new ServiceClient(creds);
    console.log(">>> Subscription associated with the access token: '%s'.",
      creds.tokenInfo.subscription);

    const request: RequestPrepareOptions = {
      url: getUrl(creds.subscriptionInfo.id),
      method: "GET"
    };
    console.log(">>> Request url: '%s'.", request.url);

    const res = await client.sendRequest(request);
    console.log("List of resource groups from subscriptionId '%s': \n%O",
      creds.subscriptionInfo.id, res.parsedBody);

    // Let us change the subscriptionId, which should trigger refreshing the access token.
    const subscriptions = await AzureCliCredentials.listAllSubscriptions();
    creds.subscriptionInfo = subscriptions[1];

    console.log(">>> The new subscription id associated with the credential object is: '%s'.",
      creds.subscriptionInfo.id);
    request.url = getUrl(creds.subscriptionInfo.id);
    console.log(">>> Request url: '%s'.", request.url);

    const res2 = await client.sendRequest(request);
    console.log("List of resource groups from subscriptionId '%s': \n%O",
      creds.subscriptionInfo.id, res2.parsedBody);

    console.log(">>> Subscription associated with the access token: '%s'.",
      creds.tokenInfo.subscription);
  } catch (err) {
    console.log(err);
  }
}

function getUrl(subscriptionId: string): string {
  return `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2018-05-01`;
}

main();
```

### Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
