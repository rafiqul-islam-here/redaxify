// lib/azureRedactor.ts
import axios, { AxiosError } from "axios";
import { getEnvVars } from "@/utils/env.utils";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

interface FaceBlurResult {
    redactedUrl: string | null;
    playerUrl: string | null;
    status: 'Processing' | 'Processed' | 'Failed';
}

interface RedactionStatus {
    state: 'Processing' | 'Processed' | 'Failed';
    progress?: number;
    videos?: Array<{
        redactedVideoUrl?: string;
    }>;
}

export async function applyFaceBlur(
    videoId: string,
    accessToken: string
): Promise<FaceBlurResult> {
    if (MOCK_EXTERNAL_SERVICES) {
        return {
            redactedUrl: null,
            playerUrl: null,
            status: "Processed"
        };
    }

    const env = getEnvVars();

    try {
        // Step 1: Initiate face blur/redaction
        const initiateUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/Redactions`;

        console.log(`[FACE_BLUR] Initiating blur for video: ${videoId}`);

        await axios.post(initiateUrl, null, {
            params: {
                accessToken,
                redactionType: "face",
                redactorMode: "blur",
                resolution: "720p"
            }
        });

        // Step 2: Poll for completion
        const maxAttempts = 60; // 10 minutes max (10s intervals)
        const pollInterval = 10000; // 10 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const status = await checkRedactionStatus(videoId, accessToken);

            console.log(`[FACE_BLUR] Poll attempt ${attempt + 1}: ${status.state}`);

            if (status.state === 'Processed') {
                const redactedUrl = status.videos?.[0]?.redactedVideoUrl || null;
                const playerUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/PlayerWidget`;

                return {
                    redactedUrl,
                    playerUrl,
                    status: 'Processed'
                };
            }

            if (status.state === 'Failed') {
                console.error('[FACE_BLUR] Redaction failed');
                return {
                    redactedUrl: null,
                    playerUrl: null,
                    status: 'Failed'
                };
            }
        }

        // Timeout
        console.warn('[FACE_BLUR] Polling timeout - returning processing status');
        return {
            redactedUrl: null,
            playerUrl: null,
            status: 'Processing'
        };

    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.error('[FACE_BLUR] Video not found or redaction endpoint unavailable');
            return {
                redactedUrl: null,
                playerUrl: null,
                status: 'Failed'
            };
        }
        console.error('[FACE_BLUR_ERROR]', error);
        throw error;
    }
}

async function checkRedactionStatus(
    videoId: string,
    accessToken: string
): Promise<RedactionStatus> {
    if (MOCK_EXTERNAL_SERVICES) {
        return { state: "Processed", progress: 100, videos: [] };
    }

    const env = getEnvVars();

    const statusUrl = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/Redactions/Status`;

    try {
        const response = await axios.get(statusUrl, {
            params: { accessToken }
        });

        return {
            state: response.data?.state || 'Processing',
            progress: response.data?.progress,
            videos: response.data?.videos
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return {
                state: 'Failed',
                videos: []
            };
        }
        throw error;
    }
}

export async function initiateFaceBlur(
    videoId: string,
    accessToken: string
): Promise<void> {
    if (MOCK_EXTERNAL_SERVICES) {
        return;
    }

    const env = getEnvVars();

    const url = `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/Redactions`;

    await axios.post(url, null, {
        params: {
            accessToken,
            redactionType: "face",
            redactorMode: "blur",
            resolution: "720p"
        }
    });
}

export async function getFaceBlurStatus(
    videoId: string,
    accessToken: string
): Promise<FaceBlurResult> {
    const status = await checkRedactionStatus(videoId, accessToken);
    const env = getEnvVars();

    if (status.state === 'Processed') {
        return {
            redactedUrl: status.videos?.[0]?.redactedVideoUrl || null,
            playerUrl: `${env.API_ENDPOINT}/${env.LOCATION}/Accounts/${env.VI_ACCOUNT_ID}/Videos/${videoId}/PlayerWidget`,
            status: 'Processed'
        };
    }

    return {
        redactedUrl: null,
        playerUrl: null,
        status: status.state
    };
}