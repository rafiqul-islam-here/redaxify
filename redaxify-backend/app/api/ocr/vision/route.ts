import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

export async function POST(req: Request) {
    let documentId: number | null = null;

    try {
        const { documentId: docId, imageUrl, textToBlur, matchType = "exact", mode = "highlight" } = await req.json();
        documentId = docId;

        if (!documentId || !imageUrl || (mode !== "extract" && !textToBlur)) {
            return NextResponse.json(
                { error: "documentId, imageUrl, and textToBlur are required unless mode is 'extract'" },
                { status: 400 }
            );
        }

        // ✅ Check if already exists in DB (avoid duplicate processing)
        const existingResult = await prismadb.documentResult.findUnique({
            where: {
                documentResult_compound_unique: {
                    documentId,
                    mode,
                    matchType,
                    textToBlur: textToBlur || ""
                }
            }
        });

        if (existingResult) {
            return NextResponse.json({
                success: true,
                message: "Result fetched from DB",
                data: existingResult.fields
            });
        }

        // ✅ If not found, process with Azure
        const dbDoc = await prismadb.document.findUnique({ where: { id: documentId } });
        if (!dbDoc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        await prismadb.document.update({
            where: { id: documentId },
            data: { indexingStatus: "PROCESSING", updatedAt: new Date() }
        });

        const key = process.env.AZURE_CV_KEY!;
        const endpoint = process.env.AZURE_CV_ENDPOINT!;
        const client = new ComputerVisionClient(
            new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
            endpoint
        );

        // Start Read operation
        const readResult = await client.read(imageUrl);
        const operationId = readResult.operationLocation?.split("/").pop();
        if (!operationId) throw new Error("Failed to get operation ID");

        let status = "notStarted";
        let finalResult: any = null;
        while (status !== "succeeded") {
            await new Promise(r => setTimeout(r, 1000));
            const res = await client.getReadResult(operationId);

            status = typeof res.status === "string" ? res.status.toLowerCase() : "notStarted";
            if (status === "succeeded") {
                if (res.analyzeResult && Array.isArray(res.analyzeResult.readResults)) {
                    finalResult = res.analyzeResult.readResults;
                } else {
                    throw new Error("No analyzeResult or readResults found in response.");
                }
            }
        }

        if (!finalResult) throw new Error("No text detected");

        // ✅ Build result based on mode
        let fullText = "";
        const matchedWords: any[] = [];
        finalResult.forEach((page: any) => {
            if (Array.isArray(page.lines)) {
                page.lines.forEach((line: any) => {
                    if (mode === "extract") {
                        fullText += line.text + "\n";
                    }
                    if (Array.isArray(line.words) && mode !== "extract") {
                        line.words.forEach((word: any) => {
                            let matched = false;
                            if (matchType === "exact") {
                                matched = word.text === textToBlur;
                            } else if (matchType === "case-insensitive") {
                                matched = word.text?.toLowerCase() === textToBlur.toLowerCase();
                            } else if (matchType === "partial") {
                                matched = word.text?.toLowerCase().includes(textToBlur.toLowerCase());
                            } else {
                                matched = word.text?.toLowerCase() === textToBlur.toLowerCase();
                            }
                            if (matched) {
                                matchedWords.push({ text: word.text, boundingBox: word.boundingBox, page: page.page });
                            }
                        });
                    }
                });
            }
        });

        // ✅ Save new result in DB
        const docResult = await prismadb.documentResult.create({
            data: {
                documentId,
                service: "computerVisionRead",
                mode,
                matchType,
                textToBlur: textToBlur || "",
                rawResponse: finalResult as any,
                fields: mode === "extract" ? { fullText } : { matchedWords }
            }
        });

        await prismadb.document.update({
            where: { id: documentId },
            data: { indexingStatus: "INDEXED", indexedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message: mode === "extract" ? "Text extracted successfully" : "Matched words located successfully",
            data: docResult.fields
        });

    } catch (error) {
        console.error("Computer Vision Read API error:", error);

        if (documentId) {
            try {
                await prismadb.document.update({
                    where: { id: documentId },
                    data: { indexingStatus: "FAILED", updatedAt: new Date() }
                });
            } catch (dbError) {
                console.error("Failed to update document status:", dbError);
            }
        }

        return NextResponse.json({
            success: false,
            error: "Document processing failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
