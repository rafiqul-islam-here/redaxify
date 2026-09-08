import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            azureVideoId,
            customerNumber,
            videoName,
            videoSize,
            videoDuration,
            videoLocation,
            imageLocation,
            folderId,
            indexingStatus,
        } = body;

        if (!customerNumber || !videoName || !folderId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const video = await prismadb.video.create({
            data: {
                azureVideoId: azureVideoId || "",
                customerNumber,
                videoName,
                videoSize: videoSize || 0,
                videoDuration: videoDuration || 0,
                videoLocation: videoLocation || "",
                imageLocation: imageLocation || "",
                folderId,
                indexingStatus: indexingStatus || "PENDING",
            },
        });

        return NextResponse.json(video);
    } catch (error) {
        console.error("[VIDEO_CREATE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
