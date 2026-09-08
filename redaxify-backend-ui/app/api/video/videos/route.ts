import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerNumber = searchParams.get("customerNumber");

        if (!customerNumber) {
            return NextResponse.json(
                { error: "Customer number is required" },
                { status: 400 }
            );
        }

        // Get folders and their videos from backend
        const foldersResponse = await api.get("/folder", {
            params: { customerNumber },
        });

        const folders = foldersResponse.data;

        // Extract all videos from all folders
        const allVideos = folders.flatMap((folder: any) =>
            folder.videos.map((video: any) => ({
                id: video.id,
                videoId: video.indexerVideoId || null,
                title: video.videoName,
                thumbnailUrl: video.imageLocation || "/icons/video-placeholder.svg",
                status: video.indexingStatus,
                duration: video.videoDuration || 0,
                formattedDuration: formatDuration(video.videoDuration || 0),
                size: video.videoSize || 0,
                createdAt: video.createdAt,
                indexedAt: video.indexedAt,
                isIndexed: video.indexingStatus === 'SUCCESS',
                processingProgress: video.indexingStatus === 'PROCESSING' ? Math.random() * 100 : 0,
                folderId: video.folderId,
                folderName: folder.folderName
            }))
        );

        return NextResponse.json({
            success: true,
            data: {
                videos: allVideos,
                totalVideos: allVideos.length,
                indexedVideos: allVideos.filter((v: any) => v.isIndexed).length,
                processingVideos: allVideos.filter((v: any) => v.status === 'PROCESSING').length
            }
        });

    } catch (error) {
        console.error("[GET_VIDEOS_ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch videos",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
