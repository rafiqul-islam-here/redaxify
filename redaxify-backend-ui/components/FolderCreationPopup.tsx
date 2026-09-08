"use client";
import { useState } from "react";
import { FolderPlus } from "lucide-react";

interface FolderCreationPopupProps {
  onClose: () => void;
  onCreate: (folderName: string) => void;
}

const FolderCreationPopup = ({
  onClose,
  onCreate,
}: FolderCreationPopupProps) => {
  const [folderName, setFolderName] = useState("");

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreate(folderName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1C1C3A] p-6 rounded-lg shadow-2xl border border-[#222645] w-[400px]">
        <div className="flex items-center gap-2 mb-4">
          <FolderPlus className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Create Folder</h2>
        </div>
        <input
          type="text"
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="w-full p-3 mb-6 bg-[#2E2E2E] text-white rounded-lg border border-[#222645] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2E2E2E] text-white rounded-lg hover:bg-[#3A3A3A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderCreationPopup;
