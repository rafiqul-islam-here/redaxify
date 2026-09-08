"use client";
import { useState, useRef, useEffect } from "react";
import {
  ClockIcon,
  DatabaseIcon,
  FilmIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlus,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";
import AudioOptions from "@/components/AudioOptions";
import FolderComponent from "@/components/FolderComponent";
import FolderCreationPopup from "@/components/FolderCreationPopup";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { FolderSkeleton } from "@/components/FolderSkeleton";
import { UploadStatusIndicator } from "@/components/UploadStatusIndicator";
import { Folder, Video } from "@/lib/types";
import { formatTime } from "@/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getAudioDuration } from "@/lib/getAudioDuration";

const Page = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00:00");
  const [totalTime, setTotalTime] = useState("0:00:00");
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null);
  const [uploadStates, setUploadStates] = useState<{
    [folderId: number]: {
      progress: number;
      status: "idle" | "uploading" | "success" | "error";
      fileName?: string;
    };
  }>({});
  const [indexingStatus, setIndexingStatus] = useState<boolean>(false);
  const [indexingProgress, setIndexingProgress] = useState<number>(0);
  const [completedAudioId, setCompletedAudioId] = useState<string | null>(null);

  const validAudioTypes = [
    "audio/mpeg", // MP3
    "audio/wav", // WAV
    "audio/ogg", // OGG
    "audio/x-ms-wma", // WMA
    "audio/aac", // AAC
    "audio/flac", // FLAC
  ];

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user?.customerNumber) return;
      setIsFoldersLoading(true);
      try {
        const response = await api.get<Folder[]>("/folder", {
          params: { customerNumber: user?.customerNumber, type: "audio" },
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

    if (
      Object.values(uploadStates).some((state) => state.status === "success")
    ) {
      fetchFolders();
    }
  }, [uploadStates, user?.customerNumber]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const { currentTime, duration } = audioRef.current;

    if (!duration || !isFinite(duration) || duration <= 0) {
      setProgress(0);
      setCurrentTime(formatTime(0));
      setTotalTime(formatTime(0));
      return;
    }

    const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    setProgress(percent);
    setCurrentTime(formatTime(currentTime));
    setTotalTime(formatTime(duration));
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      const value = parseFloat(event.target.value);

      if (
        !isNaN(duration) &&
        !isNaN(value) &&
        isFinite(duration) &&
        isFinite(value)
      ) {
        const seekTime = (value / 100) * duration;
        audioRef.current.currentTime = seekTime;
      }
    }
  };

  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 5;
    }
  };

  const fastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 5;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const volumeLevel = parseFloat(event.target.value);
      audioRef.current.volume = volumeLevel;
      setVolume(volumeLevel);
    }
  };

  const handleCheckboxChange = (option: string) => {
    setCheckedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIndexingStatus(true);
    setIndexingProgress(0);

    if (user?.userType === "regular") {
      router.push(`/subscriptions`);
      return;
    }

    if (!user?.customerNumber || !audioSrc) {
      toast.error(
        user?.customerNumber
          ? "No audio selected"
          : "User customer number is required"
      );
      setIndexingStatus(false);
      return;
    }

    const currentAudioInfo = folders
      .flatMap((folder) => folder.videos)
      .find((v) => v.videoLocation === audioSrc);

    if (!currentAudioInfo) {
      toast.error("Could not find audio information");
      setIndexingStatus(false);
      return;
    }

    try {
      const payload = {
        video: {
          ...currentAudioInfo,
          customerNumber: user.customerNumber,
        },
        options: checkedOptions,
      };
      const progressInterval = setInterval(() => {
        setIndexingProgress((prev) =>
          Math.min(80, prev + (10 + Math.random() * 5))
        );
      }, 1000);

      
      const response = await axios.post('/api/proxy?url=/api/audio/index', payload, { withCredentials: true });
      
      //console.log("Indexing response:", response.data);
      const databaseId = response.data.data.databaseId;

      if (response.data.message === "Audio was already indexed") {
        clearInterval(progressInterval);
        setIndexingProgress(100);
        setCompletedAudioId(databaseId);
        toast.success("Audio was already processed - loading results");
        setTimeout(() => setIndexingStatus(false), 500);
        return;
      } else {
        toast.success("Audio processing started successfully!");
      }

      const checkRealStatus = async () => {
        try {
          const statusRes = await axios.get('/api/proxy', {
            params: {
              url: `/api/audio/index?dbId=${databaseId}`
            }
          });

          if (statusRes.data.data.azureStatus === "Processed") {
            clearInterval(progressInterval);
            setIndexingProgress(100);
            setCompletedAudioId(databaseId);
            setTimeout(() => {
              setIndexingStatus(false);
              toast.success("Processing complete!");
            }, 500);
          } else if (statusRes.data.data.azureStatus === "Failed") {
            clearInterval(progressInterval);
            setIndexingStatus(false);
            toast.error("Processing failed");
          }
        } catch (error) {
          console.error("Status check error:", error);
        }
      };

      const statusInterval = setInterval(checkRealStatus, 5000);
      checkRealStatus();

      return () => {
        clearInterval(progressInterval);
        clearInterval(statusInterval);
      };
    } catch (error) {
      setIndexingStatus(false);
      setIndexingProgress(0);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to start processing"
        );
      } else {
        toast.error("An unexpected error occurred");
        console.error("Submission error:", error);
      }
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      if (!user?.customerNumber) {
        throw new Error("User customer number is required");
      }

      const response = await api.post<Folder>(
        "/folder",
        {
          folderName,
          customerNumber: user.customerNumber,
          type: "audio",
        },
        { withCredentials: true }
      );


      setFolders((prev) => [
        ...prev,
        {
          id: response.data.id,
          folderName: response.data.folderName,
          videos: [],
          documents: [], // Add this field
          customerNumber: user.customerNumber!,
          type: "audio", // or appropriate type based on your logic
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Folder, // Explicit type assertion
      ]);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    setDeletingFolderId(folderId);
    try {
      await api.delete(`/folder/${folderId}`, {
        withCredentials: true,
      });
      setFolders(folders.filter((f) => f.id !== folderId));
    } catch (error) {
      setDeletingFolderId(null);
      console.error("Error deleting folder:", error);
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleDeleteVideo = async (fileId: string, customerNumber: string) => {
    try {

      const res = await api.delete(`/video/${fileId}`, {
        params: { customerNumber },
        withCredentials: true,
      });

      const data = res.data;

      const vidId = parseInt(fileId, 10);

      if (data.success) {
        setFolders((prev) =>
          prev.map((folder) => ({
            ...folder,
            videos: folder.videos.filter((v) => v.id !== vidId),
          }))
        );
      } else {
        alert(data.error || "Failed to delete video");
      }

      // Clear video source if currently playing
      if (audioSrc && folders.some(f => f.videos.some(v => v.id === vidId && v.videoLocation === audioSrc))) {
        setAudioSrc(null);
        setCurrentAudio(null);
      }

      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };


  const handleUploadAudio = async (folderName: string, file: File) => {
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

    if (!validAudioTypes.includes(file.type)) {
      toast.error(`Invalid file type. Supported types: ${validAudioTypes.join(", ")}`);
      return;
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    const audioDuration = await getAudioDuration(file);

    setUploadStates((prev) => ({
      ...prev,
      [folder.id]: {
        progress: 0,
        status: "uploading" as const,
        fileName: file.name,
      },
    }));

    try {
      const sasRes = await fetch("/api/azure/video-sas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          folderId: folderId,
          customerNumber: user.customerNumber,
        }),
      });

      if (!sasRes.ok) {
        throw new Error("Failed to fetch SAS URL");
      }

      const { url: uploadUrl, blobName } = await sasRes.json();

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
              [folder.id]: {
                ...prev[folder.id],
                progress: percent,
              },
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadStates((prev) => ({
              ...prev,
              [folder.id]: {
                ...prev[folder.id],
                progress: 88,
              },
            }));
            resolve();
          } else {
            reject(new Error(`Azure upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Azure upload failed"));
        xhr.send(file);
      });

      const baseUrl = "https://redaxifydevstorage.blob.core.windows.net/videos";
      const url = `${baseUrl}/${blobName}`;

      const metadata = {
        customerNumber: user.customerNumber,
        folderId: folderId,
        videoUrl: url,
        blobName: blobName,
        videoName: file.name,
        videoSize: file.size,
        videoDuration: audioDuration,
      };

      const audioApiUrl = `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/video/upload`;

      const response = await fetch(audioApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      const data = await response.json();

      console.log("Metadata API response:", data);

      if (!data.success || !data.data.video) {
        throw new Error(data.error || "Invalid response from metadata API");
      }

      let progress = 88;
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          progress += 1;
          setUploadStates((prev) => ({
            ...prev,
            [folder.id]: {
              ...prev[folder.id],
              progress,
            },
          }));
          if (progress >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      setUploadStates((prev) => ({
        ...prev,
        [folder.id]: {
          ...prev[folder.id],
          progress: 100,
          status: "success" as const,
        },
      }));

      const newAudio: Video = {
        id: data.data.video.id,
        azureVideoId: data.data.azure?.blobName || "",
        videoName: data.data.video.name,
        videoSize: data.data.video.size,
        videoLocation: data.data.video.url,
        videoDuration: audioDuration,
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
          f.id === folder.id
            ? {
              ...f,
              videos: [...f.videos, newAudio],
            }
            : f
        )
      );

      setAudioSrc(newAudio.videoLocation);
      setCurrentAudio(newAudio.videoLocation);

      setTimeout(() => {
        setUploadStates((prev) => {
          const newState = { ...prev };
          delete newState[folder.id];
          return newState;
        });
      }, 3000);
    } catch (error) {
      setUploadStates((prev) => ({
        ...prev,
        [folder.id]: {
          ...prev[folder.id],
          status: "error" as const,
          error: error instanceof Error ? error.message : "Upload failed",
        },
      }));
      toast.error("Audio upload failed. Please try again.");
    }
  };

  const handleSelectAudio = (audio: Video) => {
    if (!audio || !audio.videoLocation || audio.videoLocation === currentAudio)
      return;

    const audioExists = folders.some((folder) =>
      folder.videos?.some((v) => v?.id === audio.id)
    );

    if (!audioExists) {
      toast.error("This audio is no longer available");
      return;
    }

    setAudioSrc(audio.videoLocation);
    setCurrentAudio(audio.videoLocation);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00:00");
    setTotalTime("0:00:00");

    if (audioRef.current) {
      try {
        audioRef.current.src = audio.videoLocation;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          console.log("Autoplay blocked. User interaction required.");
        });
      } catch (error) {
        console.error("Error loading audio:", error);
        toast.error("Failed to load audio");
      }
    }
  };


  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="w-[75%] relative overflow-y-auto">
        {!audioSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C3A]/90 to-[#242648]/90 p-8">
            <div className="text-center max-w-md">
              <FolderOpenIcon className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                No Audio Selected
              </h3>
              <p className="text-gray-300 mb-6">
                Get started by uploading a new audio or selecting one from your
                folders
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowFolderPopup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] hover:opacity-90 text-white rounded-lg transition-all cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Folder
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 border border-indigo-400 text-white hover:bg-indigo-900/30 rounded-lg transition-colors">
                    <UploadIcon className="w-5 h-5" />
                    Upload Audio
                  </button>
                  {folders.length > 0 && (
                    <div className="absolute left-0 mt-1 w-56 bg-[#242648] rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-[#3A3A5A]">
                      <div className="py-1">
                        <p className="px-4 py-2 text-sm text-gray-300 border-b border-[#3A3A5A]">
                          Select folder:
                        </p>
                        {folders.map((folder) => (
                          <div
                            key={folder.id}
                            className="px-4 py-2 text-sm text-white hover:bg-[#3A3A5A] cursor-pointer flex items-center"
                            onClick={() => {
                              const input = document.getElementById(
                                `upload-input-${folder.id}`
                              );
                              if (input) input.click();
                            }}
                          >
                            <FolderIcon className="w-4 h-4 mr-2 text-indigo-400" />
                            {folder.folderName}
                            <input
                              id={`upload-input-${folder.id}`}
                              type="file"
                              accept={validAudioTypes.join(",")}
                              className="hidden"
                              placeholder="Upload audio"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadAudio(
                                    folder.folderName,
                                    e.target.files[0]
                                  );
                                }
                                e.target.value = "";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl">
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <FilmIcon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <h4 className="text-white font-medium">Supported Formats</h4>
                <p className="text-gray-400 text-sm">
                  MP3, WAV, OGG, WMA, AAC, FLAC
                </p>
              </div>
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <ClockIcon className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                <h4 className="text-white font-medium">Max Duration</h4>
                <p className="text-gray-400 text-sm">Up to 60 minutes</p>
              </div>
              <div className="bg-[#1E1E3A]/50 p-4 rounded-lg border border-[#2E2E5A] text-center">
                <DatabaseIcon className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <h4 className="text-white font-medium">Max Size</h4>
                <p className="text-gray-400 text-sm">500MB per audio</p>
              </div>
            </div>
          </div>
        )}
        {audioSrc && (
          <>
            <AudioPlayer
              audioSrc={audioSrc}
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              progress={progress}
              currentTime={currentTime}
              totalTime={totalTime}
              onPlayPause={togglePlayPause}
              onSeek={handleSeek}
              onRewind={rewind}
              onFastForward={fastForward}
              onMute={toggleMute}
              onVolumeChange={handleVolumeChange}
              onTimeUpdate={handleTimeUpdate}
              audioRef={audioRef}
              key={audioSrc}
            />
            <AudioOptions
              checkedOptions={checkedOptions}
              onCheckboxChange={handleCheckboxChange}
              onSubmit={handleSubmit}
              isProcessing={indexingStatus}
              progress={indexingProgress}
              completedAudioId={completedAudioId}
            />
          </>
        )}
      </div>
      <div className="w-[25%] h-[calc(100vh-3rem)] overflow-y-auto bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-4">
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-l from-[#242648] to-[#1C1C3A] shadow-md p-4 mb-4">
          <span className="text-white text-lg font-semibold">
            Create Folder
          </span>
          <button
            onClick={() => setShowFolderPopup(true)}
            className="p-2 bg-[#2E2E2E] text-white rounded-lg hover:bg-[#3A3A3A] transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
            {""}
          </button>
        </div>

        {isFoldersLoading ? (
          <>
            <FolderSkeleton />
            <FolderSkeleton />
            <FolderSkeleton />
            <FolderSkeleton />
          </>
        ) : (
          folders.map((folder) => (
            // <FolderComponent
            //   key={folder.id}
            //   folderId={folder.id}
            //   folderName={folder.folderName}
            //   videos={folder.videos}
            //   onUploadAudio={(file) =>
            //     handleUploadAudio(folder.folderName, file)
            //   }
            //   onSelectVideo={(audio) => handleSelectAudio(audio)}
            //   onDeleteFolder={() => handleDeleteFolder(folder.id)}
            //   selectedAudio={currentAudio}
            //   isDeleting={deletingFolderId === folder.id}
            // />
            <FolderComponent
              key={folder.id}
              folderId={folder.id}
              folderName={folder.folderName}
              videos={folder.videos}
              onUploadVideo={(file) =>
                handleUploadAudio(folder.folderName, file)
              }
              onSelectVideo={(video) => handleSelectAudio(video)}
              onDeleteFolder={() => handleDeleteFolder(folder.id)}
              onDeleteFile={handleDeleteVideo} 
              selectedVideo={currentAudio}
              isDeleting={deletingFolderId === folder.id}
            />
          ))
        )}

        {showFolderPopup && (
          <FolderCreationPopup
            onClose={() => setShowFolderPopup(false)}
            onCreate={handleCreateFolder}
          />
        )}
      </div>

      {Object.keys(uploadStates).length > 0 && (
        <UploadStatusIndicator uploadStates={uploadStates} />
      )}
    </div>
  );
};

export default Page;