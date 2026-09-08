import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from 'axios';
import { Video } from "@/lib/types";
import { getAzureAccessToken } from "@/lib/getAzureAccessToken";
import { indexVideo, getIndexingStatus } from "@/lib/azureIndexer";

interface AudioIndexRequest {
    video: Video;      // reuse same structure
    options: string[];
}

export async function POST(req: Request) {
    //console.log("Audio indexing route called");
    let videoData: Video | null = null;

    try {
        const { video, options } = (await req.json()) as AudioIndexRequest;
        videoData = video;
        //console.log("Received audio data:", video);
        //console.log("Received audio options:", options);

        if (!videoData.id || !videoData.videoLocation) {
            return NextResponse.json(
                { error: "ID and videoLocation are required" },
                { status: 400 }
            );
        }

        await prismadb.video.update({
            where: { id: videoData.id },
            data: {
                indexingStatus: 'PROCESSING',
                updatedAt: new Date().toISOString()
            }
        });

        const viAccessToken = await getAzureAccessToken();

        try {
            const { videoId } = await indexVideo(videoData, options, viAccessToken, "Videos");

            const updatedVideo = await prismadb.video.update({
                where: { id: videoData.id },
                data: {
                    indexerVideoId: videoId,
                    indexingStatus: 'SUCCESS',
                    indexedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });

            return NextResponse.json({
                success: true,
                data: {
                    ...formatVideoResponse(updatedVideo),
                    databaseId: videoData.id,
                    indexerId: videoId
                },
                message: "Audio indexing started successfully"
            });

        } catch (indexError) {
            if (axios.isAxiosError(indexError) && indexError.response?.status === 409) {
                const existingAudioId = indexError.response.data?.id;

                if (existingAudioId) {
                    const updatedVideo = await prismadb.video.update({
                        where: { id: videoData.id },
                        data: {
                            indexerVideoId: existingAudioId,
                            indexingStatus: 'SUCCESS',
                            indexedAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    });

                    return NextResponse.json({
                        success: true,
                        data: {
                            ...formatVideoResponse(updatedVideo),
                            databaseId: videoData.id,
                            indexerId: existingAudioId
                        },
                        message: "Audio was already indexed",
                        warning: "This audio was previously processed"
                    });
                }

                // Fallback: Search by URL
                try {
                    const searchResponse = await axios.get(
                        `${process.env.API_ENDPOINT}/${process.env.LOCATION}/Accounts/${process.env.VI_ACCOUNT_ID}/Audios`,
                        {
                            params: {
                                accessToken: viAccessToken,
                                videoUrl: videoData.videoLocation
                            }
                        }
                    );

                    if (searchResponse.data?.results?.[0]?.id) {
                        const existingId = searchResponse.data.results[0].id;
                        const updatedVideo = await prismadb.video.update({
                            where: { id: videoData.id },
                            data: {
                                indexerVideoId: existingId,
                                indexingStatus: 'SUCCESS',
                                indexedAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        });

                        return NextResponse.json({
                            success: true,
                            data: {
                                ...formatVideoResponse(updatedVideo),
                                databaseId: videoData.id,
                                indexerId: existingId
                            },
                            message: "Found existing indexed audio",
                            warning: "This audio was previously processed"
                        });
                    }
                } catch (searchError) {
                    console.warn("[AUDIO_SEARCH_ERROR]", searchError);
                }
            }
            throw indexError;
        }

    } catch (error) {
        console.error("[AUDIO_INDEXING_ERROR]", error);

        if (videoData?.id) {
            await prismadb.video.update({
                where: { id: videoData.id },
                data: {
                    indexingStatus: 'FAILED',
                    updatedAt: new Date().toISOString()
                }
            }).catch(dbError => console.error("DB update failed:", dbError));
        }

        return handleApiError(error);
    }
}

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

        const video = await prismadb.video.findFirst({
            where: {
                OR: [
                    { indexerVideoId: videoId || undefined },
                    { id: dbId ? Number(dbId) : undefined }
                ]
            }
        });

        if (!video) {
            return NextResponse.json({ error: "Audio not found" }, { status: 404 });
        }

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

        const viAccessToken = await getAzureAccessToken();
        const status = await getIndexingStatus(
            video.indexerVideoId!,
            viAccessToken,
            "Videos"
        );

        if (["Processed", "Failed"].includes(status.state)) {
            await prismadb.video.update({
                where: { id: video.id },
                data: {
                    indexingStatus: status.state === 'Processed' ? 'SUCCESS' : 'FAILED',
                    indexedAt: status.state === 'Processed' ? new Date().toISOString() : null,
                    updatedAt: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                ...formatVideoResponse(video),
                azureStatus: status.state,
                progress: status.state === 'Processed' ? 100 : 0
            }
        });

    } catch (error) {
        console.error("[AUDIO_STATUS_CHECK_ERROR]", error);
        return handleApiError(error);
    }
}

function formatVideoResponse(video: any): Video {
    return {
        id: video.id,
        azureVideoId: video.azureVideoId || '',
        indexerVideoId: video.indexerVideoId || null,
        videoName: video.videoName,
        videoSize: Number(video.videoSize) || 0,
        videoDuration: Number(video.videoDuration) || 0,
        videoLocation: video.videoLocation,
        imageLocation: video.imageLocation || null,
        indexingStatus: video.indexingStatus as Video['indexingStatus'],
        indexedAt: video.indexedAt ? new Date(video.indexedAt).toISOString() : null,
        createdAt: new Date(video.createdAt).toISOString(),
        updatedAt: new Date(video.updatedAt).toISOString(),
        customerNumber: Number(video.customerNumber) || 0,
        folderId: video.folderId ? Number(video.folderId) : null
    };
}

function handleApiError(error: unknown): NextResponse {
    if (error instanceof AxiosError) {
        return NextResponse.json(
            {
                success: false,
                error: "API request failed",
                details: error.response?.data || error.message,
                code: error.code
            },
            { status: error.response?.status || 500 }
        );
    }

    return NextResponse.json(
        {
            success: false,
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
    );
}
