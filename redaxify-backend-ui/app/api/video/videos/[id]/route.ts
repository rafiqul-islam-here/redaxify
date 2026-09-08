import { NextRequest, NextResponse } from "next/server";
import { getEnvVars } from "@/utils/env.utils";
import axios from "axios";
import api from "@/lib/api";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

function handleApiError(error: unknown) {
    if (axios.isAxiosError(error)) {
        return NextResponse.json(
            {
                success: false,
                error: "API request failed",
                details: error.response?.data || error.message,
                code: error.code,
            },
            { status: error.response?.status || 500 }
        );
    }

    return NextResponse.json(
        {
            success: false,
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
    );
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const customerNumber = searchParams.get("customerNumber");

        if (!customerNumber) {
            return NextResponse.json(
                { error: "Customer number is required" },
                { status: 400 }
            );
        }

        const { id: videoId } = await context.params;

        // Get video details from the database via backend API
        const videoResponse = await api.get(`/video/${videoId}`);
        const dbVideo = videoResponse.data;

        if (!dbVideo || !dbVideo.indexerVideoId) {
            return NextResponse.json(
                { error: "Video not found or not indexed" },
                { status: 404 }
            );
        }

        // Check ownership of the video
        if (dbVideo.customerNumber !== Number(customerNumber)) {
            return NextResponse.json(
                { error: "Video does not belong to the requested customer" },
                { status: 403 }
            );
        }

        const env = getEnvVars();

        let viAccessToken = "mock-vi-access-token";

        if (!MOCK_EXTERNAL_SERVICES) {
            // Get Azure management token
            const authParams = new URLSearchParams();
            authParams.append('grant_type', 'client_credentials');
            authParams.append('client_id', env.CLIENT_ID);
            authParams.append('client_secret', env.CLIENT_SECRET);
            authParams.append('resource', 'https://management.azure.com');

            const tokenResponse = await axios.post(
                `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
                authParams,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            const managementToken = tokenResponse.data.access_token;

            // Get Video Indexer Access Token
            const viTokenResponse = await axios.post(
                `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`,
                { permissionType: 'Contributor', scope: 'Account' },
                { headers: { 'Authorization': `Bearer ${managementToken}` } }
            );
            viAccessToken = viTokenResponse.data.accessToken;
        }

        // Generate URLs with access token
        const playerUrl = `https://www.videoindexer.ai/embed/player/${env.VI_ACCOUNT_ID}/${dbVideo.indexerVideoId}/?accessToken=${viAccessToken}&locale=en&location=${env.LOCATION}`;
        const insightsUrl = `https://www.videoindexer.ai/embed/insights/${env.VI_ACCOUNT_ID}/${dbVideo.indexerVideoId}/?accessToken=${viAccessToken}&locale=en&location=${env.LOCATION}`;
        const editorUrl = `https://www.videoindexer.ai/embed/editor/${env.VI_ACCOUNT_ID}/${dbVideo.indexerVideoId}/?accessToken=${viAccessToken}&locale=en&location=${env.LOCATION}`;

        // Return results
        return NextResponse.json({
            success: true,
            data: {
                id: dbVideo.id,
                title: dbVideo.videoName,
                size: dbVideo.videoSize,
                duration: dbVideo.videoDuration,
                createdAt: dbVideo.createdAt,
                playerUrl,
                insightsUrl,
                editorUrl
            },
        });
    } catch (error) {
        console.error("[VIDEO_DETAILS_ERROR]", error);
        return handleApiError(error);
    }
}
