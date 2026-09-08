"use client";
import { useState, useRef, useEffect } from "react";
import { FolderPlus } from "lucide-react";
import { formatTime } from "@/utils";
import VideoPlayer from "@/components/VideoPlayer";
import VideoOptions from "@/components/VideoOptions";
import FolderComponent from "@/components/FolderComponent";
import FolderCreationPopup from "@/components/FolderCreationPopup";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import api from "@/lib/api";
import { FolderSkeleton } from "@/components/FolderSkeleton";
import toast from "react-hot-toast";
import { UploadStatusIndicator } from "@/components/UploadStatusIndicator";
import axios from "axios";

interface Video {
  id: number;
  azureVideoId: string;
  indexerVideoId: string | null;
  videoName: string;
  videoSize: number;
  videoDuration: number;
  videoLocation: string;
  imageLocation: string | null;
  indexingStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerNumber: number;
  folderId: number | null;
}

interface Folder {
  id: number;
  folderName: string;
  videos: Video[];
  customerNumber: number;
  createdAt?: string;
  updatedAt?: string;
}

const Page = () => {
  const user = useSelector((state: RootState) => state.user);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00:00");
  const [totalTime, setTotalTime] = useState("0:00:00");
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
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
  const [completedVideoId, setCompletedVideoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user?.customerNumber) return;
      setIsFoldersLoading(true);
      try {
        const response = await api.get<Folder[]>("/folder", {
          params: { customerNumber: user?.customerNumber },
        });
        setFolders(response.data);
        console.log(response.data);
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
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const { currentTime, duration } = videoRef.current;

    // 1. Validate duration to prevent NaN/Infinity
    if (!duration || !isFinite(duration) || duration <= 0) {
      setProgress(0);
      setCurrentTime(formatTime(0));
      setTotalTime(formatTime(0));
      return;
    }

    // 2. Calculate safe progress (0-100)
    const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    // 3. Update states with validated values
    setProgress(percent);
    setCurrentTime(formatTime(currentTime));
    setTotalTime(formatTime(duration));
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const value = parseFloat(event.target.value);

      // Check if duration and value are valid numbers
      if (
        !isNaN(duration) &&
        !isNaN(value) &&
        isFinite(duration) &&
        isFinite(value)
      ) {
        const seekTime = (value / 100) * duration;
        videoRef.current.currentTime = seekTime;
      }
    }
  };

  const rewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 5;
    }
  };

  const fastForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 5;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const volumeLevel = parseFloat(event.target.value);
      videoRef.current.volume = volumeLevel;
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

    // Validate inputs
    if (!user?.customerNumber || !videoSrc) {
      toast.error(
        user?.customerNumber
          ? "No video selected"
          : "User customer number is required"
      );
      setIndexingStatus(false);
      return;
    }

    const currentVideoInfo = folders
      .flatMap((folder) => folder.videos)
      .find((v) => v.videoLocation === videoSrc);

    if (!currentVideoInfo) {
      toast.error("Could not find video information");
      setIndexingStatus(false);
      return;
    }

    try {
      const payload = {
        video: {
          ...currentVideoInfo,
          customerNumber: user.customerNumber,
        },
        options: checkedOptions,
      };

      // Start smooth dummy progress (0-80%)
      const progressInterval = setInterval(() => {
        setIndexingProgress((prev) =>
          Math.min(80, prev + (10 + Math.random() * 5))
        );
      }, 1000);

      // Start indexing
      const response = await axios.post('/api/proxy', {
        method: 'POST',
        url: '/api/video/index',
        data: payload
      });
      const videoId = response.data.data.indexerVideoId;

      // Your specific modification for already-indexed videos
      if (response.data.message === "Video was already indexed") {
        clearInterval(progressInterval);
        setIndexingProgress(100);
        setCompletedVideoId(videoId);
        toast.success("Video was already processed - loading results");
        setTimeout(() => setIndexingStatus(false), 500);
        return;
      } else {
        toast.success("Video processing started successfully!");
      }

      // For new videos - check real status
      const checkRealStatus = async () => {
        try {
          const statusRes = await axios.get('/api/proxy', {
            params: {
              url: `/api/video/index?videoId=${videoId}`
            }
          });

          if (statusRes.data.data.azureStatus === "Processed") {
            clearInterval(progressInterval);
            setIndexingProgress(100);
            setCompletedVideoId(videoId);
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

      // Check every 5 seconds
      const statusInterval = setInterval(checkRealStatus, 5000);
      checkRealStatus(); // Initial check

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

      const response = await api.post<Folder>("/folder", {
        folderName,
        customerNumber: user.customerNumber,
      });

      setFolders((prev) => [
        ...prev,
        {
          id: response.data.id,
          folderName: response.data.folderName,
          videos: [],
          customerNumber: user.customerNumber,
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
      // await api.delete(`/test/${folderId}`);
      await api.delete(`/folder/${folderId}`);
      setFolders(folders.filter((f) => f.id !== folderId));
    } catch (error) {
      setDeletingFolderId(null);
      console.error("Error deleting folder:", error);
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleUploadVideo = async (folderName: string, file: File) => {
    const folder = folders.find((f) => f.folderName === folderName);
    if (!folder || !user?.customerNumber) return;

    // Initialize upload state
    setUploadStates((prev) => ({
      ...prev,
      [folder.id]: {
        progress: 0,
        status: "uploading" as const,
        fileName: file.name,
      },
    }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", folderName);
    formData.append("customerNumber", user.customerNumber.toString());

    try {
      const { data } = await api.post<{
        video?: Video;
        folder?: Folder;
      }>("/video/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.min(
            90,
            Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || file.size)
            )
          );
          setUploadStates((prev) => ({
            ...prev,
            [folder.id]: {
              ...prev[folder.id],
              progress: percentCompleted,
            },
          }));
        },
      });

      // Validate response structure
      if (!data?.video?.videoLocation || !data.folder) {
        throw new Error("test : Invalid response structure from server");
      }

      // Simulate Azure upload progress (90-99%)
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          setUploadStates((prev) => {
            const currentProgress = prev[folder.id]?.progress || 90;
            if (currentProgress >= 99) {
              clearInterval(interval);
              resolve();
              return {
                ...prev,
                [folder.id]: {
                  ...prev[folder.id],
                  progress: 99,
                },
              };
            }
            return {
              ...prev,
              [folder.id]: {
                ...prev[folder.id],
                progress: currentProgress + 1,
              },
            };
          });
        }, 300);
      });

      // Final completion
      setUploadStates((prev) => ({
        ...prev,
        [folder.id]: {
          ...prev[folder.id],
          progress: 100,
          status: "success" as const,
        },
      }));

      // Update state only if video exists
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folder.id
            ? {
                ...f,
                videos: [...f.videos, data.video!], // We already validated existence
              }
            : f
        )
      );

      setVideoSrc(data.video.videoLocation);
      setCurrentVideo(data.video.videoLocation);

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
      toast.error("Video upload failed. Please try again.");
    }
  };

  const handleSelectVideo = (video: Video) => {
    // Don't proceed if video is invalid or already selected
    if (!video || !video.videoLocation || video.videoLocation === currentVideo)
      return;

    // Verify video exists in our state first
    const videoExists = folders.some((folder) =>
      folder.videos?.some((v) => v?.id === video.id)
    );

    if (!videoExists) {
      toast.error("This video is no longer available");
      return;
    }

    // Update state with the full video object if needed later
    setVideoSrc(video.videoLocation);
    setCurrentVideo(video.videoLocation);

    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00:00");
    setTotalTime("0:00:00");

    // Handle video element
    if (videoRef.current) {
      try {
        videoRef.current.src = video.videoLocation;
        videoRef.current.load();
        videoRef.current.play().catch(() => {
          console.log("Autoplay blocked. User interaction required.");
        });
      } catch (error) {
        console.error("Error loading video:", error);
        toast.error("Failed to load video");
      }
    }
  };

  console.log("completedVideoId", completedVideoId);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="w-[75%] relative overflow-y-auto">
        {!videoSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-2xl font-semibold">
              Kindly upload a video, please.
            </p>
          </div>
        )}
        {videoSrc && (
          <>
            <VideoPlayer
              videoSrc={videoSrc}
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
              videoRef={videoRef}
              key={videoSrc} // Force re-render when videoSrc changes
            />
            <VideoOptions
              checkedOptions={checkedOptions}
              onCheckboxChange={handleCheckboxChange}
              onSubmit={handleSubmit}
              isProcessing={indexingStatus}
              progress={indexingProgress}
              completedVideoId={completedVideoId}
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
          // Show actual folders
          folders.map((folder) => (
            <FolderComponent
              key={folder.id}
              folderId={folder.id}
              folderName={folder.folderName}
              videos={folder.videos}
              onUploadVideo={(file) =>
                handleUploadVideo(folder.folderName, file)
              }
              onSelectVideo={(video) => handleSelectVideo(video)}
              onDeleteFolder={() => handleDeleteFolder(folder.id)}
              selectedVideo={currentVideo}
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
