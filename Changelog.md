# Changelog

## 3.0.5 - (unreleased)

- The helper method `buildTenantList` is made public. This is helpful if one needs to get the Ids of all the tenants in the account programmatically.
- A new method `setDomain()` which takes the Id of a tenant is now available on all credentials. Use this to change the domain i.e. the tenant against which tokens are created.
- Fixed typos in error messages.
- Added support for passing a `clientId` property in the `options` parameter of the MSI based login method `loginWithAppServiceMSI()`. This is required to allow user-assigned managed identities to be used to authenticate through Azure App Services and Azure Functions.
- Added support for the `IDENTITY_ENDPOINT` and `IDENTITY_SECRET` when using the `MSIAppServiceTokenCredentials` credentials.

## 3.0.4 - 2020/05/19 (deprecated)

- Through a mistake of release automation, a CI job from PR #91 got shipped by accident.

## 3.0.2 - 2019/08/22

- Fixed a bug where the callback to `loginWithServicePrincipalSecretWithAuthResponse` is sometimes not called.

## 3.0.2 - 2019/08/16
- Fix bug prevent tenant IDs from being discovered on auth

## 3.0.1 - 2019/08/06
- Reduce number of `Promise` object allocations inside `async` functions.

## 3.0.0 - 2019/08/02
- **Breaking change:**
  - Updated min version of dependency `@azure/ms-rest-js` from `^1.8.13` to `^2.0.4` there by fixing [#67](https://github.com/Azure/ms-rest-nodeauth/issues/67).

## 2.0.4 - 2019/08/02
- Rolled back the min version of dependency `@azure/ms-rest-js` from `^2.0.3` to `^1.8.13` thereby fixing [#69](https://github.com/Azure/ms-rest-nodeauth/issues/69).

## 2.0.3 - 2019/07/23
- Updated min version of dependency `@azure/ms-rest-js` to `^2.0.3`.
- Updated min version of dependency `@azure/ms-rest-azure-env` to `^2.0.0`.
- Improved documentation of `MSIOptions.resource`
- Improved samples in README.md

## 2.0.2 - 2019/06/13
 - Ensure we always get JSON responses back from Azure CLI.

## 2.0.1 - 2019/05/22
 - Get subscriptions while authenticating only if the token audience is for Azure Resource Manager.

## 2.0.0 - 2019/05/20
- Added support for client_id, object_id and ms_res_id query parameters for VmMSI. Fixes [#58](https://github.com/Azure/ms-rest-nodeauth/issues/58).
- **Breaking change:**
  - Added support to get token for a different resource like Azure Keyvault, Azure Batch, Azure Graph apart from the default Azure Resource Manager resource via `AzureCliCredentials`.
  - `AzureCliCredentials.create()` now takes an optional parameter where the user can specify the subscriptionId and the resource for which the token is required.
  - `AzureCliCredentials.getDefaultSubscription()` has been changed to `AzureCliCredentials.getSubscription(subscriptionIdOrName?: string)`.

## 1.1.1 - 2019/05/16
- Minor updates

## 1.1.0 - 2019/05/16
- Added support to get credentials from `Azure CLI`, provided the user is already logged in via CLI.
These credentials can be used by the SDK to make requests to Azure. Fixes,
- [azure-sdk-for-js/issues/2810](https://github.com/Azure/azure-sdk-for-js/issues/2810)
- [azure-sdk-for-node/issues/2284](https://github.com/Azure/azure-sdk-for-node/issues/2284).

## 1.0.1 - 2019/05/06
- Update README.md
- Fix repository url in package.json

## 1.0.0 - 2019/05/06
- Added support for ServicePrincipal login with certificates.
- Updated dependencies to their latest versions.

## 0.9.3 - 2019/04/04
- Updated `@azure/ms-rest-js` to the latest version `^1.8.1`.

## 0.9.2 - 2019/03/26
- Updated the return types  for calls using interactive login, user name/ password and service principal to return the right types with promise flavor methods.

## 0.9.1 - 2019/01/15
- Fixed issues in AppService MSI login.
- Improved documentation of `MSIAppServiceTokenCredentials.getToken()`
## 0.9.0 - 2019/01/11
- Added support for custom MSI endpoint.

## 0.8.4 - 2019/01/09
- Exported MSI login methods from the package.

## 0.8.3 - 2018/12/18
- Added a check for verifying the package.json version
- Added azure pipelines for CI.

## 0.8.2 - 2018/11/19
- Fixed incorrect path in the "main" node of package.json.

## 0.8.1 - 2018/11/19
- Added owners and issue template.
- Improved internal structure of the package.

## 0.8.0 - 2018/11/12

- Renamed package to "@azure/ms-rest-nodeauth"

## 0.6.0 - 2018/09/27

- Move KeyVaultCredentials into KeyVault SDK project
- Add KeyVaultFactory which helps creating authentication method from various credential types.

## 0.5.3 - 2018/09/19

- Updated documentation

## 0.5.2 - 2018/09/18

- Added KeyVaultCredentials

## 0.5.1 - 2018/09/18

- Added TopicCredentials

## 0.5.0 - 2018/08/16

- Added support for MSI authentication
- Updated ms-rest-js package to 0.19 version
- Updated ms-rest-azure-env package to 0.1.1 version

## 0.4.0 - 2018/08/08

- Updated ms-rest-js package to 0.18 version

## 0.3.0 - 2018/08/06

- Updated ms-rest-js package to 0.17 version

## 0.2.0 - 2018/07/27

- Updated ms-rest-js package to 0.14 version

## 0.1.1 - 2018/08/27

- Domain is no longer a required parameter for MSITokenCredentials.
- Rename LoginWithMSIOptions interface to MSIOptions

## 0.1.0 - 2017/09/16

- Initial version of ms-rest-nodeauth
- Provides following flavors of authentication in different Azure Clouds
  - Authentication via service principal
  - Authentication via username/password
  - Interactive authentication (device code flow)
  - Authentication via auth file
  - MSI (Managed Service Identity) based authentication from a virtual machine created in Azure.
