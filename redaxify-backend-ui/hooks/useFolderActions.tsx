
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { getVideoDuration } from "@/lib/getDuration";
import { Folder, Video } from "@/lib/types";

export function useFolderActions({ user, folders, setFolders, setUploadStates }) {
    const router = useRouter();

    const handleCreateFolder = async (folderName: string) => {
        try {
            if (!user?.customerNumber) throw new Error("User customer number is required");
            const response = await api.post<Folder>(
                "/folder",
                { folderName, customerNumber: user.customerNumber },
                { withCredentials: true }
            );
            setFolders((prev) => [
                ...prev,
                {
                    id: response.data.id,
                    folderName: response.data.folderName,
                    videos: [],
                    documents: [],
                    customerNumber: user.customerNumber!,
                    type: "video",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Folder,
            ]);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error("Failed to create folder");
        }
    };

    const handleDeleteFolder = async (folderId: number) => {
        try {
            await api.delete(`/folder/${folderId}`, { withCredentials: true });
            setFolders((prev) => prev.filter((f) => f.id !== folderId));
        } catch (error) {
            console.error("Error deleting folder:", error);
            toast.error("Failed to delete folder");
        }
    };

    const handleUploadVideo = async (folderName: string, file: File) => {
        const folder = folders.find((f) => f.folderName === folderName);

        if (user?.userType === "regular") {
            router.push("/subscriptions");
            return;
        }
        if (!folder || !user?.customerNumber) {
            toast.error("Invalid folder or user data.");
            return;
        }
        const folderId = folder.id;

        const validVideoTypes = [
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska",
            "video/mpeg",
            "video/x-ms-wmv",
            "video/x-flv",
        ];
        if (!validVideoTypes.includes(file.type)) {
            toast.error(`Invalid file type. Supported types: ${validVideoTypes.join(", ")}`);
            return;
        }
        const MAX_FILE_SIZE = 1024 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return;
        }
        const videoDuration = await getVideoDuration(file);

        setUploadStates((prev) => ({
            ...prev,
            [folder.id]: {
                progress: 0,
                status: "uploading" as const,
                fileName: file.name,
            },
        }));

        try {
            const sasRes = await fetch("/api/azure/sas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    folderId: folderId,
                    customerNumber: user.customerNumber,
                }),
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
                        setUploadStates((prev) => ({
                            ...prev,
                            [folder.id]: { ...prev[folder.id], progress: percent },
                        }));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadStates((prev) => ({
                            ...prev,
                            [folder.id]: { ...prev[folder.id], progress: 88 },
                        }));
                        resolve();
                    } else reject(new Error(`Azure upload failed with status: ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error("Azure upload failed"));
                xhr.send(file);
            });

            const metadata = {
                customerNumber: user.customerNumber,
                folderId: folderId,
                videoUrl: blobName,
                blobName,
                videoName: file.name,
                videoSize: file.size,
                videoDuration,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/video/upload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(metadata),
            });
            const data = await response.json();
            if (!data.success || !data.data.video) throw new Error(data.error || "Invalid response");

            let progress = 88;
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    progress += 1;
                    setUploadStates((prev) => ({
                        ...prev,
                        [folder.id]: { ...prev[folder.id], progress },
                    }));
                    if (progress >= 100) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });

            setUploadStates((prev) => ({
                ...prev,
                [folder.id]: { ...prev[folder.id], progress: 100, status: "success" },
            }));

            const readRes = await fetch("/api/azure/read-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blobName }),
            });
            if (!readRes.ok) throw new Error("Failed to fetch read URL");
            const { url: readUrl } = await readRes.json();

            const newVideo: Video = {
                id: data.data.video.id,
                azureVideoId: blobName,
                videoName: file.name,
                videoSize: file.size,
                videoLocation: readUrl,
                videoDuration,
                imageLocation: null,
                indexingStatus: "PENDING",
                indexedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                customerNumber: user.customerNumber,
                folderId: data.data.video.folderId,
            };

            setFolders((prev) =>
                prev.map((f) =>
                    f.id === folder.id ? { ...f, videos: [...(f.videos ?? []), newVideo] } : f
                )
            );

            setTimeout(() => {
                setUploadStates((prev) => {
                    const newState = { ...prev };
                    delete newState[folder.id];
                    return newState;
                });
            }, 3000);

        } catch (error) {
            console.error(error);
            setUploadStates((prev) => ({
                ...prev,
                [folder.id]: {
                    ...prev[folder.id],
                    status: "error",
                    error: error instanceof Error ? error.message : "Upload failed",
                },
            }));
            toast.error("Video upload failed. Please try again.");
        }
    };

    return { handleCreateFolder, handleDeleteFolder, handleUploadVideo };
}