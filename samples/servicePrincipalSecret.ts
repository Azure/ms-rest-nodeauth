import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import * as dotenv from "dotenv";
dotenv.config();

const clientId = process.env.CLIENT_ID || "";
const tenantId = process.env.DOMAIN || "";
const secret = process.env.APPLICATION_SECRET || "";
// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/servicePrincipalSecret.ts
async function main(): Promise<void> {
  try {
    const authres = await msRestNodeAuth.loginWithServicePrincipalSecretWithAuthResponse(
      clientId,
      secret,
      tenantId
    );
    console.log(authres);
  } catch (err) {
    console.log(err);
  }
}

main();
