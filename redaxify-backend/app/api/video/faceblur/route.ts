import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import axios, { AxiosError } from "axios";
import { getEnvVars } from "@/utils/env.utils";
import { getAzureAccessToken } from "@/lib/getAzureAccessToken";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const videoId = body.videoId;
        const faceFilter = body.faceFilter; // optional: { ids: [1001,1016], scope: "Include"|"Exclude" }

        console.log("Face blur route called for videoId:", videoId);

        if (!videoId) {
            return NextResponse.json({ success: false, error: "videoId is required" }, { status: 400 });
        }

        const video = await prismadb.video.findUnique({ where: { id: Number(videoId) } });

        if (!video) {
            return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
        }

        if (!video.indexerVideoId) {
            return NextResponse.json({ success: false, error: "Video has not been indexed yet" }, { status: 400 });
        }

        const env = getEnvVars();
        const accessToken = await getAzureAccessToken();

        const url = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${video.indexerVideoId}/redact?priority=Low&name=face-blur-${videoId}&privacy=Private&streamingPreset=Default`;
        console.log("Face blur request URL:", url);
        // Build request body
        const payload: any = { faces: { blurringKind: "HighBlur" } };
        if (faceFilter && faceFilter.ids && faceFilter.scope) {
            payload.faces.filter = {
                ids: faceFilter.ids,
                scope: faceFilter.scope
            };
        }

        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            timeout: 30000
        });

        if (response.status === 202) {
            const location = response.headers["location"] as string;
            const jobId = location ? location.split("/Jobs/")[1] : null;
            console.log("Face blur job created with ID:", jobId);

            return NextResponse.json({ success: true, message: "Face blur job created", jobId });
        }

        return NextResponse.json({ success: false, error: "Failed to create face blur job" }, { status: 500 });
    } catch (error) {
        console.error("[FACEBLUR_ERROR]", error);
        if (error instanceof AxiosError) {
            return NextResponse.json({ success: false, error: error.message, details: error.response?.data || null }, { status: error.response?.status || 500 });
        }
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
