import axios from "axios";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

/**
 * Gets Azure Management Token using environment variables.
 */
export async function getAzureManagementToken(): Promise<string> {
    if (MOCK_EXTERNAL_SERVICES) {
        return "mock-management-token";
    }

    const clientId = process.env.CLIENT_ID!;
    const clientSecret = process.env.CLIENT_SECRET!;
    const tenantId = process.env.TENANT_ID!;

    if (!clientId || !clientSecret || !tenantId) {
        throw new Error("Azure credentials are missing in environment variables.");
    }

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("scope", "https://management.azure.com/.default");

    const { data } = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        params,
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000,
        }
    );

    return data.access_token;
}
