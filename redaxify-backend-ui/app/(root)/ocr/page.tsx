"use client";
import { useState, useEffect } from "react";
import { FolderOpenIcon, PlusIcon, UploadIcon } from "lucide-react";
import { FileTextIcon, ClockIcon, FolderIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DocumentFolderComponent from "@/components/DocumentFolderComponent";
import FolderCreationPopup from "@/components/FolderCreationPopup";
import { Folder, Document } from "@/lib/types";
import { FolderSkeleton } from "@/components/FolderSkeleton";
import toast from "react-hot-toast";
import api from "@/lib/api";
import ImageViewer from "@/components/ImageViewer";
import { useRouter } from 'next/navigation';

const validImageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/jpg",
];

const extensionMimeMap: { [ext: string]: string } = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function getExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}
function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  return extensionMimeMap[ext] || "";
}
const isImage = (mime: string) =>
  validImageTypes.includes(mime);

const UploadStatusIndicator = ({
  uploadStates,
}: {
  uploadStates: {
    [folderId: number]: {
      progress: number;
      status: "idle" | "uploading" | "success" | "error";
      fileName?: string;
    };
  };
}) => {
  const activeUploads = Object.entries(uploadStates).filter(
    ([, state]) => state.status === "uploading" || state.status === "success"
  );
  if (activeUploads.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 w-96 bg-[#252550] rounded-lg shadow-lg p-4 border border-indigo-400">
      <h4 className="text-white mb-2 font-bold text-lg">Image Uploads</h4>
      <ul>
        {activeUploads.map(([folderId, state]) => (
          <li key={folderId} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white text-sm font-medium">{state.fileName}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${state.status === "success" ? "bg-green-700 text-white" : "bg-[#252550] text-indigo-300"
                  }`}
              >
                {state.status === "success" ? "Completed" : `${state.progress}%`}
              </span>
            </div>
            <div className="w-full bg-[#191936] h-3 rounded">
              <div
                className={`h-3 rounded transition-all duration-300 ${state.status === "success" ? "bg-green-500" : "bg-indigo-400"
                  }`}
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DocumentOCRPage = () => {
  const user = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null);
  const [uploadStates, setUploadStates] = useState<{
    [folderId: number]: { progress: number; status: "idle" | "uploading" | "success" | "error"; fileName?: string };
  }>({});
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSignedUrlLoading, setIsSignedUrlLoading] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user?.customerNumber) return;
      setIsFoldersLoading(true);
      try {
        const response = await api.get<Folder[]>("/folder", {
          params: { customerNumber: user.customerNumber, type: "ocr" },
          withCredentials: true,
        });
        setFolders(response.data);
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setIsFoldersLoading(false);
      }
    };
    fetchFolders();

    if (Object.values(uploadStates).some((state) => state.status === "success")) {
      fetchFolders();
    }
  }, [user?.customerNumber, uploadStates]);

  useEffect(() => {
    if (currentDocument) {
      setSignedUrl(null);
      setIsSignedUrlLoading(true);
      fetch("/api/azure/read-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobName: currentDocument.blobName }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch read URL");
          const { url } = await res.json();
          setSignedUrl(url);
        })
        .catch((err) => {
          console.error(err);
          setSignedUrl(null);
        })
        .finally(() => setIsSignedUrlLoading(false));
    }
  }, [currentDocument]);

  const handleCreateFolder = async (folderName: string) => {
    try {
      if (!user?.customerNumber) throw new Error("User customer number required");
      const response = await api.post<Folder>(
        "/folder",
        { folderName, customerNumber: user.customerNumber, type: "ocr" },
        { withCredentials: true }
      );
      setFolders((prev) => [...prev, { ...response.data, documents: [] }]);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    setDeletingFolderId(folderId);
    try {
      await api.delete(`/folder/${folderId}`, { params: { type: "ocr" }, withCredentials: true });
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleUploadImage = async (folderId: number, file: File) => {
    const folder = folders.find((f) => f.id === folderId);

    if (user?.userType === "regular") {
      router.push(`/subscriptions`);
      return;
    }

    if (!folder || !user?.customerNumber) {
      toast.error("Invalid folder or user");
      return;
    }
    if (!validImageTypes.includes(file.type)) {
      toast.error(`Unsupported image type. Supported: ${validImageTypes.join(", ")}`);
      return;
    }
    const MAX_FILE_SIZE = 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }
    setUploadStates((prev) => ({
      ...prev,
      [folder.id]: { progress: 0, status: "uploading", fileName: file.name },
    }));

    try {
      const sasRes = await fetch("/api/azure/sas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, folderId: folder.id, customerNumber: user.customerNumber }),
      });

      if (!sasRes.ok) throw new Error("Failed to fetch SAS URL");
      const { uploadUrl, blobName } = await sasRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 88);
            setUploadStates((prev) => ({ ...prev, [folder.id]: { ...prev[folder.id], progress: percent } }));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Azure upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Azure upload failed"));
        xhr.send(file);
      });

      const metadata = {
        customerNumber: user.customerNumber,
        folderId: folder.id,
        blobName: blobName,
        documentName: file.name,
        documentSize: file.size,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/document/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      const data = await res.json();
      if (!data.success || !data.data.document) throw new Error(data.error || "Invalid response");

      let progress = 88;
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          progress += 1;
          setUploadStates((prev) => ({ ...prev, [folder.id]: { ...prev[folder.id], progress } }));
          if (progress >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      const newDocument: Document = {
        id: data.data.document.id,
        documentName: file.name,
        blobName: blobName,
        documentSize: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerNumber: user.customerNumber,
        folderId: folder.id,
      };

      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, documents: [...(f.documents ?? []), newDocument] } : f)));
      setCurrentDocument(newDocument);
      setUploadStates((prev) => ({ ...prev, [folder.id]: { ...prev[folder.id], progress: 100, status: "success" } }));

      setTimeout(() => {
        setUploadStates((prev) => {
          const newState = { ...prev };
          delete newState[folder.id];
          return newState;
        });
      }, 3000);

      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStates((prev) => ({ ...prev, [folder.id]: { ...prev[folder.id], status: "error" } }));
      toast.error("Image upload failed");
    }
  };

  const handleSelectDocument = (doc: Document) => setCurrentDocument(doc);

  let viewer: React.ReactNode = null;
  if (currentDocument) {
    const mimeType = getMimeType(currentDocument.documentName);
    if (isImage(mimeType)) {
      viewer = (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">{currentDocument.documentName}</h2>
          {isSignedUrlLoading && <div className="w-full h-[80vh] flex items-center justify-center text-white">Loading image...</div>}
          {signedUrl && (
            <ImageViewer
              documentUrl={currentDocument.blobName}
              documentName={currentDocument.documentName}
              documentId={currentDocument.id}
              signedUrl={signedUrl}
            // Add OCR controls/view here if needed
            />
          )}
        </div>
      );
    } else {
      viewer = (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">{currentDocument.documentName}</h2>
          <div className="text-red-400">Unsupported file type. Only images are allowed for OCR.</div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="w-[75%] relative overflow-y-auto">
        {!currentDocument && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C3A]/90 to-[#242648]/90 p-8">
            <div className="text-center max-w-md">
              <FolderOpenIcon className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Image Selected</h3>
              <p className="text-gray-300 mb-6">Upload a new image or select one from your folders for OCR processing.</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowFolderPopup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] hover:opacity-90 text-white rounded-lg transition-all cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Folder
                </button>

                {folders.length > 0 && (
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 border border-indigo-400 text-white hover:bg-indigo-900/30 rounded-lg transition-colors">
                      <UploadIcon className="w-5 h-5" />
                      Upload Image
                    </button>
                    <div className="absolute left-0 mt-1 w-56 bg-[#242648] rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-[#3A3A5A]">
                      <div className="py-1">
                        <p className="px-4 py-2 text-sm text-gray-300 border-b border-[#3A3A5A]">Select folder:</p>
                        {folders.map((folder) => (
                          <div
                            key={folder.id}
                            className="px-4 py-2 text-sm text-white hover:bg-[#3A3A5A] cursor-pointer flex items-center"
                            onClick={() => {
                              const input = document.getElementById(`upload-input-${folder.id}`);
                              if (input) input.click();
                            }}
                          >
                            {folder.folderName}
                            <input
                              id={`upload-input-${folder.id}`}
                              type="file"
                              accept={validImageTypes.join(",")}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) handleUploadImage(folder.id, e.target.files[0]);
                                e.target.value = "";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <FileTextIcon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <h4 className="text-white font-medium">Supported Formats</h4>
                <p className="text-gray-400 text-sm">
                  JPG, JPEG, PNG, GIF, BMP, SVG, WEBP
                </p>
              </div>
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <ClockIcon className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                <h4 className="text-white font-medium">Max Size</h4>
                <p className="text-gray-400 text-sm">Up to 1GB per image</p>
              </div>
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <FolderIcon className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <h4 className="text-white font-medium">Folders</h4>
                <p className="text-gray-400 text-sm">Organize your images in folders</p>
              </div>
            </div>
          </div>
        )}

        {viewer}
      </div>

      <div className="w-[25%] border-l border-[#3A3A5A] p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-white font-semibold">Folders</h4>
          <button onClick={() => setShowFolderPopup(true)} className="text-indigo-400 hover:text-indigo-300">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isFoldersLoading
          ? Array.from({ length: 5 }).map((_, idx) => <FolderSkeleton key={idx} />)
          : folders.map((folder) => (
            <DocumentFolderComponent
              key={folder.id}
              folderId={folder.id}
              folderName={folder.folderName}
              type={"ocr"}
              documents={folder.documents}
              videos={folder.videos}
              onDeleteFolder={handleDeleteFolder}
              isDeleting={deletingFolderId === folder.id}
              onSelectDocument={handleSelectDocument}
              onUpload={(file) => handleUploadImage(folder.id, file)}
              selectedDocument={currentDocument?.id ?? null}
            />
          ))}
      </div>

      {showFolderPopup && <FolderCreationPopup onClose={() => setShowFolderPopup(false)} onCreate={handleCreateFolder} />}
      <UploadStatusIndicator uploadStates={uploadStates} />
    </div>
  );
};

export default DocumentOCRPage;