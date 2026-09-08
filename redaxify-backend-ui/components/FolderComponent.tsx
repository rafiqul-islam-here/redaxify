"use client";
import { useState } from "react";
import { Folder, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Video } from "@/lib/types";

interface FolderProps {
  folderName: string;
  folderId: number;
  videos: Video[];
  onUploadVideo: (file: File) => void;
  onSelectVideo: (video: Video) => void;
  onDeleteFolder?: (folderId: number) => void;
  onDeleteFile?: (fileId: string, customerNumber:string) => void;
  selectedVideo: string | null;
  isDeleting: boolean;
}

const FolderComponent = ({
  folderName,
  folderId,
  videos,
  onUploadVideo,
  onSelectVideo,
  onDeleteFolder,
  onDeleteFile,
  selectedVideo,
  isDeleting,
}: FolderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadVideo(file);
      // Reset the input to allow selecting the same file again
      event.target.value = "";
    }
  };

  return (
    <div
      className={`mb-2 transition-all duration-200 ${
        isDeleting ? "opacity-60" : ""
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-t from-[#1b1e3b] to-[#292d5c] shadow-md shadow-black/30 ${
          isDeleting
            ? "cursor-not-allowed"
            : "cursor-pointer hover:brightness-105"
        }`}
        onClick={() => !isDeleting && setIsOpen(!isOpen)}
      >
        {/* Folder name and icon */}
        <div className="flex items-center gap-3 min-w-0">
          {" "}
          {/* Add min-w-0 to enable text truncation */}
          <Folder
            className={`w-5 h-5 shrink-0 ${
              isDeleting ? "text-gray-500" : "text-blue-500"
            }`}
          />
          <div className="relative min-w-0">
            {" "}
            {/* Container for tooltip */}
            <span
              className={`font-medium block truncate max-w-[110px] ${
                isDeleting ? "text-gray-400" : "text-white"
              }`}
              title={folderName} // This adds native tooltip
            >
              {folderName}
            </span>
            {/* Custom tooltip */}
            {typeof folderName === "string" && folderName.length > 15 && (
              <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap">
                {folderName}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting && confirm(`Delete "${folderName}"?`)) {
                onDeleteFolder?.(folderId);
              }
            }}
            className={`p-1.5 rounded-lg transition flex items-center justify-center w-8 h-8 ${
              isDeleting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gray-700 hover:bg-red-700"
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="loading loading-spinner loading-xs text-gray-400"></div>
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Add button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById(`file-input-${folderId}`)?.click();
            }}
            className={`p-1.5 rounded-lg transition flex items-center justify-center w-8 h-8 ${
              isDeleting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            disabled={isDeleting}
            title="Add video"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>

          {/* Expand/Collapse button */}
          {videos.length > 0 && !isDeleting && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          id={`file-input-${folderId}`}
          type="file"
          accept="video/*"
          placeholder="Select Video"
          onChange={handleFileChange}
          className="hidden"
          disabled={isDeleting}
        />
      </div>

      {/* Folder contents */}
      {isOpen && !isDeleting && (
        <div className="ml-6 mt-2 space-y-2">
          {videos.map((video) => {
            if (!video?.videoLocation) return null;
            const isSelected = selectedVideo === video.videoLocation;

            return (
              <div
                key={video.id || Math.random()}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition ${isSelected
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-[#1E1E2E] hover:bg-[#2E2E3E]"
                  }`}
              >
                <span
                  className="text-white text-sm flex-1 cursor-pointer"
                  onClick={() => onSelectVideo(video)}
                >
                  {video.videoName || "Untitled Video"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this video?")) {
                      onDeleteFile?.(video.id.toString(), video.customerNumber.toString());
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
export default FolderComponent;
