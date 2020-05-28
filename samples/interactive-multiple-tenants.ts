import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import * as dotenv from "dotenv";
dotenv.config();

// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/interactive.ts
async function main(): Promise<void> {
  try {
    // Personal accounts will find no subscriptions on the initial authentication request.
    // This is because the credentials are generated without specifying a tenant.
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
