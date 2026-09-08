"use client";
import React from "react";
import CopyButton from "./ui/CopyButton"; 

interface FieldValue {
    kind?: string;
    content?: string;
    value?: any;
    confidence?: number;
}

interface DrivingLicenseResponse {
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
    if (key === "Address" && typeof value.value === "object") {
        return value.value.streetAddress
            ? `${value.value.streetAddress}, ${value.value.city}, ${value.value.state} ${value.value.postalCode}`
            : value.content ?? "";
    }
    return value.value ?? value.content ?? "";
}

function getStructuredText(fields: { [key: string]: FieldValue }): string {
    const keys = [
        "FirstName",
        "LastName",
        "Sex",
        "Height",
        "Weight",
        "EyeColor",
        "HairColor",
        "DateOfBirth",
        "DateOfExpiration",
        "DocumentNumber",
        "VehicleClassifications",
        "Endorsements",
        "Restrictions",
        "Address",
        "Region",
        "CountryRegion"
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

const DrivingLicenseDetails: React.FC<{ response: DrivingLicenseResponse }> = ({
    response
}) => {
    const fields = response.fields;

    const displayOrder = [
        { key: "FirstName", label: "First Name" },
        { key: "LastName", label: "Last Name" },
        { key: "Sex", label: "Sex" },
        { key: "Height", label: "Height" },
        { key: "Weight", label: "Weight" },
        { key: "EyeColor", label: "Eye Color" },
        { key: "HairColor", label: "Hair Color" },
        { key: "DateOfBirth", label: "Date of Birth" },
        { key: "DateOfExpiration", label: "Date of Expiration" },
        { key: "DocumentNumber", label: "Document Number" },
        { key: "VehicleClassifications", label: "Vehicle Classifications" },
        { key: "Endorsements", label: "Endorsements" },
        { key: "Restrictions", label: "Restrictions" },
        { key: "Address", label: "Address" },
        { key: "Region", label: "Region" },
        { key: "CountryRegion", label: "Country / Region" }
    ];

    return (
        <div className="bg-[#23234a] rounded-lg p-6 shadow flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white mb-4">Driving License</h2>

            {/* Copy All Button */}
            <div className="flex justify-end mb-2">
                <CopyButton
                    text={getStructuredText(fields)}
                    className="px-3 py-2 text-sm flex items-center gap-2"
                    label="Copy All"
                />
            </div>

            {/* Field Cards */}
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

export default DrivingLicenseDetails;
