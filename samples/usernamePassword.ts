import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import * as dotenv from "dotenv";
dotenv.config();

const username = process.env.AZURE_USERNAME || "";
const password = process.env.AZURE_PASSWORD || "";
// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/usernamePassword.ts
async function main(): Promise<void> {
  try {
    const authres = await msRestNodeAuth.loginWithUsernamePasswordWithAuthResponse(
      username,
      password
    );
    console.log(authres);
  } catch (err) {
    console.log(err);
  }
}

main();
