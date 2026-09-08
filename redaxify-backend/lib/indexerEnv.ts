import { EnvVariables } from "./types";

export function getEnvVars(): EnvVariables {
    const env = {
        TENANT_ID: process.env.TENANT_ID,
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET,
        API_ENDPOINT: process.env.API_ENDPOINT,
        LOCATION: process.env.LOCATION,
        VI_ACCOUNT_ID: process.env.VI_ACCOUNT_ID,
        SUBSCRIPTION_ID: process.env.SUBSCRIPTION_ID,
        RESOURCE_GROUP: process.env.RESOURCE_GROUP,
        VI_ACCOUNT_NAME: process.env.VI_ACCOUNT_NAME
    };

    const missingVars = Object.entries(env)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        throw new Error(`Missing ENV variables: ${missingVars.join(', ')}`);
    }

    return env as EnvVariables;
}