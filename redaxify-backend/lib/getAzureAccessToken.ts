import axios from "axios";
import { getAzureManagementToken } from "./azureManagementToken";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAzureAccessToken(): Promise<string> {
    if (MOCK_EXTERNAL_SERVICES) {
        return "mock-vi-access-token";
    }

    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    const subscriptionId = process.env.SUBSCRIPTION_ID!;
    const resourceGroup = process.env.RESOURCE_GROUP;
    const viAccountName = process.env.VI_ACCOUNT_NAME;

    if (!resourceGroup || !viAccountName || !subscriptionId) {
        throw new Error("Azure Video Indexer config missing in environment variables.");
    }

    const managementToken = await getAzureManagementToken();

    const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.VideoIndexer/accounts/${viAccountName}/generateAccessToken?api-version=2022-08-01`;

    const { data } = await axios.post(
        url,
        { permissionType: 'Contributor', scope: 'Account' },
        {
            headers: {
                Authorization: `Bearer ${managementToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );

    cachedToken = {
        token: data.accessToken,
        expiresAt: Date.now() + (data.expiresInSeconds - 60) * 1000
    };

    return data.accessToken;
}
