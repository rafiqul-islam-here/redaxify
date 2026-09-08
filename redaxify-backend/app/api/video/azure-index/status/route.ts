import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios from 'axios';
import { getEnvVars } from "@/utils/env.utils";

interface IndexingResult {
  state: string;
  progress?: number;
  processingResult?: any;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const dbVideoId = searchParams.get('dbVideoId');

  if (!videoId || !dbVideoId) {
    return NextResponse.json(
      { error: "Missing videoId or dbVideoId parameters" },
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

    // Update database based on current state
    let dbStatus: 'INDEXING' | 'COMPLETED' | 'FAILED' = 'INDEXING';
    if (result.state === 'Processed') {
      dbStatus = 'COMPLETED';
    } else if (result.state === 'Failed') {
      dbStatus = 'FAILED';
    }

    await prismadb.video.update({
      where: { id: Number(dbVideoId) },
      data: { 
        indexingStatus: dbStatus,
        ...(result.state === 'Processed' && { indexedAt: new Date() }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      state: result.state,
      progress,
      isComplete: result.state === 'Processed',
      isFailed: result.state === 'Failed',
      processingResult: result.processingResult
    });

  } catch (error) {
    console.error("Status check error:", error);
    
    try {
      await prismadb.video.update({
        where: { id: Number(dbVideoId) },
        data: { 
          indexingStatus: 'FAILED',
          updatedAt: new Date()
        }
      });
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

// Reuse helper functions from main endpoint
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