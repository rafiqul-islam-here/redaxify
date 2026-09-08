import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from 'axios';
import { getEnvVars } from "@/utils/env.utils";

interface Video {
  id: number;
  azureVideoId: string;
  videoName: string;
  videoSize: number;
  videoDuration: number;
  videoLocation: string;
  imageLocation: string | null;
  indexingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "INDEXING";
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerNumber: number;
  folderId: number | null;
}

interface VideoIndexRequest {
  video: Video;
  options: string[];
}

interface ProcessingResult {
  insights?: {
    transcripts?: unknown[];
    faces?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface IndexingResult {
  state: string;
  progress?: number;
  processingResult?: ProcessingResult;
}

interface VideoUpdateData {
  indexingStatus: Video['indexingStatus'];
  updatedAt: Date;
  indexedAt?: Date;
  azureVideoId?: string;
}

// Helper function to update video status in database
async function updateVideoStatus(videoId: number, status: Video['indexingStatus'], azureVideoId?: string) {
  const updateData: VideoUpdateData = {
    indexingStatus: status,
    updatedAt: new Date()
  };

  if (status === 'COMPLETED') {
    updateData.indexedAt = new Date();
  }

  if (azureVideoId) {
    updateData.azureVideoId = azureVideoId;
  }

  await prismadb.video.update({
    where: { id: videoId },
    data: updateData
  });
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
    await updateVideoStatus(videoData.id, 'PROCESSING');

    // Get Azure AD token
    const managementToken = await getAzureManagementToken(env);
    
    // Get Video Indexer token
    const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);

    // Index the video
    const { videoId, statusUrl } = await indexVideo(env, videoData, options, viAccessToken);

    // Update with Azure video ID
    await updateVideoStatus(videoData.id, 'INDEXING', videoId);

    // Verify indexing was successfully started
    const indexingState = await verifyIndexingStarted(env, videoId, viAccessToken);

    if (!['Uploaded', 'Processing'].includes(indexingState)) {
      await updateVideoStatus(videoData.id, 'FAILED');
      throw new Error(`Indexing failed to start. Status: ${indexingState}`);
    }

    // Return polling information immediately
    return NextResponse.json({
      success: true,
      message: "Video indexing started successfully",
      data: {
        videoId,
        statusUrl,
        pollingUrl: `/api/video/azure-index/status?videoId=${videoId}&dbVideoId=${videoData.id}`,
        initialStatus: indexingState,
        progress: 0,
        state: indexingState
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Video indexing error:", error);
    
    // Update status to FAILED if we have the video ID
    if (videoData?.id) {
      try {
        await updateVideoStatus(videoData.id, 'FAILED');
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const dbVideoId = searchParams.get('dbVideoId');

  if (!videoId || !dbVideoId) {
    return NextResponse.json(
      { error: "Missing parameters" },
      { status: 400 }
    );
  }

  try {
    const env = getEnvVars();
    const managementToken = await getAzureManagementToken(env);
    const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);
    
    const statusUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/Index`;
    const response = await axios.get(statusUrl, {
      params: { accessToken: viAccessToken },
      timeout: 5000
    });

    const result: IndexingResult = response.data;
    const progress = result.progress || 0;

    // Map Azure Indexer states to our database states
    let dbStatus: Video['indexingStatus'] = 'INDEXING';
    if (result.state === 'Processed') {
      dbStatus = 'COMPLETED';
    } else if (result.state === 'Failed') {
      dbStatus = 'FAILED';
    }

    // Update database status
    await updateVideoStatus(Number(dbVideoId), dbStatus);

    return NextResponse.json({
      state: result.state,
      progress,
      isComplete: result.state === 'Processed',
      isFailed: result.state === 'Failed',
      processingResult: result.processingResult,
      dbStatus
    });

  } catch (error: unknown) {
    console.error("Status check error:", error);
    
    // Update status to failed if we can't check status
    try {
      await updateVideoStatus(Number(dbVideoId), 'FAILED');
    } catch (dbError) {
      console.error("Failed to update video status:", dbError);
    }

    return NextResponse.json(
      { 
        error: "Failed to check status",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper Functions
interface AzureTokenResponse {
  access_token: string;
  [key: string]: unknown;
}

async function getAzureManagementToken(env: ReturnType<typeof getEnvVars>): Promise<string> {
  const authParams = new URLSearchParams();
  authParams.append('grant_type', 'client_credentials');
  authParams.append('client_id', env.CLIENT_ID);
  authParams.append('client_secret', env.CLIENT_SECRET);
  authParams.append('resource', 'https://management.azure.com');

  const response = await axios.post<AzureTokenResponse>(
    `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
    authParams,
    { 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000 
    }
  );
  
  return response.data.access_token;
}

interface VideoIndexerTokenResponse {
  accessToken: string;
  [key: string]: unknown;
}

async function getVideoIndexerAccessToken(
  env: ReturnType<typeof getEnvVars>,
  managementToken: string
): Promise<string> {
  const viTokenUrl = `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`;
  
  const response = await axios.post<VideoIndexerTokenResponse>(
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

interface IndexVideoResponse {
  id: string;
  [key: string]: unknown;
}

async function indexVideo(
  env: ReturnType<typeof getEnvVars>,
  video: Video,
  options: string[],
  accessToken: string
): Promise<{ videoId: string; statusUrl: string }> {
  const response = await axios.post<IndexVideoResponse>(
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
  
  const response = await axios.get<IndexingResult>(statusUrl, {
    params: { accessToken },
    timeout: 5000
  });

  return response.data.state;
}