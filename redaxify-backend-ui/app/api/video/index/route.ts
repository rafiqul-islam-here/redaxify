import { NextResponse } from "next/server";
import axios from 'axios';
import { getEnvVars } from "@/utils/env.utils";
import { Video } from "@/lib/types";
import api from "@/lib/api";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

interface VideoIndexRequest {
    video: Video;
    options: string[];
}

// Helper functions for Azure authentication
async function getAzureManagementToken(env: any) {
    if (MOCK_EXTERNAL_SERVICES) {
        return "mock-management-token";
    }

    console.log('Getting Azure Management Token...');
    const authParams = new URLSearchParams();
    authParams.append('grant_type', 'client_credentials');
    authParams.append('client_id', env.CLIENT_ID);
    authParams.append('client_secret', env.CLIENT_SECRET);
    authParams.append('resource', 'https://management.azure.com');

    try {
        const response = await axios.post(
            `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
            authParams,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        console.log('Management token obtained successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get Azure Management Token:', error);
        throw error;
    }
}

async function getVideoIndexerAccessToken(env: any, managementToken: string) {
    if (MOCK_EXTERNAL_SERVICES) {
        return "mock-vi-access-token";
    }

    console.log('Getting Video Indexer Access Token...');
    const url = `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`;

    console.log('VI Token URL:', url);

    try {
        const response = await axios.post(
            url,
            { permissionType: 'Contributor', scope: 'Account' },
            { headers: { 'Authorization': `Bearer ${managementToken}` } }
        );

        console.log('Video Indexer token obtained successfully');
        return response.data.accessToken;
    } catch (error) {
        console.error('Failed to get Video Indexer Access Token:', error);
        throw error;
    }
}

async function indexVideo(env: any, videoData: Video, options: string[], accessToken: string) {
    if (MOCK_EXTERNAL_SERVICES) {
        return { videoId: `mock-video-${Date.now()}` };
    }

    const indexingOptions = {
        videoUrl: videoData.videoLocation,
        name: videoData.videoName,
        privacy: 'Private',
        language: 'auto',
        indexingPreset: 'Default',
        streamingPreset: 'Default',
        linguisticModelId: undefined,
        personModelId: undefined,
        animationModelId: undefined,
        sendSuccessEmail: false,
        assetId: undefined,
        brandsCategories: undefined,
        customBrands: undefined,
        customLanguageModel: undefined,
        sourceLanguage: undefined,
        sourceLanguages: undefined
    };

    const apiUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos`;

    console.log('Video Indexer API URL:', apiUrl);
    console.log('Environment:', {
        API_ENDPOINT: env.API_ENDPOINT,
        LOCATION: env.LOCATION,
        VI_ACCOUNT_ID: env.VI_ACCOUNT_ID
    });
    console.log('Indexing Options:', indexingOptions);

    try {
        const response = await axios.post(
            apiUrl,
            indexingOptions,
            {
                params: { accessToken },
                headers: { 'Content-Type': 'application/json' }
            }
        );

        return { videoId: response.data.id };
    } catch (error) {
        console.error('Video Indexer API Error:', {
            url: apiUrl,
            error: axios.isAxiosError(error) ? {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            } : error
        });
        throw error;
    }
}

function formatVideoResponse(video: any) {
    return {
        id: video.id,
        videoName: video.videoName,
        videoLocation: video.videoLocation,
        indexingStatus: video.indexingStatus,
        indexedAt: video.indexedAt,
        publicViewLink: video.indexerVideoId
            ? `https://www.videoindexer.ai/accounts/${process.env.NEXT_PUBLIC_VI_ACCOUNT_ID}/videos/${video.indexerVideoId}?location=${process.env.NEXT_PUBLIC_LOCATION}`
            : null
    };
}

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

// POST - Video Indexing 
export async function POST(req: Request) {
    let videoData: Video | null = null;

    try {
        const { video, options } = (await req.json()) as VideoIndexRequest;
        videoData = video;

        if (!videoData.id || !videoData.videoLocation) {
            return NextResponse.json(
                { error: "ID and videoLocation are required" },
                { status: 400 }
            );
        }

        const env = getEnvVars();

        // Update DB status to PROCESSING via backend API
        await api.put(`/video/${videoData.id}`, {
            indexingStatus: 'PROCESSING',
            updatedAt: new Date().toISOString()
        });

        // Get Azure tokens
        const managementToken = await getAzureManagementToken(env);
        const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);

        try {
            // Attempt indexing
            const { videoId } = await indexVideo(env, videoData, options, viAccessToken);

            // On success - update database via backend API
            const updatedVideoResponse = await api.put(`/video/${videoData.id}`, {
                indexerVideoId: videoId,
                indexingStatus: 'SUCCESS',
                indexedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                data: {
                    ...formatVideoResponse(updatedVideoResponse.data),
                    databaseId: videoData.id,
                    indexerId: videoId
                },
                message: "Indexing started successfully"
            });

        } catch (indexError) {
            // Handle 409 Conflict (video already exists)
            if (axios.isAxiosError(indexError) && indexError.response?.status === 409) {
                const existingVideoId = indexError.response.data?.id;

                if (existingVideoId) {
                    // Update with existing video ID
                    const updatedVideoResponse = await api.put(`/video/${videoData.id}`, {
                        indexerVideoId: existingVideoId,
                        indexingStatus: 'SUCCESS',
                        indexedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                    return NextResponse.json({
                        success: true,
                        data: {
                            ...formatVideoResponse(updatedVideoResponse.data),
                            databaseId: videoData.id,
                            indexerId: existingVideoId
                        },
                        message: "Video was already indexed",
                        warning: "This video was previously processed"
                    });
                }

                // Fallback: Search for existing video by URL
                try {
                    const searchResponse = await axios.get(
                        `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos`,
                        {
                            params: {
                                accessToken: viAccessToken,
                                videoUrl: videoData.videoLocation
                            }
                        }
                    );

                    if (searchResponse.data?.results?.[0]?.id) {
                        const existingId = searchResponse.data.results[0].id;
                        const updatedVideoResponse = await api.put(`/video/${videoData.id}`, {
                            indexerVideoId: existingId,
                            indexingStatus: 'SUCCESS',
                            indexedAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });

                        return NextResponse.json({
                            success: true,
                            data: {
                                ...formatVideoResponse(updatedVideoResponse.data),
                                databaseId: videoData.id,
                                indexerId: existingId
                            },
                            message: "Found existing indexed video",
                            warning: "This video was previously processed"
                        });
                    }
                } catch (searchError) {
                    console.warn("[VIDEO_SEARCH_ERROR]", searchError);
                }
            }
            throw indexError;
        }

    } catch (error) {
        console.error("[INDEXING_ERROR]", error);

        // Update status to FAILED if we have video data
        if (videoData?.id) {
            await api.put(`/video/${videoData.id}`, {
                indexingStatus: 'FAILED',
                updatedAt: new Date().toISOString()
            }).catch(dbError => console.error("DB update failed:", dbError));
        }

        return handleApiError(error);
    }
}

// GET - Check Status
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const videoId = searchParams.get('videoId');
        const dbId = searchParams.get('dbId');

        if (!videoId && !dbId) {
            return NextResponse.json(
                { error: "Need videoId or dbId parameter" },
                { status: 400 }
            );
        }

        // Get video from database via backend API
        const videoResponse = await api.get(`/video/${dbId || videoId}`);
        const video = videoResponse.data;

        if (!video) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        // For demo: Return random progress if still processing
        if (video.indexingStatus === 'PROCESSING') {
            return NextResponse.json({
                success: true,
                data: {
                    ...formatVideoResponse(video),
                    azureStatus: 'Processing',
                    progress: Math.min(90, 20 + Math.random() * 70)
                }
            });
        }

        // Real Azure status check if available
        if (video.indexerVideoId && !MOCK_EXTERNAL_SERVICES) {
            const env = getEnvVars();

            try {
                const managementToken = await getAzureManagementToken(env);
                const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);

                const statusResponse = await axios.get(
                    `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${video.indexerVideoId}/Index`,
                    {
                        params: { accessToken: viAccessToken },
                        timeout: 10000
                    }
                );

                const azureStatus = statusResponse.data?.state || 'Unknown';

                return NextResponse.json({
                    success: true,
                    data: {
                        ...formatVideoResponse(video),
                        azureStatus,
                        progress: azureStatus === 'Processed' ? 100 : 85
                    }
                });

            } catch (azureError) {
                console.warn("[AZURE_STATUS_CHECK_ERROR]", azureError);
            }
        } else if (video.indexerVideoId) {
            return NextResponse.json({
                success: true,
                data: {
                    ...formatVideoResponse(video),
                    azureStatus: 'Processed',
                    progress: 100
                }
            });
        }

        // Fallback response
        return NextResponse.json({
            success: true,
            data: {
                ...formatVideoResponse(video),
                azureStatus: video.indexingStatus === 'SUCCESS' ? 'Processed' : 'Unknown',
                progress: video.indexingStatus === 'SUCCESS' ? 100 : 0
            }
        });

    } catch (error) {
        console.error("[STATUS_CHECK_ERROR]", error);
        return handleApiError(error);
    }
}
