import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { logActivity } from "@/lib/logActivity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerNumber,
      folderId,
      blobName,
      documentName,
      documentSize,
    } = body;

    if (!blobName || !documentName || !documentSize) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let folder = null;
    if (folderId) {
      folder = await prismadb.folder.findUnique({
        where: { id: folderId },
        include: { documents: true },
      });

      if (!folder || folder.customerNumber !== customerNumber) {
        return NextResponse.json(
          { success: false, error: "Invalid folder or customer" },
          { status: 404 }
        );
      }
    }

    const { document, updatedFolder } = await prismadb.$transaction(
      async (tx) => {
        const document = await tx.document.create({
          data: {
            customerNumber,
            folderId: folderId || null,
            documentName,
            documentSize,
            blobName,
          },
        });

        let updatedFolder = null;
        if (folderId) {
          updatedFolder = await tx.folder.update({
            where: { id: folderId },
            data: { updatedAt: new Date() },
            include: {
              documents: {
                select: {
                  id: true,
                  documentName: true,
                  blobName: true,
                },
              },
            },
          });
        }

        return { document, updatedFolder };
      }
    );

    logActivity({
      activityType: "document_upload",
      description: `Added a document in folder ${folder?.folderName || "N/A"} - filename: ${documentName} - filesize: ${documentSize}`,
      status: 1,
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      customerNumber,
    });

    const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "documents";

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        document: {
          id: document.id,
          name: document.documentName,
          blobName: document.blobName,
          size: document.documentSize,
          folderId: document.folderId,
        },
        folder: updatedFolder
          ? {
            id: updatedFolder.id,
            name: updatedFolder.folderName,
            documentCount: updatedFolder.documents.length,
          }
          : null,
        azure: {
          blobName,
          container: CONTAINER_NAME,
        },
      },
    });
  } catch (error) {
    console.error("[DOCUMENT_SAVE_ERROR]", error);
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
