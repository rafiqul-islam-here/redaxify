import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from 'axios';
import { getEnvVars } from "@/utils/env.utils";
import { Video } from "@/lib/types";

interface VideoIndexRequest {
  video: Video;
  options: string[];
}

export async function POST(req: Request) {
  let videoData: Video | null = null;

  try {
    const { video, options } = (await req.json()) as VideoIndexRequest;
    videoData = video;

    // Validate request data
    if (!videoData?.id || !videoData?.videoLocation) {
      return NextResponse.json(
        { error: "Invalid video data - ID and location are required" },
        { status: 400 }
      );
    }

    const env = getEnvVars();

    // Update video status to PROCESSING
    await prismadb.video.update({
      where: { id: videoData.id },
      data: { 
        indexingStatus: 'PROCESSING',
        updatedAt: new Date()
      }
    });

    // Get Azure AD token
    const managementToken = await getAzureManagementToken(env);
    
    // Get Video Indexer token
    const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);

    // Index the video
    const { videoId, statusUrl } = await indexVideo(env, videoData, options, viAccessToken);

    // Verify indexing was successfully started
    const indexingState = await verifyIndexingStarted(env, videoId, viAccessToken);

    if (!['Uploaded', 'Processing'].includes(indexingState)) {
      throw new Error(`Indexing failed to start. Status: ${indexingState}`);
    }

    // Update database with successful indexing start
    const updatedVideo = await prismadb.video.update({
      where: { id: videoData.id },
      data: { 
        indexingStatus: 'INDEXING',
        indexerVideoId: videoId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        videoName: true,
        indexingStatus: true,
        indexerVideoId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Video indexing started successfully",
      data: {
        video: updatedVideo,
        statusUrl,
        videoId,
        indexingState
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Video indexing error:", error);
    
    // Update status to FAILED if we have the video ID
    if (videoData?.id) {
      try {
        await prismadb.video.update({
          where: { id: videoData.id },
          data: { 
            indexingStatus: 'FAILED',
            updatedAt: new Date()
          }
        });
      } catch (dbError) {
        console.error("Failed to update video status:", dbError);
      }
    }

    // Handle error response
    if (error instanceof AxiosError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Video indexing failed",
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
}

// Helper Functions

async function getAzureManagementToken(env: ReturnType<typeof getEnvVars>) {
  const authParams = new URLSearchParams();
  authParams.append('grant_type', 'client_credentials');
  authParams.append('client_id', env.CLIENT_ID);
  authParams.append('client_secret', env.CLIENT_SECRET);
  authParams.append('resource', 'https://management.azure.com');

  const response = await axios.post(
    `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
    authParams,
    { 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000 
    }
  );
  
  return response.data.access_token;
}

async function getVideoIndexerAccessToken(
  env: ReturnType<typeof getEnvVars>,
  managementToken: string
) {
  const viTokenUrl = `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`;
  
  const response = await axios.post(
    viTokenUrl,
    { permissionType: 'Contributor', scope: 'Account' },
    { 
      headers: { 
        Authorization: `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
  
  return response.data.accessToken;
}

async function indexVideo(
  env: ReturnType<typeof getEnvVars>,
  video: Video,
  options: string[],
  accessToken: string
) {
  const response = await axios.post(
    `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos`,
    null,
    {
      params: {
        accessToken,
        name: video.videoName || `video-${Date.now()}`,
        videoUrl: video.videoLocation,
        indexingPreset: options.includes('Redaction') ? 'DefaultWithAudioRedaction' : 'Default',
        streamingPreset: 'Default',
        privacy: 'Public',
        language: 'English'
      },
      timeout: 15000
    }
  );

  return {
    videoId: response.data.id,
    statusUrl: `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${response.data.id}/Index`
  };
}

async function verifyIndexingStarted(
  env: ReturnType<typeof getEnvVars>,
  videoId: string,
  accessToken: string
): Promise<string> {
  const statusUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/Index`;
  
  const response = await axios.get(statusUrl, {
    params: { accessToken },
    timeout: 5000
  });

  return response.data.state;
}