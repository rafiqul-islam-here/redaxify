import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { logActivity } from "@/lib/logActivity";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { folderName, customerNumber } = body;
    let { type } = body;

    if (!folderName || !customerNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const custNum = Number(customerNumber);
    if (isNaN(custNum)) {
      return NextResponse.json({ error: "Invalid customerNumber" }, { status: 400 });
    }

    if (!type) {
      type = "video";
    }

    const newFolder = await prismadb.folder.create({
      data: {
        folderName,
        customerNumber: custNum,
        type,
      },
    });

    logActivity({
      activityType: "folder_created",
      description: `Folder '${folderName}' of type '${type}' created`,
      status: 200,
      customerNumber: custNum,
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    }).catch((e) => {
      console.error("Activity log failed:", e);
    });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Error creating folder" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerNumber = searchParams.get("customerNumber");
    let type = searchParams.get("type");

    if (!customerNumber) {
      return NextResponse.json({ error: "Customer number is required" }, { status: 400 });
    }

    const custNum = Number(customerNumber);
    if (isNaN(custNum)) {
      return NextResponse.json({ error: "Invalid customerNumber" }, { status: 400 });
    }

    if (!type) {
      type = "video";
    }

    const folders = await prismadb.folder.findMany({
      where: {
        customerNumber: custNum,
        type,
      },
      include: {
        videos: true,
        documents: true,
      },
    });

    return NextResponse.json(folders, { status: 200 });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json({ error: "Error fetching folders" }, { status: 500 });
  }
}
