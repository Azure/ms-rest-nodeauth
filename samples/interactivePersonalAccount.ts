/**
* The authentication methods in `@azure/ms-rest-nodeauth` accept a `domain` in the options 
* parameter where you can pass the ID of your tenant. When using personal accounts, 
* credentials created with no `domain` fail to generate the right token for authentication. 
* For the same reason, the list of subscriptions expected in the return value of these methods
* will be empty for personal accounts too.
*
* You can get the tenant ID from the Azure Portal or Azure CLI. 
* This sample shows how to get the tenant ID programmatically, and update an existing credential to use it.
*/
import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import * as dotenv from "dotenv";
dotenv.config();

// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/interactive.ts

async function main(): Promise<void> {
  try {
    // Personal accounts will return no subscriptions on the initial authentication request unless domain is specified.
    // This is because the credentials are generated without specifying a tenant.
    //
    // For more context:
    // When we authenticate with the Azure Active Directory (AAD), it attempts to associate
    // the authenticating user with a target "directory". This directory is specified by the given "domain".
    // If no domain is specified, the "common" domain is assumed.
    // In this `common` domain, while organizations might have shared resources, personal accounts will show nothing.
    // In AAD v2, the "organizations" domain was added, to allow users to authenticate and view all of the available resources
    // regardless of the type of account they might have.
    // Since `ms-rest-nodeauth` only supports AAD v1, we have to change the domain after authenticating, as shown in this sample file.
    //
    // Our new `@azure/identity` package provides support for AAD v2:
    // https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/identity/identity
    const authentication = await msRestNodeAuth.interactiveLoginWithAuthResponse();
    console.log(
      "Subscriptions retrieved by default",
      authentication.subscriptions
    );

    // For personal accounts, the following code will return empty subscriptions:
    const client = new SubscriptionClient(authentication.credentials);
    let subscriptions = await client.subscriptions.list();
    console.log(`These subscriptions will be empty for personal accounts`, subscriptions);

    // To get the tenants for your account, you can use the buildTenantList method:
    const tenants = await msRestNodeAuth.buildTenantList(
      authentication.credentials
    );

    // If you have already authenticated and you want to retrieve the subscriptions of a specific tenant,
    // you can set the credential's domain to the tenant you want to use,
    // then retrieve your tenant's subscriptions with the SubscriptionsClient from @azure/arm-subscriptions:
    authentication.credentials.setDomain(tenants[0]);
    subscriptions = await client.subscriptions.list();
    console.log(`Now we should see the full list of subscriptions for the tenant ${tenants[0]}`, subscriptions);

    // You can skip all of the above, if you already know the tenant id, and do something like the following:
    // const tenantAuthentication = await msRestNodeAuth.interactiveLoginWithAuthResponse({ domain: "<your-tenant-id>" });
  } catch (err) {
    console.log(err);
  }
}

main();
