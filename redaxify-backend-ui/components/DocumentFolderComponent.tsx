"use client";

import { useState } from "react";
import { Folder, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Document, Video } from "@/lib/types";

type FolderContentType = "document" | "video" | "audio" | "ocr" | "us-tax" | "invoice" | "identity";

interface DocumentFolderProps {
    folderName: string;
    folderId: number;
    type: FolderContentType;
    documents?: Document[];
    videos?: Video[];
    onUpload?: (file: File) => void;
    onSelectDocument?: (doc: Document) => void;
    onSelectVideo?: (video: Video) => void;
    onDeleteFolder?: (folderId: number) => void;
    onDeleteFile?: (fileId: number, customerId: string) => void;
    selectedDocument?: number | null;
    selectedVideo?: string | null;
    isDeleting?: boolean;
    customerId?: string | number;
}

const DocumentFolderComponent = ({
    folderName,
    folderId,
    type,
    documents = [],
    videos = [],
    onUpload,
    onSelectDocument,
    onSelectVideo,
    onDeleteFolder,
    onDeleteFile,
    selectedDocument,
    selectedVideo,
    isDeleting = false,
    customerId = "",
}: DocumentFolderProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
            event.target.value = "";
        }
    };

    const items = type === "video" ? videos : documents;

    return (
        <div className={`mb-2 transition-all duration-200 ${isDeleting ? "opacity-60" : ""}`}>
            <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-t from-[#1b1e3b] to-[#292d5c] shadow-md shadow-black/30 ${isDeleting ? "cursor-not-allowed" : "cursor-pointer hover:brightness-105"
                    }`}
                onClick={() => !isDeleting && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Folder className={`w-5 h-5 shrink-0 ${isDeleting ? "text-gray-500" : "text-blue-500"}`} />
                    <div className="relative min-w-0">
                        <span
                            className={`font-medium block truncate max-w-[110px] ${isDeleting ? "text-gray-400" : "text-white"}`}
                            title={folderName}
                        >
                            {folderName}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isDeleting && confirm(`Delete "${folderName}"?`)) onDeleteFolder?.(folderId);
                        }}
                        className={`p-1.5 rounded-lg flex items-center justify-center w-8 h-8 ${isDeleting ? "bg-gray-600 cursor-not-allowed" : "bg-gray-700 hover:bg-red-700"
                            }`}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <div className="loading loading-spinner loading-xs text-gray-400"></div>
                        ) : (
                            <Trash2 className="w-4 h-4 text-white" />
                        )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`file-input-${folderId}`)?.click();
                        }}
                        className={`p-1.5 rounded-lg flex items-center justify-center w-8 h-8 ${isDeleting ? "bg-gray-600 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600"
                            }`}
                        disabled={isDeleting}
                        title={`Add ${type}`}
                    >
                        <Plus className="w-4 h-4 text-white" />
                    </button>

                    {items.length > 0 && !isDeleting && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                <input
                    id={`file-input-${folderId}`}
                    type="file"
                    accept={
                        type === "video"
                            ? "video/*"
                            : type === "audio"
                                ? "audio/*"
                                : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                    }
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isDeleting}
                />
            </div>

            {isOpen && !isDeleting && (
                <div className="ml-6 mt-2 space-y-2">
                    {items.map((item) => {
                        if (!item) return null;
                        const isSelected =
                            type === "video" ? selectedVideo === (item as Video).videoLocation : selectedDocument === (item as Document).id;

                        return (
                            <div
                                key={(item as any).id}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition ${isSelected ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1E1E2E] hover:bg-[#2E2E3E]"
                                    }`}
                            >
                                <span
                                    className="text-white text-sm flex-1 cursor-pointer"
                                    onClick={() => {
                                        if (type === "video") onSelectVideo?.(item as Video);
                                        else onSelectDocument?.(item as Document);
                                    }}
                                >
                                    {(type === "video" ? (item as Video).videoName : (item as Document).documentName) || "Untitled"}
                                </span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this file?")) {
                                            onDeleteFile?.((item as any).id, String(customerId ?? ""));
                                        }
                                    }}
                                    className="ml-2 p-1 rounded hover:bg-red-600"
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DocumentFolderComponent;
