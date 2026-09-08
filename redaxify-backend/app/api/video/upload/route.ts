import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { logActivity } from "@/lib/logActivity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerNumber,
      folderId,
      videoUrl,
      blobName,
      videoName,
      videoSize,
      videoDuration,
      user, // make sure user object is passed in request body
    } = body;

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

    logActivity({
      activityType: "video_upload",
      description: `Added a video in folder ${folder.folderName} - filename: ${videoName} - filesize: ${videoSize}`,
      status: 1,
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      customerNumber,
    });


    const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "videos";

    return NextResponse.json({
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
    });
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
