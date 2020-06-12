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
  // For context of why this sample was made and how the service works,
  // you can go to: https://github.com/Azure/ms-rest-nodeauth/issues/89#issuecomment-643471343

  const authentication = await msRestNodeAuth.interactiveLoginWithAuthResponse();

  // For personal accounts, the below will print an empty array as we did not set the domain.
  console.log(
    "Subscriptions retrieved by default",
    authentication.subscriptions
  );

  const client = new SubscriptionClient(authentication.credentials);

  // For personal accounts, this will return an empty array:
  let subscriptions = await client.subscriptions.list();
  console.log(`These subscriptions will be empty for personal accounts`, subscriptions);

  let knownSubscription = subscriptions.length ? subscriptions[0].subscriptionId! : "<my-subscription>";

  try {
    await client.subscriptions.get(knownSubscription);
  } catch (e) {
    console.log(`
Expected error:
For personal accounts, we won't be able to retrieve subscriptions unless we specify a domain in the credentials.
${e}
`);
  }

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

  knownSubscription = subscriptions.length ? subscriptions[0].subscriptionId! : "<my-subscription>";
  const subscription = await client.subscriptions.get(knownSubscription);
  console.log("After specifying the tenant, we're now able to retrieve our known subscription:", subscription);
}

main();
