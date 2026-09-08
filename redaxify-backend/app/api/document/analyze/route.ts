import { NextResponse } from "next/server";
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { PrismaClient } from "@prisma/client";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

const MOCK_DOCUMENTS = [{ docType: "mock", fields: {}, confidence: 1 }];

const prisma = new PrismaClient();

// Map incoming type to Azure model IDs
const MODEL_MAP: Record<string, string> = {
    "id-doc": "prebuilt-idDocument",
    "invoice": "prebuilt-invoice",
    // you can add more here later
};

export async function POST(req: Request) {
    let documentId: number | null = null;
    let docType: string | null = null;
    let body: any;

    try {
        body = await req.json();
        documentId = body.documentId;
        const documentUrl: string = body.documentUrl;
        docType = body.service; // e.g. "id-doc" or "invoice"

        if (!documentId || !documentUrl || !docType) {
            return NextResponse.json(
                { success: false, error: "Missing required fields", details: "documentId, documentUrl and docType are required" },
                { status: 400 }
            );
        }

        const modelId = MODEL_MAP[docType];
        if (!modelId) {
            return NextResponse.json(
                { success: false, error: "Invalid docType", details: `Unsupported docType: ${docType}` },
                { status: 400 }
            );
        }

        // Check if already processed
        const existingResult = await prisma.documentAnalysisResult.findFirst({
            where: { documentId, modelId, status: "SUCCESS" },
        });

        if (existingResult) {
            const response = existingResult.response as { documents?: any[] } | null;
            return NextResponse.json({
                success: true,
                message: `Retrieved cached ${docType} processing result`,
                documentId,
                documentsCollected: response?.documents?.length || 0,
                rawResponse: response?.documents || [],
            });
        }

        let documents: any[] | undefined;

        if (MOCK_EXTERNAL_SERVICES) {
            documents = MOCK_DOCUMENTS;
        } else {
            const key = process.env.AZURE_FORM_RECOGNIZER_KEY;
            const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
            if (!key || !endpoint) {
                return NextResponse.json(
                    { success: false, error: "Server configuration error", details: "Azure Form Recognizer credentials are missing" },
                    { status: 500 }
                );
            }

            const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
            const poller = await client.beginAnalyzeDocumentFromUrl(modelId, documentUrl);
            documents = (await poller.pollUntilDone()).documents;
        }

        if (!documents || documents.length === 0) {
            await prisma.documentAnalysisResult.create({
                data: {
                    documentId,
                    modelId,
                    status: "FAILED",
                    response: JSON.parse(JSON.stringify({
                        error: "No data extracted",
                        details: `No data could be extracted from the ${docType}`,
                    })),
                },
            });

            await prisma.document.update({
                where: { id: documentId },
                data: { indexingStatus: "FAILED", indexedAt: new Date() },
            });

            return NextResponse.json(
                { success: false, error: "No data extracted", details: `No data could be extracted from the ${docType}` },
                { status: 400 }
            );
        }

        await prisma.documentAnalysisResult.create({
            data: {
                documentId,
                modelId,
                status: "SUCCESS",
                response: JSON.parse(JSON.stringify({ documents })),
            },
        });

        await prisma.document.update({
            where: { id: documentId },
            data: { indexingStatus: "SUCCESS", indexedAt: new Date() },
        });

        return NextResponse.json({
            success: true,
            message: `${docType} processed successfully`,
            documentId,
            documentsCollected: documents.length,
            rawResponse: documents,
        });
    } catch (error: any) {
        console.error(`Processing error for documentId ${documentId}:`, error);

        let errorMessage = "Document processing failed";
        let errorDetails = error instanceof Error ? error.message : "Unknown error";
        let statusCode = 500;

        if (error.name === "RestError") {
            errorMessage = "Azure Form Recognizer error";
            errorDetails = error.details?.error?.message || error.message;

            if (error.details?.error?.innererror?.code === "InvalidContent") {
                errorDetails = "Could not download the file from the given URL. Ensure it is accessible and valid.";
                statusCode = 400;
            } else if (error.details?.error?.code === "InvalidRequest") {
                errorDetails = "Invalid request to Azure Form Recognizer. Check document format.";
                statusCode = 400;
            } else if (error.details?.error?.code === "UnsupportedMediaType") {
                errorDetails = "Unsupported file format. Use PDF, PNG, JPEG, or TIFF.";
                statusCode = 400;
            } else if (error.details?.error?.code === "ModelNotFound") {
                errorDetails = "The requested model was not found for your resource. Check your resource and region.";
                statusCode = 400;
            }
        }

        await prisma.documentAnalysisResult.create({
            data: {
                documentId: documentId!,
                modelId: MODEL_MAP[docType ?? ""] || "unknown",
                status: "FAILED",
                response: JSON.parse(JSON.stringify({
                    error: errorMessage,
                    details: errorDetails,
                })),
            },
        });

        await prisma.document.update({
            where: { id: documentId! },
            data: { indexingStatus: "FAILED", indexedAt: new Date() },
        });

        return NextResponse.json(
            { success: false, error: errorMessage, details: errorDetails, documentId },
            { status: statusCode }
        );
    } finally {
        await prisma.$disconnect();
    }
}
