// app/api/video/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { deleteBlob } from "@/lib/azureBlob";
import { logActivity } from "@/lib/logActivity";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerNumberParam = searchParams.get("customerNumber");
        const idParam = req.nextUrl.pathname.split("/").pop(); // grab [id] from route

        if (!idParam || !customerNumberParam) {
            return NextResponse.json({ success: false, error: "Missing videoId or customerNumber" }, { status: 400 });
        }

        const videoId = parseInt(idParam, 10);
        const customerNumber = parseInt(customerNumberParam, 10);

        if (isNaN(videoId) || isNaN(customerNumber)) {
            return NextResponse.json({ success: false, error: "Invalid videoId or customerNumber" }, { status: 400 });
        }

        // Find video by both id and customerNumber
        const video = await prismadb.video.findFirst({
            where: { id: videoId, customerNumber },
        });

        if (!video) {
            return NextResponse.json(
                { success: false, error: "Video not found or not owned by customer" },
                { status: 404 }
            );
        }

        const folderId = video.folderId || null;
        const blobName = video.azureVideoId;

        // Delete video from DB
        await prismadb.video.delete({
            where: { id: videoId },
        });

        // Delete from Azure Blob
        if (blobName) {
            const deleted = await deleteBlob(blobName);
            if (!deleted)
                console.warn(`[VIDEO_BLOB_DELETE] Blob ${blobName} was not deleted or does not exist`);
        }

        // Update folder's updatedAt if exists
        if (folderId) {
            await prismadb.folder.update({
                where: { id: folderId },
                data: { updatedAt: new Date() },
            });
        }

        // Log activity
        await logActivity({
            activityType: "video_delete",
            description: `Deleted video: ${video.videoName} from folder ${folderId || "N/A"}`,
            status: 1,
            userAgent: req.headers.get("user-agent") || undefined,
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            customerNumber,
        });

        return NextResponse.json({
            success: true,
            message: "Video deleted successfully",
            data: {
                id: videoId,
                name: video.videoName,
                folderId,
            },
        });
    } catch (error) {
        console.error("[VIDEO_DELETE_ERROR]", error);
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


export async function GET(req: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = await context.params;

        const video = await prismadb.video.findUnique({
            where: { id: Number(id) },
        });

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        return NextResponse.json(video);
    } catch (error) {
        console.error("[VIDEO_GET_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        const video = await prismadb.video.update({
            where: { id: Number(id) },
            data: {
                ...body,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(video);
    } catch (error) {
        console.error("[VIDEO_UPDATE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
