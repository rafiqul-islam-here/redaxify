// src/app/api/azure/read-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";

// simple in-memory cache (resets when server restarts)
const urlCache: Record<string, { url: string; expiresAt: number }> = {};

export async function POST(req: NextRequest) {
    const { blobName } = await req.json();

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

    const now = Date.now();

    // ✅ Check cache
    if (urlCache[blobName] && urlCache[blobName].expiresAt > now) {
        //console.log("✅ Returning cached URL for:", blobName);
        return NextResponse.json({ url: urlCache[blobName].url });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT,
        AZURE_STORAGE_KEY
    );

    // 1 hour expiry
    const expiresOn = new Date(now + 60 * 60 * 1000);

    const readSasToken = generateBlobSASQueryParameters(
        {
            containerName: CONTAINER_NAME,
            blobName,
            permissions: BlobSASPermissions.parse("r"),
            expiresOn,
            protocol: SASProtocol.Https,
        },
        sharedKeyCredential
    ).toString();

    const readUrl = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${readSasToken}`;

    // ✅ Save in cache
    urlCache[blobName] = {
        url: readUrl,
        expiresAt: now + 60 * 60 * 1000, // cache for 1 hour
    };

    //console.log("🆕 Generated new SAS URL for:", blobName);

    const response = NextResponse.json({ url: readUrl });
    response.headers.set("Cache-Control", "public, max-age=3600, immutable");

    return response;
}
