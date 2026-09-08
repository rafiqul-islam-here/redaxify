"use client";
import React from "react";
import CopyButton from "./ui/CopyButton"; // adjust path

interface FieldValue {
    kind?: string;
    content?: string;
    value?: any;
    confidence?: number;
}

interface IdDocumentResponse {
    fields: {
        [key: string]: FieldValue;
    };
}

function formatDate(dateString?: string) {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString!;
    }
}

function formatField(key: string, value: FieldValue | undefined): string {
    if (!value) return "";
    if (value.kind === "date") {
        return formatDate(value.value);
    }
    return value.value ?? value.content ?? "";
}

function getStructuredText(fields: { [key: string]: FieldValue }): string {
    const keys = [
        "FirstName",
        "LastName",
        "Sex",
        "Height",
        "DateOfBirth",
        "PlaceOfBirth",
        "DocumentNumber",
        "PersonalNumber",
        "DateOfIssue",
        "DateOfExpiration",
        "DocumentDiscriminator"
    ];
    return keys
        .filter(k => fields[k])
        .map(k => {
            const v = fields[k];
            const val = formatField(k, v);
            return `${k}: ${val}`;
        })
        .join("\n");
}

const IdDocumentDetails: React.FC<{ response: IdDocumentResponse }> = ({
    response
}) => {
    const fields = response.fields;

    const displayOrder = [
        { key: "FirstName", label: "First Name" },
        { key: "LastName", label: "Last Name" },
        { key: "Sex", label: "Sex" },
        { key: "Height", label: "Height (cm)" },
        { key: "DateOfBirth", label: "Date of Birth" },
        { key: "PlaceOfBirth", label: "Place of Birth" },
        { key: "DocumentNumber", label: "Document Number" },
        { key: "PersonalNumber", label: "Personal Number" },
        { key: "DateOfIssue", label: "Date of Issue" },
        { key: "DateOfExpiration", label: "Date of Expiration" },
        { key: "DocumentDiscriminator", label: "Document Discriminator" }
    ];

    return (
        <div className="bg-[#23234a] rounded-lg p-6 shadow flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white mb-4">
                National Identity Card
            </h2>

            {/* Copy All */}
            <div className="flex justify-end mb-2">
                <CopyButton
                    text={getStructuredText(fields)}
                    className="px-3 py-2 text-sm flex items-center gap-2"
                    label="Copy All"
                />
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displayOrder.map(({ key, label }) =>
                    fields[key] ? (
                        <div
                            key={key}
                            className="bg-[#191936] p-3 rounded flex flex-col gap-2 relative"
                        >
                            <span className="text-gray-400 text-sm">{label}</span>
                            <span className="font-medium text-white break-words">
                                {formatField(key, fields[key])}
                            </span>

                            <CopyButton
                                text={formatField(key, fields[key])}
                                className="absolute top-2 right-2"
                            />

                            {fields[key]?.confidence !== undefined && (
                                <span className="absolute bottom-2 right-2 text-xs text-gray-500">
                                    Conf: {fields[key]?.confidence?.toFixed(2)}
                                </span>
                            )}
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
};

export default IdDocumentDetails;
