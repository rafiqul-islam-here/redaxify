export function getEnvVars() {
    const env = {
        TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID!,
        CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID!,
        CLIENT_SECRET: process.env.NEXT_PUBLIC_CLIENT_SECRET!,
        API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT!,
        LOCATION: process.env.NEXT_PUBLIC_LOCATION!,
        VI_ACCOUNT_ID: process.env.NEXT_PUBLIC_VI_ACCOUNT_ID!,
        SUBSCRIPTION_ID: process.env.NEXT_PUBLIC_SUBSCRIPTION_ID!,
        RESOURCE_GROUP: process.env.NEXT_PUBLIC_RESOURCE_GROUP!,
        VI_ACCOUNT_NAME: process.env.NEXT_PUBLIC_VI_ACCOUNT_NAME!,
        AZURE_STORAGE_CONNECTION_STRING: process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING!,
        AZURE_CONTAINER_NAME: process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME || 'videos'
    };

    // Debug logging to check if environment variables are loaded
    console.log('Environment Variables:', {
        TENANT_ID: env.TENANT_ID ? '✓' : '✗',
        CLIENT_ID: env.CLIENT_ID ? '✓' : '✗',
        CLIENT_SECRET: env.CLIENT_SECRET ? '✓' : '✗',
        API_ENDPOINT: env.API_ENDPOINT,
        LOCATION: env.LOCATION,
        VI_ACCOUNT_ID: env.VI_ACCOUNT_ID,
        SUBSCRIPTION_ID: env.SUBSCRIPTION_ID ? '✓' : '✗',
        RESOURCE_GROUP: env.RESOURCE_GROUP,
        VI_ACCOUNT_NAME: env.VI_ACCOUNT_NAME
    });

    return env;
}
