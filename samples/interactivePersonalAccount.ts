/**
 * When using personal accounts, the `domain` property in the options passed to the authentication methods is mandatory and should be set to the tenant Id. If this property is not set, the credentials created by the authentication methods will not be able to access any of the resources of the personal account. For that same reason, the list of subscriptions expected in the return value of these methods will be empty.
 *
 * You can get the tenant Id from Azure portal or the Azure CLI. If you need to fetch the tenant Id programmatically, you can use the helper method `buildTenantList(credential)`.
 *
 * This sample shows how the authentication fails for personal accounts when `domain` is not set, and how to overcome this issue.
 *
 * For more context: https://github.com/Azure/ms-rest-nodeauth/issues/89#issuecomment-643471343
 */
import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import { SubscriptionClient } from "@azure/arm-subscriptions";

async function main(): Promise<void> {
  const authResponse = await msRestNodeAuth.interactiveLoginWithAuthResponse();

  // For personal accounts, the line below will print an empty array as we did not set the domain.
  console.log("Subscriptions retrieved by default", authResponse.subscriptions);

  const client = new SubscriptionClient(authResponse.credentials);

  // Note: Replace `<my-subscription>` below with the Id of one of your subscriptions.
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
  const tenants = await msRestNodeAuth.buildTenantList(authResponse.credentials);

  // Update the domain used by the credentials so that it can generate tokens against a specific tenant.
  authResponse.credentials.setDomain(tenants[0]);

  // Once the domain is properly set, further requests will work as expected:
  const subscription = await client.subscriptions.get(subscriptionId);
  console.log(
    "After specifying the tenant, we're able to retrieve the full information of our subscriptions:",
    subscription
  );
}

main();
