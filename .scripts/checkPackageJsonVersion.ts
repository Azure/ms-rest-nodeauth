import { checkPackageJsonVersion } from "@ts-common/azure-js-dev-tools";

process.exitCode = checkPackageJsonVersion({ startPath: __dirname }).check() as number;