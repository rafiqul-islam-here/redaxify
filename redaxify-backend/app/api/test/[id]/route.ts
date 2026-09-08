import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { BlobServiceClient } from '@azure/storage-blob';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    // Get all videos in this folder first
    const videos = await prismadb.video.findMany({
      where: {
        folderId: parseInt(id),
      },
      select: {
        id: true,
        videoLocation: true
      }
    });

    // Initialize Azure Blob Service Client
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = process.env.AZURE_CONTAINER_NAME || 'videos';
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Delete each video from Azure Blob Storage
    for (const video of videos) {
      try {
        if (video.videoLocation) {
          const url = new URL(video.videoLocation);
          const pathParts = url.pathname.split('/');
          const blobName = pathParts.slice(2).join('/');
          
          if (blobName) {
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            if (await blockBlobClient.exists()) {
              await blockBlobClient.delete();
            }
          }
        }
      } catch (error) {
        console.error(`Error deleting video ${video.id} from Azure:`, error);
        // Continue with other videos even if one fails
      }
    }

    // Delete all videos from database (cascading delete)
    await prismadb.video.deleteMany({
      where: {
        folderId: parseInt(id),
      },
    });

    // Finally, delete the folder itself
    await prismadb.folder.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Folder and all associated videos deleted successfully",
        deletedVideosCount: videos.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { 
        error: "Error deleting folder",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}