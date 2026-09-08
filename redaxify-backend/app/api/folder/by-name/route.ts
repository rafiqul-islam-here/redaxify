import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const folderName = searchParams.get("folderName");
        const customerNumber = searchParams.get("customerNumber");

        // Validate inputs
        if (!folderName || !customerNumber) {
            return NextResponse.json(
                { error: "folderName and customerNumber are required" },
                { status: 400 }
            );
        }

        const folder = await prismadb.folder.findFirst({
            where: {
                folderName,
                customerNumber: Number(customerNumber),
            },
            select: {
                id: true,
                folderName: true,
                customerNumber: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        return NextResponse.json({ folderId: folder.id }, { status: 200 });
    } catch (error) {
        console.error("Error fetching folder by name and customerNumber:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
