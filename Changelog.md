# Changelog

## 0.8.0 - 2018/11/12

- Rename package to "@azure/ms-rest-nodeauth"

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