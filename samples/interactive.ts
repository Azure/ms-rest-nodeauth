import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import * as dotenv from "dotenv";
dotenv.config();
// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/interactive.ts
async function main(): Promise<void> {
  try {
    const authres = await msRestNodeAuth.interactiveLogin();
    console.log(authres);
  } catch (err) {
    console.log(err);
  }
}

main();
