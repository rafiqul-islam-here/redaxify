import { NextRequest, NextResponse } from "next/server";
import {
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
    StorageSharedKeyCredential
} from "@azure/storage-blob";

export async function POST(req: NextRequest) {
    const { fileName, folderId, customerNumber } = await req.json();

    const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/AccountName=([^;]+)/)?.[1];
    const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/AccountKey=([^;]+)/)?.[1];
    const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

    if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY) {
        return NextResponse.json({ error: "Azure credentials missing" }, { status: 500 });
    }

    // Generate blob name (same logic as your backend)
    const fileExtension = fileName.split(".").pop();
    const uniqueId = Date.now(); // or uuid if you want
    const blobName = `users/${customerNumber}/folders/${folderId}/${uniqueId}.${fileExtension}`;

    const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY);

    const expiresOn = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hour
    const sasToken = generateBlobSASQueryParameters(
        {
            containerName: CONTAINER_NAME,
            blobName,
            permissions: BlobSASPermissions.parse("cw"), // create, write
            expiresOn,
            protocol: SASProtocol.Https,
        },
        sharedKeyCredential
    ).toString();
    //console.log("blob", blobName);
    const url = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`;

    return NextResponse.json({ url, blobName });
}