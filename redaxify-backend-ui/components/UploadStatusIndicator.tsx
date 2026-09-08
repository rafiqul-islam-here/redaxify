import type { UploadState } from "@/lib/types";

interface UploadStatusIndicatorProps {
  uploadStates: Record<number, UploadState>;
}

export const UploadStatusIndicator = ({
  uploadStates,
}: UploadStatusIndicatorProps) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {Object.entries(uploadStates).map(([folderId, state]) => (
        <div
          key={folderId}
          className={`p-3 rounded-lg shadow-lg w-64 transition-all ${
            state.status === "success"
              ? "bg-green-600"
              : state.status === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-white truncate">
              {state.fileName}
            </span>
            {state.status === "uploading" && (
              <span className="text-white text-sm">{state.progress}%</span>
            )}
          </div>

          {state.status === "uploading" && (
            <div className="w-full bg-blue-400 rounded-full h-2 mt-2">
              <div
                className="bg-white h-2 rounded-full"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}

          {state.status === "success" && (
            <p className="text-white text-sm mt-1">Upload complete!</p>
          )}

          {state.status === "error" && (
            <p className="text-white text-sm mt-1">
              {state.error || "Upload failed"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
