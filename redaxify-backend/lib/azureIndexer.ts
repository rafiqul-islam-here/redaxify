import axios from "axios";
import { Video } from "@/lib/types";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

export async function indexVideo(
    video: Video,
    options: string[],
    accessToken: string,
    folder: string
): Promise<{ videoId: string }> {
    if (MOCK_EXTERNAL_SERVICES) {
        return { videoId: `mock-video-${Date.now()}` };
    }

    const {
        API_ENDPOINT,
        LOCATION,
        VI_ACCOUNT_ID
    } = process.env;

    console.log("Indexing video :", video);


    if (!API_ENDPOINT || !LOCATION || !VI_ACCOUNT_ID) {
        throw new Error("Missing Azure Video Indexer env vars");
    }

    try {
        const { data } = await axios.post(
            `${API_ENDPOINT}/${LOCATION}/Accounts/${VI_ACCOUNT_ID}/${folder}`,
            null,
            {
                params: {
                    accessToken,
                    name: video.videoName || `video-${Date.now()}`,
                    videoUrl: video.videoLocation,
                    indexingPreset: options.includes('Redaction') ? 'DefaultWithAudioRedaction' : 'Default',
                    streamingPreset: 'Default',
                    privacy: 'Private',
                    language: 'English'
                },
                timeout: 50000
            }
        );
        return { videoId: data.id };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            // Extract video ID from error response if available
            const existingId = error.response.data?.id;
            if (existingId) {
                return { videoId: existingId };
            }

            // Fallback: Try to get the existing video ID by querying with the video URL
            const listResponse = await axios.get(
                `${API_ENDPOINT}/${LOCATION}/Accounts/${VI_ACCOUNT_ID}/${folder}`,
                {
                    params: {
                        accessToken,
                        videoUrl: video.videoLocation
                    }
                }
            );

            if (listResponse.data?.results?.[0]?.id) {
                return { videoId: listResponse.data.results[0].id };
            }
        }
        throw error;
    }
}

export async function getIndexingStatus(
    videoId: string,
    accessToken: string,
    folder: string
): Promise<{ state: string; processingProgress?: number }> {
    if (MOCK_EXTERNAL_SERVICES) {
        return { state: "Processed", processingProgress: 100 };
    }

    const {
        API_ENDPOINT,
        LOCATION,
        VI_ACCOUNT_ID
    } = process.env;

    if (!API_ENDPOINT || !LOCATION || !VI_ACCOUNT_ID) {
        throw new Error("Missing Azure Video Indexer env vars");
    }

    const url = `${API_ENDPOINT}/${LOCATION}/Accounts/${VI_ACCOUNT_ID}/${folder}/${videoId}/Index`;
    const { data } = await axios.get(url, {
        params: { accessToken },
        timeout: 5000
    });
    return data;
}