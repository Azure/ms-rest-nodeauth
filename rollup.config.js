import sourcemaps from "rollup-plugin-sourcemaps";

const banner = `/** @license ms-rest-azure-env
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */`;

/**
 * @type {import('rollup').RollupFileOptions}
 */
export default {
  input: './dist/lib/msRestNodeAuth.js',
  external: [
    "adal-node"
  ],
  output: {
    file: "./dist/msRestNodeAuth.js",
    format: "cjs",
    sourcemap: true,
    banner
  },
  plugins: [
    sourcemaps()
  ]
};