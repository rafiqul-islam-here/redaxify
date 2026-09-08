"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import CopyButton from "@/components/ui/CopyButton";

type TaxDocumentViewerProps = {
    documentUrl: string;
    documentName: string;
    documentId: number;
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
    fields?: { [key: string]: FieldValue };
    tables?: Table[];
}

const usTaxOptions = [
    { value: "w2", label: "W-2" },
    { value: "1098", label: "1098" },
    { value: "1098e", label: "1098-E" },
    { value: "1098t", label: "1098-T" },
];

const extensionMimeMap: { [ext: string]: string } = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
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
    ["image/png", "image/jpeg", "image/gif", "image/bmp", "image/webp"].includes(mime);

const TaxDocumentViewer: React.FC<TaxDocumentViewerProps> = ({ documentUrl, documentName, documentId }) => {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processError, setProcessError] = useState<string | null>(null);
    const [indexingResults, setIndexingResults] = useState<DocumentResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaxForm, setSelectedTaxForm] = useState<string>("w2");

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

    const handleProcessDocument = async () => {
        if (!signedUrl) {
            setProcessError("Document URL not available.");
            return;
        }

        if (!selectedTaxForm) {
            setProcessError("Please select a tax form type.");
            return;
        }

        setIsProcessing(true);
        setProcessError(null);
        setIndexingResults(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/document/us-tax`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId,
                    documentUrl: signedUrl,
                    taxFormType: selectedTaxForm,
                }),
            });

            const data = await res.json();
            setIsProcessing(false);

            if (!res.ok || !data.success) {
                setProcessError(data.error || data.details || "Failed to start indexing");
                return;
            }

            setIndexingResults(data.rawResponse || []);
        } catch (err: any) {
            console.error(err);
            setProcessError(err?.message || "Failed to process document.");
            setIsProcessing(false);
        }
    };

    function flattenFields(fields: { [key: string]: FieldValue }, prefix = ""): string {
        let result = "";
        Object.entries(fields).forEach(([key, value]) => {
            if (key === "kind" || key === "boundingRegions" || key === "spans") return;
            let displayValue: any = value?.value ?? value?.content ?? value;
            if (value?.valueDate instanceof Date) {
                displayValue = value.valueDate.toLocaleDateString();
            } else if (typeof displayValue === "number") {
                displayValue = displayValue.toFixed(2);
            }
            if (value?.kind === "address" && value?.value && typeof value.value === 'object' && !Array.isArray(value.value)) {
                result += `${prefix}${key}: ${value.content || "N/A"}\n`;
                result += flattenFields(value.value as { [key: string]: FieldValue }, prefix + "  ");
            } else if (
                (value?.kind === "object" || (typeof value === "object" && !Array.isArray(value) && value !== null && !value?.kind))
                && typeof (value.properties ?? value) === 'object' && !Array.isArray(value.properties ?? value)
            ) {
                result += `${prefix}${key}:\n`;
                result += flattenFields((value.properties ?? value) as { [key: string]: FieldValue }, prefix + "  ");
            } else if (value?.kind === "array" && Array.isArray(value.values)) {
                value.values.forEach((item, idx) => {
                    result += `${prefix}${key} [${idx + 1}]:\n`;
                    result += flattenFields((item.properties ?? item) as { [key: string]: FieldValue }, prefix + "    ");
                });
            } else {
                result += `${prefix}${key}: ${displayValue ?? "N/A"}\n`;
            }
        });
        return result;
    }

    const renderKeyValuePair = (key: string, value: FieldValue, nestedLevel: number = 0) => {
        if (value === null || value === undefined) {
            return (
                <div className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} flex justify-between items-center`}>
                    <div>
                        <span className="text-gray-400 text-sm">{key}</span>
                        <p className="font-medium text-white">N/A</p>
                    </div>
                    <CopyButton text={`${key}: N/A`} />
                </div>
            );
        }

        if (value.kind === "address") {
            return (
                <div className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">{key}</span>
                        <CopyButton text={`${key}: ${value.content || "N/A"}`} />
                    </div>
                    <p className="font-medium text-white">{value.content || "N/A"}</p>
                    {value.value && (
                        <div className="mt-2">
                            {Object.entries(value.value).map(([subKey, subValue]) => (
                                <div key={subKey} className="ml-4">
                                    {renderKeyValuePair(subKey, subValue as FieldValue, nestedLevel + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (value.kind === "object" || (typeof value === "object" && !Array.isArray(value) && !value.kind)) {
            return (
                <div className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4}`}>
                    <span className="text-gray-400 text-sm font-semibold">{key}</span>
                    <div className="mt-2">
                        {Object.entries(value.properties || value).map(([subKey, subValue]) => (
                            subKey !== "kind" && subKey !== "boundingRegions" && subKey !== "spans" && (
                                <div key={subKey} className="ml-4">
                                    {renderKeyValuePair(subKey, subValue as FieldValue, nestedLevel + 1)}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            );
        }

        if (value.kind === "array") {
            return (
                <div className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4}`}>
                    <span className="text-gray-400 text-sm font-semibold">{key}</span>
                    <div className="mt-2">
                        {value.values?.map((item: FieldValue, idx: number) => (
                            <div key={idx} className="ml-4">
                                <span className="text-gray-300 text-sm">Item {idx + 1}</span>
                                {Object.entries(item.properties || item).map(([subKey, subValue]) => (
                                    subKey !== "kind" && subKey !== "boundingRegions" && subKey !== "spans" && (
                                        <div key={subKey} className="ml-4">
                                            {renderKeyValuePair(subKey, subValue as FieldValue, nestedLevel + 1)}
                                        </div>
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        let displayValue = value.value ?? value.content ?? value;
        if (value.valueDate instanceof Date) {
            displayValue = value.valueDate.toLocaleDateString();
        } else if (typeof displayValue === "number") {
            displayValue = displayValue.toFixed(2);
        }

        return (
            <div className={`p-3 bg-[#23234a] rounded mb-2 pl-${nestedLevel * 4} flex justify-between items-center`}>
                <div>
                    <span className="text-gray-400 text-sm">{key}</span>
                    <p className="font-medium text-white">{displayValue ?? "N/A"}</p>
                </div>
                <CopyButton text={`${key}: ${displayValue ?? "N/A"}`} />
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

            return (
                <div key={idx} className="bg-[#191936] p-6 rounded-lg shadow mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">
                            Document {idx + 1} - {selectedTaxForm.toUpperCase()}
                        </h2>
                        <CopyButton
                            text={flattenFields(fields)}
                            className="px-4 py-2 text-sm"
                            label="Copy All"
                            copiedLabel="Copied All!"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                        {Object.entries(fields).map(([key, value]) => (
                            key !== "kind" && key !== "boundingRegions" && key !== "spans" && (
                                <div key={key} className="flex">
                                    {renderKeyValuePair(key, value as FieldValue)}
                                </div>
                            )
                        ))}
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

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {isLoading && (
                <div className="w-full h-[60vh] flex items-center justify-center text-white bg-[#191936] rounded-lg">
                    <svg className="animate-spin h-8 w-8 text-white mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading document...
                </div>
            )}

            {!isLoading && isPDF(mimeType) && signedUrl && (
                <iframe
                    src={signedUrl}
                    title={documentName}
                    className="w-full h-[60vh] border rounded-lg bg-white"
                />
            )}
            {!isLoading && isImage(mimeType) && signedUrl && (
                <div className="w-full h-[60vh] border rounded-lg bg-white flex items-center justify-center overflow-auto">
                    <Image
                        src={signedUrl}
                        alt={documentName}
                        width={800}
                        height={600}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
            {!isLoading && !isPDF(mimeType) && !isImage(mimeType) && (
                <div className="w-full h-[60vh] flex items-center justify-center text-red-600 bg-[#191936] rounded-lg">
                    Unsupported file type. Please upload a PDF or image file.
                </div>
            )}

            <div className="mt-4 bg-[#191936] p-4 rounded-lg shadow">
                <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="taxFormSelect"
                            className="text-white text-sm whitespace-nowrap"
                        >
                            Select Tax Type
                        </label>
                        <select
                            id="taxFormSelect"
                            className="px-4 py-2 rounded border bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#335FFF]"
                            value={selectedTaxForm}
                            onChange={(e) => setSelectedTaxForm(e.target.value)}
                            required
                        >
                            <option value="">Select Tax Form</option>
                            {usTaxOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

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

            <div className="mt-8">{renderIndexingResults()}</div>
        </div>
    );
};

export default TaxDocumentViewer;
