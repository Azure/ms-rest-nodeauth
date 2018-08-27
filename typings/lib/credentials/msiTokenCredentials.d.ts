import * as msRest from "ms-rest-js";
import { MSIOptions } from "../login";
/**
 * @interface MSITokenResponse - Describes the MSITokenResponse.
 */
export interface MSITokenResponse {
    /**
     * @property {string} token_type - The token type.
     */
    readonly token_type: string;
    /**
     * @property {string} access_token - The access token.
     */
    readonly access_token: string;
    /**
     * @property {any} any - Placeholder for unknown properties.
     */
    readonly [x: string]: any;
}
/**
 * @class MSITokenCredentials - Provides information about managed service identity token credentials.
 * This object can only be used to acquire token on a virtual machine provisioned in Azure with managed service identity.
 */
export declare class MSITokenCredentials {
    /**
     * @property {LoginWithMSIOptions} options - Optional parameters
     */
    options: MSIOptions;
    private static readonly defaultPort;
    private static readonly defaultResource;
    port: number;
    resource: string;
    constructor(
    /**
     * @property {LoginWithMSIOptions} options - Optional parameters
     */
    options: MSIOptions);
    /**
     * Prepares and sends a POST request to a service endpoint hosted on the Azure VM, which responds with the access token.
     * @param  {function} callback  The callback in the form (err, result)
     * @return {function} callback
     *                       {Error} [err]  The error if any
     *                       {object} [tokenResponse] The tokenResponse (token_type and access_token are the two important properties).
     */
    getToken(): Promise<MSITokenResponse>;
    private prepareRequestOptions;
    /**
     * Signs a request with the Authentication header.
     *
     * @param {webResource} The WebResource to be signed.
     * @param {function(error)}  callback  The callback function.
     * @return {undefined}
     */
    signRequest(webResource: msRest.WebResource): Promise<msRest.WebResource>;
}
