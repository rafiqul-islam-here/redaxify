import { NextRequest, NextResponse } from "next/server";
import { getEnvVars } from "@/utils/env.utils";
import axios from "axios";
import { generateSummaryFromDialogue } from "@/lib/azure-openai";
import api from "@/lib/api";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerNumber = searchParams.get("customerNumber");
        const videoId = searchParams.get("id");

        if (!customerNumber) {
            return NextResponse.json(
                { error: "Customer number is required" },
                { status: 400 }
            );
        }

        if (!videoId) {
            return NextResponse.json(
                { error: "Video ID is required" },
                { status: 400 }
            );
        }

        // Get video from database via backend API
        const videoResponse = await api.get(`/video/${videoId}`);
        const dbVideo = videoResponse.data;

        if (!dbVideo || !dbVideo.indexerVideoId) {
            return NextResponse.json(
                { error: "Video not found or not indexed" },
                { status: 404 }
            );
        }

        if (dbVideo.customerNumber !== Number(customerNumber)) {
            return NextResponse.json(
                { error: "Video does not belong to the requested customer" },
                { status: 403 }
            );
        }

        if (MOCK_EXTERNAL_SERVICES) {
            const transcript = "Speaker #1: This is a mock transcript generated in offline mode (MOCK_EXTERNAL_SERVICES=true).";
            return NextResponse.json({
                transcript,
                summary: await generateSummaryFromDialogue(transcript)
            });
        }

        const env = getEnvVars();

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

        // Get Video Indexer access token
        const viTokenResponse = await axios.post(
            `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`,
            { permissionType: 'Contributor', scope: 'Account' },
            { headers: { 'Authorization': `Bearer ${managementToken}` } }
        );
        const viAccessToken = viTokenResponse.data.accessToken;

        // Get transcript from Video Indexer
        const transcriptResponse = await axios.get(
            `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${dbVideo.indexerVideoId}/Index`,
            {
                params: { accessToken: viAccessToken },
                timeout: 15000
            }
        );

        const insights = transcriptResponse.data.videos[0].insights;
        const transcriptItems = insights.transcript;
        const speakers = insights.speakers;

        const speakerMap = new Map<number, string>();
        speakers.forEach((speaker: { id: number; name: string }) => {
            speakerMap.set(speaker.id, speaker.name);
        });

        const dialogueParagraph = transcriptItems
            .map((item: { id: number; text: string; speakerId: number }) => {
                const speakerName = speakerMap.get(item.speakerId) || `Speaker #${item.speakerId}`;
                return `${speakerName}: ${item.text}`;
            })
            .join('\n');

        // Generate summary using Azure OpenAI
        const summary = await generateSummaryFromDialogue(dialogueParagraph);

        return NextResponse.json({
            transcript: dialogueParagraph,
            summary
        });

    } catch (error) {
        console.error("[SUMMARY_ERROR]", error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to fetch transcript",
                    details: error.response?.data || error.message,
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
}
