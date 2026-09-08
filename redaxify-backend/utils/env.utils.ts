export function getEnvVars() {
    const env = {
      TENANT_ID: process.env.TENANT_ID!,
      CLIENT_ID: process.env.CLIENT_ID!,
      CLIENT_SECRET: process.env.CLIENT_SECRET!,
      API_ENDPOINT: process.env.API_ENDPOINT!,
      LOCATION: process.env.LOCATION!,
      VI_ACCOUNT_ID: process.env.VI_ACCOUNT_ID!,
      SUBSCRIPTION_ID: process.env.SUBSCRIPTION_ID!,
      RESOURCE_GROUP: process.env.RESOURCE_GROUP!,
      VI_ACCOUNT_NAME: process.env.VI_ACCOUNT_NAME!,
      AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING!,
      AZURE_CONTAINER_NAME: process.env.AZURE_CONTAINER_NAME || 'videos'
    };
  
    return env;
  }