import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function POST(req: Request) {
    try {
        console.log("Started .......")
        
        const formData = await req.formData();
        const customerNumber = Number(formData.get("customerNumber")?.toString());
        const videoDuration = Number(formData.get("videoDuration")?.toString());
        const videoName = formData.get("videoName")?.toString();
        const videoSize = Number(formData.get("videoSize")?.toString());
        const videoUrl = formData.get("videoUrl")?.toString();
        const blobName = formData.get("blobName")?.toString();
        const folderId = Number(formData.get("folderId"));



        const folder = await prismadb.folder.findUnique({
            where: { id: folderId },
            include: { videos: true },
        });

        if (!folder || folder.customerNumber !== customerNumber) {
            return NextResponse.json(
                { success: false, error: "Invalid folder or customer" },
                { status: 404 }
            );
        }

        const [video, updatedFolder] = await prismadb.$transaction([
            prismadb.video.create({
                data: {
                    azureVideoId: blobName,
                    customerNumber,
                    videoName,
                    videoSize,
                    videoDuration,
                    videoLocation: videoUrl,
                    imageLocation: "",
                    folderId,
                    indexingStatus: "PENDING",
                },
            }),
            prismadb.folder.update({
                where: { id: folderId },
                data: { updatedAt: new Date() },
                include: {
                    videos: {
                        select: {
                            id: true,
                            videoName: true,
                            videoLocation: true,
                        },
                    },
                },
            }),
        ]);

        const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "videos";

        const responsePayload = {
            success: true,
            message: "Video uploaded successfully",
            data: {
                video: {
                    id: video.id,
                    name: video.videoName,
                    url: video.videoLocation,
                    size: video.videoSize,
                    folderId: video.folderId,
                },
                folder: {
                    id: updatedFolder.id,
                    name: updatedFolder.folderName,
                    videoCount: updatedFolder.videos.length,
                },
                azure: {
                    blobName,
                    container: CONTAINER_NAME,
                },
            },
        };

        return NextResponse.json(responsePayload);
    } catch (error) {
        console.error("[VIDEO_SAVE_ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
