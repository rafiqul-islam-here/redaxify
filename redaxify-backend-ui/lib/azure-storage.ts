import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

export interface AzureUploadResult {
    url: string;
    blobName: string;
    container: string;
}

export async function uploadVideoToAzure(
    file: File,
    customerNumber: number,
    folderId: number // <-- use folderId, not folderName
): Promise<AzureUploadResult> {
    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

    if (!AZURE_CONNECTION_STRING) {
        throw new Error("Azure Storage connection string not configured");
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
        access: "blob",
    });

    // Generate unique filename with folder structure
    const fileExtension = file.name.split(".").pop();
    const uniqueId = uuidv4();
    const blobName = `users/${customerNumber}/folders/${folderId}/${uniqueId}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file to Azure
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResponse = await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: file.type },
    });

    if (uploadResponse.errorCode) {
        throw new Error(`Azure upload failed: ${uploadResponse.errorCode}`);
    }

    console.log(`File uploaded to Azure: ${blobName}`);

    return {
        url: blockBlobClient.url,
        blobName,
        container: CONTAINER_NAME,
    };
}
