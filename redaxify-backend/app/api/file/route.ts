// app/api/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { logActivity } from "@/lib/logActivity";
import { deleteBlob } from "@/lib/azureBlob";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileIdParam = searchParams.get("fileId");
        const customerNumberParam = searchParams.get("customerId");

        if (!fileIdParam || !customerNumberParam) {
            return NextResponse.json(
                { success: false, error: "Missing file ID or customer ID" },
                { status: 400 }
            );
        }

        const fileId = parseInt(fileIdParam, 10);
        const customerNumber = parseInt(customerNumberParam, 10);

        if (isNaN(fileId) || isNaN(customerNumber)) {
            return NextResponse.json(
                { success: false, error: "Invalid file ID or customer ID" },
                { status: 400 }
            );
        }

        let deletedFile: any = null;
        let folderId: number | null = null;
        let blobName: string | null = null;

        await prismadb.$transaction(async (tx) => {
            deletedFile = await tx.document.findFirst({
                where: { id: fileId, customerNumber },
            });

            if (deletedFile) {
                folderId = deletedFile.folderId || null;
                blobName = deletedFile.blobName;

                await tx.documentAnalysisResult.deleteMany({
                    where: { documentId: fileId },
                });
                await tx.documentResult.deleteMany({
                    where: { documentId: fileId },
                });

                await tx.document.delete({ where: { id: fileId } });
            } else {
                deletedFile = await tx.video.findFirst({
                    where: { id: fileId, customerNumber },
                });

                if (!deletedFile) {
                    return NextResponse.json(
                        { success: false, error: "File not found or not owned by customer" },
                        { status: 404 }
                    );
                }

                folderId = deletedFile.folderId || null;
                blobName = deletedFile.blobName;
                await tx.video.delete({ where: { id: fileId } });
            }

            if (folderId) {
                await tx.folder.update({
                    where: { id: folderId },
                    data: { updatedAt: new Date() },
                });
            }
        });

        if (blobName) {
            const azureDeleted = await deleteBlob(blobName);
            if (!azureDeleted) console.warn(`Blob ${blobName} was not deleted or does not exist`);
        }

        await logActivity({
            activityType: "file_delete",
            description: `Deleted file: ${deletedFile?.documentName || deletedFile?.videoName} from folder ${folderId || "N/A"}`,
            status: 1,
            userAgent: req.headers.get("user-agent") || undefined,
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            customerNumber,
        });

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
            data: {
                id: deletedFile.id,
                name: deletedFile.documentName || deletedFile.videoName,
                folderId,
            },
        });
    } catch (error) {
        console.error("[FILE_DELETE_ERROR]", error);

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
