# ms-rest-nodeauth [![Build Status](https://dev.azure.com/azure-public/adx/_apis/build/status/public.Azure.ms-rest-nodeauth)](https://dev.azure.com/azure-public/adx/_build/latest?definitionId=9)

This library provides different node.js based authentication mechanisms for services in Azure. It also contains rich type definitions thereby providing good typescrit experience.
All the authentication methods support callback as well as promise. IF they are called within an async method in your application then you can use the async/await pattern as well.

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

### service-principal/secret based login
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
```typescript
import * as msRestNodeAuth from "../lib/msRestNodeAuth";

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
```typescript
import * as msRestNodeAuth from "../lib/msRestNodeAuth";

const options: msRestNodeAuth.MSIVmOptions = {
  port: 50342;
}

msRestNodeAuth.loginWithVmMSI(options).then((msiTokenRes) => {
  console.log(msiTokenRes);
}).catch((err) => {
  console.log(err);
});
```


### MSI (Managed Service Identity) based login from an AppService or Azure Function created in Azure.
```typescript
import * as msRestNodeAuth from "../lib/msRestNodeAuth";

const options: msRestNodeAuth.MSIAppServiceOptions = {
  msiEndpoint: "http://127.0.0.1:41741/MSI/token/";
}

msRestNodeAuth.loginWithAppServiceMSI(options).then((msiTokenRes) => {
  console.log(msiTokenRes);
}).catch((err) => {
  console.log(err);
});
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
