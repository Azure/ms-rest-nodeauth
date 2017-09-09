import { TokenCredentialsBase } from "../credentials/tokenCredentialsBase";
/**
 * @interface UserType Provides information about user type. It can currently be "user" or "servicePrincipal".
 */
export declare type UserType = "user" | "servicePrincipal";
/**
 * @interface User Provides information about a user from the authentication perspective.
 */
export interface User {
    /**
     * @property {string} name - The user name. For ApplicationTokenCredentials it can be the clientId or SPN.
     */
    name: string;
    /**
     * @property {string} type - The user type. "user" | "servicePrincipal".
     */
    type: UserType;
}
/**
 * @interface SubscriptionInfo Provides information about subscription that was found
 * during the authentication process. The structure of this type is different from the
 * subscription object that one gets by making a request to the ResourceManager API.
 */
export interface SubscriptionInfo {
    /**
     * @property {string}
     */
    readonly tenantId: string;
    /**
     * @property {string}
     */
    readonly user: User;
    /**
     * @property {string} environmentName - The environment name in which the subscription exists.
     * Possible values: "Azure", "AzureChina", "AzureUSGovernment", "AzureGermanCloud" or
     * some other custom/internal environment name like "Dogfood".
     */
    readonly environmentName: string;
    /**
     * @property {string} name - The display name of the subscription.
     */
    readonly name: string;
    /**
     * @property {string} id - The subscription id, usually a guid.
     */
    readonly id: string;
    /**
     * @property {any} any Placeholder for unknown properties
     */
    readonly [x: string]: any;
}
/**
 * Builds an array of tenantIds.
 * @param {TokenCredentialsBase} credentials
 * @param {string} apiVersion default value 2016-06-01
 * @returns {Promise<string[]>} resolves to an array of tenantIds and rejects with an error.
 */
export declare function buildTenantList(credentials: TokenCredentialsBase, apiVersion?: string): Promise<string[]>;
export declare function getSubscriptionsFromTenants(credentials: TokenCredentialsBase, tenantList: string[], apiVersion?: string): Promise<SubscriptionInfo[]>;
