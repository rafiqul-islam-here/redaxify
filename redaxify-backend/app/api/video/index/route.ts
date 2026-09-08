import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from 'axios';
import { getEnvVars } from "@/utils/env.utils";
import { Video } from "@/lib/types";
import { getAzureAccessToken } from "@/lib/getAzureAccessToken";
import { indexVideo, getIndexingStatus } from "@/lib/azureIndexer";

interface VideoIndexRequest {
  video: Video;
  options: string[];
}

// POST - Video Indexing 
export async function POST(req: Request) {
  console.log("Video indexing route called");
  let videoData: Video | null = null;

  try {
    const { video, options } = (await req.json()) as VideoIndexRequest;
    videoData = video;
    //console.log("Received video data:", video);
    //console.log("Received video options:", options);
    if (!videoData.id || !videoData.videoLocation) {
      return NextResponse.json(
        { error: "ID and videoLocation are required" },
        { status: 400 }
      );
    }

    const env = getEnvVars();

    // updates DB status to PROCESSING
    await prismadb.video.update({
      where: { id: videoData.id },
      data: {
        indexingStatus: 'PROCESSING',
        updatedAt: new Date().toISOString()
      }
    });

    const viAccessToken = await getAzureAccessToken();

    try {
      // Attempt indexing
      const { videoId } = await indexVideo(videoData, options, viAccessToken, "Videos");

      // On success - update database
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
        message: "Indexing started successfully"
      });

    } catch (indexError) {
      // Handle 409 Conflict (video already exists)
      if (axios.isAxiosError(indexError) && indexError.response?.status === 409) {
        const existingVideoId = indexError.response.data?.id;

        if (existingVideoId) {
          // Update with existing video ID
          const updatedVideo = await prismadb.video.update({
            where: { id: videoData.id },
            data: {
              indexerVideoId: existingVideoId,
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
              message: "Found existing indexed video",
              warning: "This video was previously processed"
            });
          }
        } catch (searchError) {
          console.warn("[VIDEO_SEARCH_ERROR]", searchError);
          // Continue to throw original error
        }
      }
      throw indexError; // Re-throw other errors
    }

  } catch (error) {
    console.error("[INDEXING_ERROR]", error);

    // Update status to FAILED if we have video data
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

    // Find video in database
    const video = await prismadb.video.findFirst({
      where: {
        OR: [
          { indexerVideoId: videoId || undefined },
          { id: dbId ? Number(dbId) : undefined }
        ]
      }
    });

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
          progress: Math.min(90, 20 + Math.random() * 70) // Random progress 20-90%
        }
      });
    }

    // Real Azure status check if available
    const azureAccessToken = await getAzureAccessToken();
    const status = await getIndexingStatus(
      video.indexerVideoId!,
      azureAccessToken,
      "Videos"
    );

    // Update DB if status changed
    if (['Processed', 'Failed'].includes(status.state)) {
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
    console.error("[STATUS_CHECK_ERROR]", error);
    return handleApiError(error);
  }
}

// format response
function formatVideoResponse(video: {
  id: number;
  azureVideoId?: string | null;
  indexerVideoId?: string | null;
  videoName: string;
  videoSize?: number | null;
  videoDuration?: number | null;
  videoLocation: string;
  imageLocation?: string | null;
  indexingStatus: string;
  indexedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customerNumber?: number | null;
  folderId?: number | null;
}): Video {
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

// Error Handler
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