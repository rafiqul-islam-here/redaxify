// lib/azureBlob.ts
import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

export async function deleteBlob(blobName: string) {
    if (!blobName) return false;

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            AZURE_CONNECTION_STRING
        );
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const result = await blockBlobClient.deleteIfExists();
        return result.succeeded; // true if deleted, false if blob didn't exist
    } catch (error) {
        console.error("[AZURE_BLOB_DELETE_ERROR]", error);
        return false;
    }
}
