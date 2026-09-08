import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function GET() {
  try {
    // console.log("Fetching dashboard folders...");	
    // Fetch all folders with their related user and video count
    const folders = await prismadb.folder.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        videos: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const enrichedFolders = folders.map((folder, index) => ({
      serialNumber: index + 1,
      folderName: folder.folderName,
      userName: folder.user.name,
      userEmail: folder.user.email,
      fileCount: folder.videos.length,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      folderId: folder.id,
      customerNumber: folder.customerNumber,
    }));

    return NextResponse.json(enrichedFolders, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard folders:", error);
    return NextResponse.json(
      { error: "Error fetching dashboard folders" },
      { status: 500 }
    );
  }
}