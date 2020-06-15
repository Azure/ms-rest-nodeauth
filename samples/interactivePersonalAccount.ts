/**
 * When using personal accounts with all of the authentication methods that accept a `domain` property in the optional parameters, if the `domain` is not specified, the credentials will end up not being able to access any of the resources of the personal account. For that same reason, the list of subscriptions expected in the return value of these methods will be empty.
 *
 * The workaround is to pass a known tenant Id to the `domain` property in the optional parameters when using these authentication methods. You can get the tenant Id from Azure portal or the Azure CLI.
 *
 * If you need to fetch the tenant Id programmatically:
 *
 * - Use any of the authentication methods without setting the domain to get a credential.
 * - Call the `buildTenantLists(credential)` method by sending that same credential as the first parameter to get the list of all tenants in your account.
 *
 * If you want to avoid having to create a new credential, once you have access to one of the account's tenants, you can set it as the `domain` of your credentials by using the method `setDomain(tenant)` from the existing credentials object.
 *
 * This sample shows when the authentication fails for personal accounts, and how to overcome this issue.
 *
 * For context: https://github.com/Azure/ms-rest-nodeauth/issues/89#issuecomment-643471343
 */
import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import * as dotenv from "dotenv";
dotenv.config();

// Copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/interactive.ts

async function main(): Promise<void> {
  const authentication = await msRestNodeAuth.interactiveLoginWithAuthResponse();

  // For personal accounts, the below will print an empty array as we did not set the domain.
  console.log(
    "Subscriptions retrieved by default",
    authentication.subscriptions
  );

  const client = new SubscriptionClient(authentication.credentials);

  // Note: Replace `<my-subscription>` below with the Id of one of your subscriptions
  const subscriptionId = "<my-subscription>";

  // The below request to get the subscription details will fail for personal accounts until we update the domain on the credential.
  try {
    await client.subscriptions.get(subscriptionId);
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

  // Once the domain is properly set, further requests will work as expected:
  const subscription = await client.subscriptions.get(subscriptionId);
  console.log("After specifying the tenant, we're able to retrieve the full information of our subscriptions:", subscription);

  // You can skip all of the above if you already know the tenant Id, and do something like the following:
  const tenantAuthentication = await msRestNodeAuth.interactiveLoginWithAuthResponse({ domain: "<your-tenant-id>" });
  console.log(
    "Subscriptions retrieved after authenticating with a specific domain",
    tenantAuthentication.subscriptions
  );
}

main();
