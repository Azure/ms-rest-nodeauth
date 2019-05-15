import { AzureCliCredentials } from "../lib/msRestNodeAuth";
import { ServiceClient, RequestPrepareOptions } from "@azure/ms-rest-js";

async function main(): Promise<void> {
  try {
    // Please make sure you have logged in via Azure CLI `az login` before executing this script.
    const creds = await AzureCliCredentials.create();
    const client = new ServiceClient(creds);
    console.log(">>> Subscription associated with the access token: '%s'.",
      creds.tokenInfo.subscription);
    const request: RequestPrepareOptions = {
      url: getUrl(creds.subscriptionInfo.id),
      method: "GET"
    };
    console.log(">>> Request url: '%s'.", request.url);
    const res = await client.sendRequest(request);
    console.log("List of resource groups from subscriptionId '%s': \n%O",
      creds.subscriptionInfo.id, res.parsedBody);

    // Let us change the subscriptionId, which should trigger refreshing the access token.
    const subscriptions = await AzureCliCredentials.listAllSubscriptions();
    creds.subscriptionInfo = subscriptions[1];
    console.log(">>> The new subscription id associated with the credential object is: '%s'.",
      creds.subscriptionInfo.id);
    request.url = getUrl(creds.subscriptionInfo.id);
    console.log(">>> Request url: '%s'.", request.url);
    const res2 = await client.sendRequest(request);
    console.log("List of resource groups from subscriptionId '%s': \n%O",
      creds.subscriptionInfo.id, res2.parsedBody);
    console.log(">>> Subscription associated with the access token: '%s'.",
      creds.tokenInfo.subscription);
  } catch (err) {
    console.log(err);
  }
}

function getUrl(subscriptionId: string): string {
  return `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2018-05-01`;
}

main();