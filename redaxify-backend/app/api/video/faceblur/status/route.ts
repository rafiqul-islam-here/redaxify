import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { getEnvVars } from "@/utils/env.utils";
import { getAzureAccessToken } from "@/lib/getAzureAccessToken";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get("jobId");

        if (!jobId) {
            return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
        }

        const env = getEnvVars();
        const accessToken = await getAzureAccessToken();

        const url = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Jobs/${jobId}`;
        console.log("Fetching face blur job status from URL:", url);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            timeout: 30000
        });

        console.log("Face blur job status response:", response.data);

        return NextResponse.json({ success: true, status: response.data });
    } catch (error) {
        console.error("[JOB_STATUS_ERROR]", error);
        if (error instanceof AxiosError) {
            return NextResponse.json({ success: false, error: error.message, details: error.response?.data || null }, { status: error.response?.status || 500 });
        }
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
