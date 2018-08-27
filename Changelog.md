### 0.1.1 - 2018/08/27
- Domain is no longer a required parameter for MSITokenCredentials.
- Rename LoginWithMSIOptions interface to MSIOptions

### 0.1.0 - 2017/09/16
- Initial version of ms-rest-nodeauth
- Provides following flavors of authentication in different Azure Clouds
  - Authentication via service principal
  - Authentication via username/password
  - Interactive authentication (device code flow)
  - Authentication via auth file
  - MSI (Managed Service Identity) based authentication from a virtual machine created in Azure.