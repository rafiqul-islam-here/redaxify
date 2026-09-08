// src/app/api/azure/sas/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";

export async function POST(req: NextRequest) {
    const { fileName, folderId, customerNumber } = await req.json();

    const AZURE_STORAGE_ACCOUNT =
        process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/AccountName=([^;]+)/)?.[1];
    const AZURE_STORAGE_KEY =
        process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/AccountKey=([^;]+)/)?.[1];
    const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "documents";

    if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY) {
        return NextResponse.json(
            { error: "Azure credentials missing" },
            { status: 500 }
        );
    }

    const fileExtension = fileName.split(".").pop();
    const uniqueId = Date.now();
    const blobName = `users/${customerNumber}/folders/${folderId}/${uniqueId}.${fileExtension}`;

    const sharedKeyCredential = new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT,
        AZURE_STORAGE_KEY
    );

    const expiresOn = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hour

    // Upload SAS (create+write)
    const uploadSasToken = generateBlobSASQueryParameters(
        {
            containerName: CONTAINER_NAME,
            blobName,
            permissions: BlobSASPermissions.parse("cw"),
            expiresOn,
            protocol: SASProtocol.Https,
        },
        sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${uploadSasToken}`;

    return NextResponse.json({ blobName, uploadUrl });
}
