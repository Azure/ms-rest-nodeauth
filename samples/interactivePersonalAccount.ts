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
    // In this common domain, while organizations might have shared resources, personal accounts will show nothing.
    // In AAD v2, the "organizations" domain was added, to allow users to authenticate and view all of the available resources
    // regardless of the type of account they might have.
    // Since ms-rest-nodeauth only supports AAD v1, we have to change the domain after authenticating, as shown in this sample.
    //
    // Our new `@azure/identity` package provides support for AAD v2:
    // https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/identity/identity

    const initialAuthentication = await msRestNodeAuth.interactiveLoginWithAuthResponse();
    console.log(
      "Subscriptions retrieved by default",
      initialAuthentication.subscriptions
    );

    // To get the tenants for your account, you can use the buildTenantList method:
    const tenants = await msRestNodeAuth.buildTenantList(
      initialAuthentication.credentials
    );

    // If you have already authenticated and you want to retrieve the subscriptions of a specific tenant,
    // you can set the credential's domain to the tenant you want to use,
    // then retrieve your tenant's subscriptions with the SubscriptionsClient from @azure/arm-subscriptions:
    initialAuthentication.credentials.setDomain(tenants[0]);
    const client = new SubscriptionClient(initialAuthentication.credentials);
    const subscriptions = await client.subscriptions.list();
    console.log(`Subscriptions of tenant ${tenants[0]}`, subscriptions);

    // You can skip all of the above, if you already know the tenant id
    // const tenantAuthentication = await msRestNodeAuth.interactiveLoginWithAuthResponse({ domain: "<your-tenant-id>" });
  } catch (err) {
    console.log(err);
  }
}

main();
