"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Image from "next/image";
import InvoiceDetails from "./InvoiceDetails";
import IdDocumentDetails from "./IdDocumentDetails";
import DrivingLicenseDetails from "./DrivingLicenseDetails";
import PassportDetails from "./PassportDetails";
import ResidencePermitDetails from "./ResidencePermitDetails";


type DocumentViewerProps = {
    documentUrl: string;
    documentName: string;
    documentId: number;
    service: string;
};

type TableCell = {
    content: string;
    rowIndex: number;
    columnIndex: number;
    row?: number;
    col?: number;
};

type Table = {
    rowCount: number;
    columnCount: number;
    cells: TableCell[];
};

interface FieldValue {
    kind?: string;
    content?: string;
    value?: any;
    valueDate?: Date;
    confidence?: number;
    properties?: { [key: string]: FieldValue };
    values?: FieldValue[];
    boundingRegions?: any[];
    spans?: any[];
}

interface DocumentResult {
    docType?: string; // <-- fix: allow docType for type check
    fields?: { [key: string]: FieldValue };
    tables?: Table[];
}

const extensionMimeMap: { [ext: string]: string } = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    bmp: "image/bmp",
    tiff: "image/tiff",
    heif: "image/heif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
};

function getExtension(filename: string) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getMimeType(filename: string): string {
    const ext = getExtension(filename);
    return extensionMimeMap[ext] || "";
}

const isPDF = (mime: string) => mime === "application/pdf";
const isImage = (mime: string) =>
    ["image/jpeg", "image/png", "image/bmp", "image/tiff", "image/heif"].includes(mime);
const isWord = (mime: string) =>
    ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mime);
const isExcel = (mime: string) =>
    ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(mime);
const isPowerPoint = (mime: string) =>
    ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"].includes(mime);
const isText = (mime: string) => mime === "text/plain";

const PDFViewer: React.FC<{ url: string; name: string }> = ({ url, name }) => (
    <iframe
        src={url}
        title={name}
        className="w-full h-[60vh] border rounded-lg bg-white"
    />
);

const ImageViewer: React.FC<{ url: string; name: string }> = ({ url, name }) => (
    <div className="w-full h-[60vh] flex items-center justify-center bg-[#191936] rounded-lg overflow-auto relative">
        <Image
            src={url}
            alt={name}
            fill
            style={{ objectFit: "contain" }}
            sizes="100vw"
        />
    </div>
);

const WordViewer: React.FC<{ url: string; name: string }> = ({ url, name }) => (
    <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        title={name}
        className="w-full h-[60vh] border rounded-lg bg-white"
    />
);

const ExcelViewer: React.FC<{ data: any[][] | null }> = ({ data }) => (
    <div className="w-full h-[60vh] overflow-auto border rounded-lg p-4 bg-white">
        {data === null ? (
            <p className="text-red-600">Failed to load Excel file.</p>
        ) : (
            <table className="border-collapse border border-gray-300 w-full">
                <tbody>
                    {data.map((row: any[], i: number) => (
                        <tr key={i}>
                            {row.map((cell: any, j: number) => (
                                <td key={j} className="border border-gray-300 p-2 text-sm">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);

const PowerPointViewer: React.FC<{ url: string; name: string }> = ({ url, name }) => (
    <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        title={name}
        className="w-full h-[60vh] border rounded-lg bg-white"
    />
);

const TextViewer: React.FC<{ content: string | null }> = ({ content }) => (
    <div className="w-full h-[60vh] bg-[#191936] rounded-lg p-4 overflow-y-auto text-white font-mono text-sm">
        {content ?? "Failed to load text file."}
    </div>
);

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentUrl, documentName, documentId, service }) => {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [excelData, setExcelData] = useState<any[][] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processError, setProcessError] = useState<string | null>(null);
    const [indexingResults, setIndexingResults] = useState<DocumentResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mimeType = getMimeType(documentName);

    useEffect(() => {
        const fetchSignedUrl = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/azure/read-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ blobName: documentUrl }),
                });
                if (!res.ok) throw new Error("Failed to fetch read URL");
                const { url } = await res.json();
                console.log("Fetched signed URL:", url);
                setSignedUrl(url);
            } catch (err) {
                console.error(err);
                setProcessError("Failed to fetch document URL. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSignedUrl();
    }, [documentUrl]);

    useEffect(() => {
        if (!signedUrl) return;

        if (isText(mimeType)) {
            fetch(signedUrl)
                .then((res) => res.text())
                .then(setTextContent)
                .catch(() => setTextContent("Failed to load text file."));
        }

        if (isExcel(mimeType)) {
            fetch(signedUrl)
                .then((res) => res.arrayBuffer())
                .then((data) => {
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    setExcelData(jsonData);
                })
                .catch(() => setExcelData([["Failed to load Excel file."]]));
        }
    }, [signedUrl, mimeType]);

    const handleProcessDocument = async () => {
        if (!signedUrl) {
            setProcessError("Document URL not available.");
            return;
        }

        setIsProcessing(true);
        setProcessError(null);
        setIndexingResults(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/document/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId,
                    documentUrl: signedUrl,
                    service: service,
                }),
            });

            const data = await res.json();

            console.log("Processing response:", data);

            setIsProcessing(false);

            if (!res.ok || !data.success) {
                setProcessError(data.error || data.details || "Failed to process document.");
                return;
            }

            setIndexingResults(data.rawResponse || []);
        } catch (err: any) {
            console.error(err);
            setProcessError(err?.message || "Failed to process document.");
            setIsProcessing(false);
        }
    };

    const renderKeyValuePair = (key: string, value: FieldValue | any, nestedLevel: number = 0) => {
        if (value === null || value === undefined) {
            return (
                <div key={key} className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} min-w-[200px] max-w-[300px]`}>
                    <span className="text-gray-400 text-sm">{key}</span>
                    <p className="font-medium text-white">N/A</p>
                </div>
            );
        }

        if (Array.isArray(value.values)) {
            return (
                <div key={key} className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} min-w-[200px] max-w-[300px]`}>
                    <span className="text-gray-400 text-sm">{key}</span>
                    <div className="mt-2">
                        {value.values.map((item: FieldValue, idx: number) => (
                            <div key={idx} className="ml-4">
                                {renderKeyValuePair(`Item ${idx + 1}`, item, nestedLevel + 1)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (typeof value === "object" && value !== null && !value.kind) {
            return (
                <div key={key} className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} min-w-[200px] max-w-[300px]`}>
                    <span className="text-gray-400 text-sm font-semibold">{key}</span>
                    <div className="mt-2">
                        {Object.entries(value).map(([subKey, subValue]) =>
                            renderKeyValuePair(subKey, subValue, nestedLevel + 1)
                        )}
                    </div>
                </div>
            );
        }

        let displayValue: any = value.value ?? value.content ?? value;
        if (value.valueDate instanceof Date) {
            displayValue = value.valueDate.toLocaleDateString();
        } else if (typeof displayValue === "object") {
            displayValue = JSON.stringify(displayValue, null, 2);
        } else if (typeof displayValue === "number") {
            displayValue = displayValue.toFixed(2);
        }

        return (
            <div key={key} className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} min-w-[200px] max-w-[300px]`}>
                <span className="text-gray-400 text-sm">{key}</span>
                <p className="font-medium text-white whitespace-pre-wrap">{displayValue ?? "N/A"}</p>
            </div>
        );
    };

    const renderTable = (table: Table, title: string, idx: number) => (
        <div key={idx} className="mt-4">
            <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
            <div className="overflow-x-auto">
                <table className="border-collapse border border-gray-300 w-full bg-[#23234a] text-white">
                    <tbody>
                        {Array.from({ length: table.rowCount }, (_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: table.columnCount }, (_, colIndex) => {
                                    const cell = table.cells.find(
                                        (c) => c.rowIndex === rowIndex && c.columnIndex === colIndex
                                    );
                                    return (
                                        <td key={colIndex} className="border border-gray-300 p-2 text-sm">
                                            {cell?.content ?? ""}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderIndexingResults = () => {
        if (!indexingResults || indexingResults.length === 0) {
            return <div className="text-gray-400">No data extracted from the document.</div>;
        }

        return indexingResults.map((doc, idx) => {
            const fields = doc.fields || {};
            const tables = doc.tables || [];

            // Fix: Now docType exists on DocumentResult
            if (doc.docType === "invoice") {
                return (
                    <div key={idx} className="mb-6">
                        <InvoiceDetails response={doc as any} />
                    </div>
                );
            }

            if (doc.docType === "idDocument.nationalIdentityCard") {
                return (
                    <div key={idx} className="mb-6">
                        <IdDocumentDetails response={doc as any} />
                    </div>
                );
            }

            if (doc.docType === "idDocument.driverLicense") {
                return (
                    <div key={idx} className="mb-6">
                        <DrivingLicenseDetails response={doc as any} />
                    </div>
                );
            }

            if (doc.docType === "idDocument.passport") {
                return (
                    <div key={idx} className="mb-6">
                        <PassportDetails response={doc as any} />
                    </div>
                );
            }

            if (doc.docType === "idDocument.residencePermit") {
                return (
                    <div key={idx} className="mb-6">
                        <ResidencePermitDetails response={doc as any} />
                    </div>
                );
            }

            return (
                <div key={idx} className="bg-[#191936] p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Document - {service}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                        {Object.entries(fields).map(([key, value]) =>
                            key !== "kind" &&
                                key !== "boundingRegions" &&
                                key !== "spans" &&
                                key !== "confidence" // skip confidence
                                ? renderKeyValuePair(key, value)
                                : null
                        )}
                    </div>

                    {tables.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white mb-3">Tables</h3>
                            {tables.map((table: Table, tableIdx: number) =>
                                renderTable(table, `Table ${tableIdx + 1}`, tableIdx)
                            )}
                        </div>
                    )}
                </div>
            );
        });
    };

    const renderViewer = () => {
        if (isLoading) {
            return (
                <div className="w-full h-[60vh] flex items-center justify-center text-white bg-[#191936] rounded-lg">
                    <svg className="animate-spin h-8 w-8 text-white mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading document...
                </div>
            );
        }

        if (!signedUrl) {
            return (
                <div className="w-full h-[60vh] flex items-center justify-center text-red-600 bg-[#191936] rounded-lg">
                    Failed to load document.
                </div>
            );
        }

        if (isPDF(mimeType)) return <PDFViewer url={signedUrl} name={documentName} />;
        if (isImage(mimeType)) return <ImageViewer url={signedUrl} name={documentName} />;
        if (isWord(mimeType)) return <WordViewer url={signedUrl} name={documentName} />;
        if (isExcel(mimeType)) return <ExcelViewer data={excelData} />;
        if (isPowerPoint(mimeType)) return <PowerPointViewer url={signedUrl} name={documentName} />;
        if (isText(mimeType)) return <TextViewer content={textContent} />;

        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-red-600 bg-[#191936] rounded-lg">
                Unsupported file type.
            </div>
        );
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {renderViewer()}

            <div className="mt-4 bg-[#191936] p-4 rounded-lg shadow">
                <div className="flex items-center justify-end gap-4">
                    <button
                        className={`px-4 py-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white rounded-full text-sm flex items-center justify-center gap-2 ${isProcessing || !signedUrl ? "opacity-70 cursor-not-allowed" : ""}`}
                        onClick={handleProcessDocument}
                        disabled={isProcessing || !signedUrl}
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                    />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            "Process Document"
                        )}
                    </button>

                </div>
            </div>

            {processError && (
                <div className="mt-4 mb-4 p-4 bg-red-600 text-white rounded-lg">{processError}</div>
            )}

            {indexingResults && (
                <div className="mt-8">{renderIndexingResults()}</div>
            )}
        </div>
    );
};

export default DocumentViewer;