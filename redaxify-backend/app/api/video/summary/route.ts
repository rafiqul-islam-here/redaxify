import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { getEnvVars } from "@/utils/env.utils";
import axios, { AxiosError } from "axios";
import { generateSummaryFromDialogue } from "@/lib/azure-openai";

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

    const dbVideo = await prismadb.video.findUnique({
      where: { id: Number(videoId) },
    });

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

    const env = getEnvVars();

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

    const viTokenResponse = await axios.post(
      `https://management.azure.com/subscriptions/${env.SUBSCRIPTION_ID}/resourceGroups/${env.RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${env.VI_ACCOUNT_NAME}/generateAccessToken?api-version=2022-08-01`,
      { permissionType: 'Contributor', scope: 'Account' },
      { headers: { 'Authorization': `Bearer ${managementToken}` } }
    );
    const viAccessToken = viTokenResponse.data.accessToken;

    const transcriptResponse = await axios.get(
      `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${dbVideo.indexerVideoId}/Index`,
      {
        params: { accessToken: viAccessToken },
        timeout: 15000
      }
    );

    const insights = transcriptResponse.data.videos[0].insights;
    const transcriptItems = insights.transcript;
    const speakers = insights.speakers || []; // Handle case where speakers might be undefined

    // console.log('Insights structure:', {
    //   hasTranscript: !!insights.transcript,
    //   transcriptLength: insights.transcript?.length,
    //   hasSpeakers: !!insights.speakers,
    //   speakersLength: insights.speakers?.length,
    //   insightsKeys: Object.keys(insights)
    // });

    const speakerMap = new Map<number, string>();
    speakers.forEach((speaker: { id: number; name: string }) => {
      speakerMap.set(speaker.id, speaker.name);
    });

    const dialogueParagraph = transcriptItems
      .map((item: { id: number; text: string; speakerId?: number }) => {
        if (speakerMap.size > 0 && item.speakerId !== undefined) {
          const speakerName = speakerMap.get(item.speakerId) || `Speaker #${item.speakerId}`;
          return `${speakerName}: ${item.text}`;
        } else {
          // If no speakers info available, just return the text
          return item.text;
        }
      })
      .join('\n');

    // console.log("Formated Transcript: ", dialogueParagraph);
    const summary = await generateSummaryFromDialogue(dialogueParagraph)
    // console.log("Summary: ", summary)

    return NextResponse.json({
      transcript: dialogueParagraph,
      summary
    });

  } catch (error) {
    console.error("Transcript get error", error);

    if (error instanceof AxiosError) {
      return NextResponse.json(
        {
          error: "Failed to fetch transcript",
          details: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}