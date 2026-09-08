import { NextResponse } from "next/server";
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { PrismaClient } from "@prisma/client";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

const MOCK_DOCUMENTS = [{ docType: "mock", fields: {}, confidence: 1 }];

const prisma = new PrismaClient();

const getString = (field: any): string | null =>
    field && typeof field.valueString === "string" ? field.valueString : null;

const getNumber = (field: any): number | null =>
    field && typeof field.valueNumber === "number" ? field.valueNumber : null;

const getDate = (field: any): Date | null =>
    field && field.valueDate instanceof Date ? field.valueDate : null;

const usTaxModelMap: Record<string, string> = {
    "w2": "prebuilt-tax.us.w2",
    "1098": "prebuilt-tax.us.1098",
    "1098e": "prebuilt-tax.us.1098E",
    "1098t": "prebuilt-tax.us.1098T",
};

// Helper function to get supported tax form types
const getSupportedTaxFormTypes = (): string[] => {
    return Object.keys(usTaxModelMap);
};

export async function POST(req: Request) {
    let documentId: number | null = null;

    try {
        const body = await req.json();
        documentId = body.documentId;
        const documentUrl: string = body.documentUrl;
        const taxFormType: string = body.taxFormType || "w2";

        if (!documentId || !documentUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields",
                    details: "documentId and documentUrl are required",
                    supportedFormTypes: getSupportedTaxFormTypes(),
                },
                { status: 400 }
            );
        }

        // Validate tax form type
        const normalizedFormType = taxFormType.toLowerCase();
        if (!usTaxModelMap[normalizedFormType]) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unsupported tax form type",
                    details: `Tax form type '${taxFormType}' is not supported`,
                    supportedFormTypes: getSupportedTaxFormTypes(),
                },
                { status: 400 }
            );
        }

        // Check if a successful response already exists in the database
        const existingResult = await prisma.documentAnalysisResult.findFirst({
            where: {
                documentId,
                modelId: usTaxModelMap[normalizedFormType],
                status: "SUCCESS",
            },
        });

        if (existingResult) {
            return NextResponse.json({
                success: true,
                message: `Retrieved cached ${taxFormType.toUpperCase()} processing result`,
                formType: taxFormType,
                documentsCollected: existingResult.response.documents?.length || 0,
                rawResponse: existingResult.response.documents || [],
            });
        }

        const modelId = usTaxModelMap[normalizedFormType];
        let documents: any[] | undefined;

        if (MOCK_EXTERNAL_SERVICES) {
            documents = MOCK_DOCUMENTS;
        } else {
            const key = process.env.AZURE_FORM_RECOGNIZER_KEY;
            const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;

            if (!key || !endpoint) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Server configuration error",
                        details: "Azure Form Recognizer credentials are missing",
                    },
                    { status: 500 }
                );
            }

            const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
            const poller = await client.beginAnalyzeDocumentFromUrl(modelId, documentUrl);
            documents = (await poller.pollUntilDone()).documents;
        }

        if (!documents || documents.length === 0) {
            // Save failed result to database
            await prisma.documentAnalysisResult.create({
                data: {
                    documentId,
                    modelId,
                    status: "FAILED",
                    response: {
                        error: "No data extracted",
                        details: `No tax data could be extracted from the ${taxFormType.toUpperCase()} document`,
                    },
                },
            });

            await prisma.document.update({
                where: { id: documentId },
                data: {
                    indexingStatus: "FAILED",
                    indexedAt: new Date(),
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    error: "No data extracted",
                    details: `No tax data could be extracted from the ${taxFormType.toUpperCase()} document`,
                    formType: taxFormType,
                },
                { status: 400 }
            );
        }

        // Save successful result to database
        await prisma.documentAnalysisResult.create({
            data: {
                documentId,
                modelId,
                status: "SUCCESS",
                response: { documents },
            },
        });

        await prisma.document.update({
            where: { id: documentId },
            data: {
                indexingStatus: "SUCCESS",
                indexedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: `${taxFormType.toUpperCase()} tax document processed successfully`,
            formType: taxFormType,
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
                errorDetails = "Could not download the file from the given URL. Please ensure the URL is accessible and points to a valid document.";
                statusCode = 400;
            } else if (error.details?.error?.code === "InvalidRequest") {
                errorDetails = "Invalid request to Azure Form Recognizer. Please check the document format and try again.";
                statusCode = 400;
            } else if (error.details?.error?.code === "UnsupportedMediaType") {
                errorDetails = "Unsupported file format. Please upload a PDF, PNG, JPEG, or TIFF file.";
                statusCode = 400;
            }
        }

        // Save failed result to database
        await prisma.documentAnalysisResult.create({
            data: {
                documentId,
                modelId: usTaxModelMap[taxFormType.toLowerCase()] || "unknown",
                status: "FAILED",
                response: { error: errorMessage, details: errorDetails },
            },
        });

        await prisma.document.update({
            where: { id: documentId },
            data: {
                indexingStatus: "FAILED",
                indexedAt: new Date(),
            },
        });

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: errorDetails,
                documentId,
                supportedFormTypes: getSupportedTaxFormTypes(),
            },
            { status: statusCode }
        );
    } finally {
        await prisma.$disconnect();
    }
}