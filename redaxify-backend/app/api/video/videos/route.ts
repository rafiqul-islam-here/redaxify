import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from 'axios';
import { getEnvVars } from "@/utils/env.utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerNumber = searchParams.get('customerNumber');
    
    if (!customerNumber) {
      return NextResponse.json(
        { error: "Customer number is required" },
        { status: 400 }
      );
    }

    // getting the vidoes from the databse first.
    const dbVideos = await prismadb.video.findMany({
      where: { customerNumber: Number(customerNumber) },
      orderBy: { createdAt: 'desc' }
    });

    // Azure Video Indexer data
    const env = getEnvVars();
    const managementToken = await getAzureManagementToken(env);
    const viAccessToken = await getVideoIndexerAccessToken(env, managementToken);
    const indexerVideos = await getIndexerVideos(env, viAccessToken);

    // combination of data
    const enrichedVideos = await Promise.all(
      dbVideos.map(async (dbVideo) => {
        const indexerVideo = indexerVideos.find(v => v.id === dbVideo.indexerVideoId);
        
        // Get thumbnail with fallbacks
        let thumbnailUrl = '';
        if (indexerVideo?.thumbnailUrl) {
          thumbnailUrl = indexerVideo.thumbnailUrl;
        } else if (dbVideo.imageLocation) {
          thumbnailUrl = dbVideo.imageLocation;
        } else {
          thumbnailUrl = 'https://placehold.co/600x400.png';
        }

        // video status with priority: Indexer > Database
        const status = indexerVideo?.state 
          ? indexerVideo.state === 'Processed' ? 'SUCCESS' : 'PROCESSING'
          : dbVideo.indexingStatus;

        return {
          // these are database fields
          id: dbVideo.id,
          title: dbVideo.videoName,
          size: dbVideo.videoSize,
          createdAt: dbVideo.createdAt,
          indexedAt: dbVideo.indexedAt,
          customerNumber: dbVideo.customerNumber,
          
          // these are indexer fields
          videoId: dbVideo.indexerVideoId,
          duration: indexerVideo?.durationInSeconds || dbVideo.videoDuration,
          thumbnailUrl,
          status,
          processingProgress: indexerVideo?.processingProgress || (status === 'SUCCESS' ? 100 : 0),
          
          // these are computed fields
          isIndexed: status === 'SUCCESS',
          formattedDuration: formatDuration(indexerVideo?.durationInSeconds || dbVideo.videoDuration)
        };
      })
    );

    // statistics
    const totalVideos = enrichedVideos.length;
    const indexedVideos = enrichedVideos.filter(v => v.isIndexed).length;

    return NextResponse.json({
      success: true,
      data: {
        totalVideos,
        indexedVideos,
        videos: enrichedVideos
      }
    });

  } catch (error) {
    console.error("[VIDEOS_FETCH_ERROR]", error);
    return handleApiError(error);
  }
}

async function getIndexerVideos(env: ReturnType<typeof getEnvVars>, accessToken: string) {
  const { data } = await axios.get(
    `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos`,
    { params: { accessToken } }
  );

  return await Promise.all(
    data.results.map(async (video: any) => {
      let thumbnailUrl = '';
      try {
        if (video.thumbnailId) {
          thumbnailUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${video.id}/Thumbnails/${video.thumbnailId}?accessToken=${accessToken}`;
        } else {
          const thumbnails = await axios.get(
            `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${video.id}/Thumbnails`,
            { params: { accessToken } }
          );
          if (thumbnails.data?.results?.[0]?.id) {
            thumbnailUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${video.id}/Thumbnails/${thumbnails.data.results[0].id}?accessToken=${accessToken}`;
          }
        }
      } catch (error) {
        console.warn(`Failed to get thumbnail for video ${video.id}:`, error);
      }

      return {
        id: video.id,
        name: video.name,
        state: video.state,
        processingProgress: video.processingProgress,
        durationInSeconds: video.durationInSeconds,
        thumbnailUrl
      };
    })
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function handleApiError(error: unknown) {
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

async function getAzureManagementToken(env: ReturnType<typeof getEnvVars>): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', env.CLIENT_ID);
  params.append('client_secret', env.CLIENT_SECRET);
  params.append('resource', 'https://management.azure.com');

  const { data } = await axios.post(
    `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data.access_token;
}

async function getVideoIndexerAccessToken(
  env: ReturnType<typeof getEnvVars>,
  managementToken: string
): Promise<string> {
  const { data } = await axios.post(
    `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`,
    { permissionType: 'Contributor', scope: 'Account' },
    { headers: { Authorization: `Bearer ${managementToken}` } }
  );
  return data.accessToken;
}