import { WebResource } from "ms-rest-js";
import { TokenAudience } from "../util/authConstants";
export interface TokenResponse {
    readonly tokenType: string;
    readonly accessToken: string;
    readonly [x: string]: any;
}
export declare abstract class TokenCredentialsBase {
    readonly clientId: string;
    domain: string;
    readonly tokenAudience: TokenAudience | undefined;
    readonly environment: {
        name: string;
        portalUrl: string;
        publishingProfileUrl: string;
        managementEndpointUrl: string;
        resourceManagerEndpointUrl: string;
        sqlManagementEndpointUrl: string;
        sqlServerHostnameSuffix: string;
        galleryEndpointUrl: string;
        activeDirectoryEndpointUrl: string;
        activeDirectoryResourceId: string;
        activeDirectoryGraphResourceId: string;
        activeDirectoryGraphApiVersion: string;
        storageEndpointSuffix: string;
        keyVaultDnsSuffix: string;
        azureDataLakeStoreFileSystemEndpointSuffix: string;
        azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: string;
        validateAuthority: boolean;
    };
    tokenCache: any;
    protected readonly isGraphContext: boolean;
    protected readonly authContext: any;
    constructor(clientId: string, domain: string, tokenAudience?: TokenAudience | undefined, environment?: {
        name: string;
        portalUrl: string;
        publishingProfileUrl: string;
        managementEndpointUrl: string;
        resourceManagerEndpointUrl: string;
        sqlManagementEndpointUrl: string;
        sqlServerHostnameSuffix: string;
        galleryEndpointUrl: string;
        activeDirectoryEndpointUrl: string;
        activeDirectoryResourceId: string;
        activeDirectoryGraphResourceId: string;
        activeDirectoryGraphApiVersion: string;
        storageEndpointSuffix: string;
        keyVaultDnsSuffix: string;
        azureDataLakeStoreFileSystemEndpointSuffix: string;
        azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: string;
        validateAuthority: boolean;
    }, tokenCache?: any);
    protected getActiveDirectoryResourceId(): string;
    protected getTokenFromCache(userName?: string): Promise<TokenResponse>;
    /**
     * Tries to get the token from cache initially. If that is unsuccessful then it tries to get the token from ADAL.
     * @returns {Promise<TokenResponse>}
     * {object} [tokenResponse] The tokenResponse (tokenType and accessToken are the two important properties).
     * @memberof TokenCredentialsBase
     */
    abstract getToken(): Promise<TokenResponse>;
    /**
     * Signs a request with the Authentication header.
     *
     * @param {webResource} The WebResource to be signed.
     * @param {function(error)}  callback  The callback function.
     * @return {undefined}
     */
    signRequest(webResource: WebResource): Promise<WebResource>;
}
