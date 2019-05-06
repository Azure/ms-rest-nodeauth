import * as msRestNodeAuth from "../lib/msRestNodeAuth";
import * as dotenv from "dotenv";
dotenv.config();

const authFilepath = process.env.AUTH_FILE_CERT_PATH || "";
// copy the content of "sample.env" to a file named ".env". It should be stored at the root of the repo.
// then from the root of the cloned repo run, ts-node ./samples/authFileWithSpCert.ts
async function main(): Promise<void> {
  try {
    const authres = await msRestNodeAuth.loginWithAuthFileWithAuthResponse({
      filePath: authFilepath
    });
    console.log(authres);
  } catch (err) {
    console.log(err);
  }
}

main();
