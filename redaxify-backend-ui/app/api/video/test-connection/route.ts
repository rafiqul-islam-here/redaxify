import { NextResponse } from "next/server";
import axios from "axios";
import { getEnvVars } from "@/utils/env.utils";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

// Helper functions for Azure authentication
async function getAzureManagementToken(env: any) {
    const authParams = new URLSearchParams();
    authParams.append('grant_type', 'client_credentials');
    authParams.append('client_id', env.CLIENT_ID);
    authParams.append('client_secret', env.CLIENT_SECRET);
    authParams.append('resource', 'https://management.azure.com');

    const response = await axios.post(
        `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
        authParams,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return response.data.access_token;
}

async function getVideoIndexerAccessToken(env: any, managementToken: string) {
    const response = await axios.post(
        `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`,
        { permissionType: 'Contributor', scope: 'Account' },
        { headers: { 'Authorization': `Bearer ${managementToken}` } }
    );

    return response.data.accessToken;
}

export async function GET() {
    try {
        const env = getEnvVars();

        if (MOCK_EXTERNAL_SERVICES) {
            return NextResponse.json({
                success: true,
                message: 'Mock mode: skipped real Azure Video Indexer connectivity test',
                results: [],
                environment: {
                    API_ENDPOINT: env.API_ENDPOINT,
                    LOCATION: env.LOCATION,
                    VI_ACCOUNT_ID: env.VI_ACCOUNT_ID,
                    VI_ACCOUNT_NAME: env.VI_ACCOUNT_NAME
                }
            });
        }

        console.log('Testing Azure Video Indexer connectivity...');

        // Get tokens
        const managementToken = await getAzureManagementToken(env);
        console.log('✓ Management token obtained');

        const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);
        console.log('✓ Video Indexer token obtained');

        // Test different API endpoints to find the correct one
        const endpoints = [
            `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}`,
            `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos`,
            `https://api.videoindexer.ai/trial/Accounts/${env.VI_ACCOUNT_ID}`,
            `https://api.videoindexer.ai/trial/Accounts/${env.VI_ACCOUNT_ID}/Videos`
        ];

        const results = [];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    params: { accessToken: viAccessToken },
                    timeout: 10000
                });

                results.push({
                    endpoint,
                    status: 'SUCCESS',
                    statusCode: response.status,
                    data: response.data
                });

                console.log(`✓ ${endpoint} - SUCCESS`);

            } catch (error: any) {
                results.push({
                    endpoint,
                    status: 'ERROR',
                    statusCode: error.response?.status,
                    error: error.response?.data || error.message
                });

                console.log(`✗ ${endpoint} - ERROR:`, error.response?.status, error.response?.data);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Azure Video Indexer connectivity test completed',
            results,
            environment: {
                API_ENDPOINT: env.API_ENDPOINT,
                LOCATION: env.LOCATION,
                VI_ACCOUNT_ID: env.VI_ACCOUNT_ID,
                VI_ACCOUNT_NAME: env.VI_ACCOUNT_NAME
            }
        });

    } catch (error: any) {
        console.error('Test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.response?.data
        }, { status: 500 });
    }
}
