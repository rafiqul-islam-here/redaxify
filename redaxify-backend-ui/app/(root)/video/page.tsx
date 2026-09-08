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
import VideoPlayer from "@/components/VideoPlayer";
import VideoOptions from "@/components/VideoOptions";
import FolderComponent from "@/components/FolderComponent";
import FolderCreationPopup from "@/components/FolderCreationPopup";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { FolderSkeleton } from "@/components/FolderSkeleton";
import { UploadStatusIndicator } from "@/components/UploadStatusIndicator";
import { FolderOld, Video } from "@/lib/types";
import { formatTime } from "@/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getVideoDuration } from "@/lib/getDuration";

const Page = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const [folders, setFolders] = useState<FolderOld[]>([]);
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
  // const [publicViewLink, setPublicViewLink] = useState<string | null>(null);

  const validVideoTypes = [
    "video/mp4", // MP4 (H.264 + AAC recommended)
    "video/quicktime", // MOV (Apple QuickTime)
    "video/x-msvideo", // AVI
    "video/x-matroska", // MKV
    "video/mpeg", // MPEG-1/MPEG-2
    "video/x-ms-wmv", // WMV (Windows Media Video)
    "video/x-flv", // FLV (Flash Video, less common but supported)
  ];

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user?.customerNumber) return;
      setIsFoldersLoading(true);
      try {
        const response = await api.get<FolderOld[]>("/folder", {
          params: { customerNumber: user?.customerNumber },
          withCredentials: true,
        });
        setFolders(response.data);
        //console.log(response.data);
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
    // setPublicViewLink(null);

    if (user?.userType === "regular") {
      router.push(`/subscriptions`);
      return;
    }

    // Validates inputs
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
      console.log("Could not find video information");
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
      console.log("Submitting for indexing with payload:", payload);
      // Start smooth dummy progress (0-80%)
      const progressInterval = setInterval(() => {
        setIndexingProgress((prev) =>
          Math.min(80, prev + (10 + Math.random() * 5))
        );
      }, 1000);

      // Start indexing using backend API
      const response = await axios.post(
        "/api/proxy?url=/api/video/index",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      //console.log("Indexing response:", response.data);
      // const videoId = response.data.data.indexerVideoId;
      const databaseId = response.data.data.databaseId;
      // const publicViewLink =
      //   response.data.data.publicViewLink ||
      //   `https://www.videoindexer.ai/accounts/${process.env.NEXT_PUBLIC_VI_ACCOUNT_ID}/videos/${videoId}?location=${process.env.NEXT_PUBLIC_VI_LOCATION}`;

      if (response.data.message === "Video was already indexed") {
        clearInterval(progressInterval);
        setIndexingProgress(100);
        setCompletedVideoId(databaseId);
        // setPublicViewLink(publicViewLink);
        toast.success("Video was already processed - loading results");
        setTimeout(() => setIndexingStatus(false), 500);
        return;
      } else {
        toast.success("Video processing started successfully!");
      }

      // For new videos - check for real status
      const checkRealStatus = async () => {
        try {
          const statusRes = await axios.get('/api/proxy', {
            params: {
              url: `/api/video/index?dbId=${databaseId}`
            }
          });

          if (statusRes.data.data.azureStatus === "Processed") {
            clearInterval(progressInterval);
            setIndexingProgress(100);
            setCompletedVideoId(databaseId);
            // setPublicViewLink(
            //   statusRes.data.data.publicViewLink || publicViewLink
            // );
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
      // setPublicViewLink(null);

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

      const response = await api.post<FolderOld>(
        "/folder",
        {
          folderName,
          customerNumber: user.customerNumber,
        },
        { withCredentials: true }
      );

      setFolders((prev) => [
        ...prev,
        {
          id: response.data.id,
          folderName: response.data.folderName,
          videos: [],
          customerNumber: user.customerNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as FolderOld, // Explicit type assertion
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
      if (videoSrc && folders.some(f => f.videos.some(v => v.id === vidId && v.videoLocation === videoSrc))) {
        setVideoSrc(null);
        setCurrentVideo(null);
      }

      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };


  const handleUploadVideo = async (folderName: string, file: File) => {
    const folder = folders.find((f) => f.folderName === folderName);
    if (user?.userType === "regular") {
      router.push(`/subscriptions`);
      return;
    }

    if (!folder || !user?.customerNumber) return;

    const folderId = folder.id;
    const customerNumber = folder.customerNumber;

    console.log("Folder ID:", folderId);
    console.log("Customer Number:", customerNumber);

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
      toast.error(
        `Invalid file type. Supported types: ${validVideoTypes.join(", ")}`
      );
      return;
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
      return;
    }

    const videoDuration = await getVideoDuration(file);
    console.log("Video duration:", videoDuration);

    setUploadStates((prev) => ({
      ...prev,
      [folder.id]: {
        progress: 0,
        status: "uploading" as const,
        fileName: file.name,
      },
    }));

    try {
      // 1. Get SAS URL
      const sasRes = await fetch("/api/azure/video-sas", {
        method: "POST", // Make sure server allows PUT here, or change to POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          folderId: folder.id,
          customerNumber: user.customerNumber,
        }),
      });

      const { url: uploadUrl, blobName } = await sasRes.json();
      //console.log("SAS URL response and blobname :", uploadUrl, blobName);

      // 2. Upload to Azure
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        toast.error("Azure upload failed");
        return;
      }

      const baseUrl = "https://redaxifydevstorage.blob.core.windows.net/videos";
      const url = `${baseUrl}/${blobName}`;
      console.log("Video uploaded to Azure at URL:", url);


      const metadata = {
        customerNumber: user.customerNumber,
        folderId: folderId,
        videoUrl: url,
        blobName: blobName,
        videoName: file.name,
        videoSize: file.size,
        videoDuration: videoDuration,
      };

      const videoApiUrl = `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/video/upload`;

      const response = await fetch(videoApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });
      // ✅ Parse the JSON body
      const data = await response.json();

      console.log("Metadata API response:", data);
      // Validate response structure
      if (!data.success || !data.data.video) {
        throw new Error(data.error || "Invalid response from metadata API");
      }

      // Type assertion to match expected structure
      // Removed unused variable 'responseData'

      // 5. Simulate progress from 88% to 100% during metadata processing
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

      // 6. Update upload state to success
      setUploadStates((prev) => ({
        ...prev,
        [folder.id]: {
          ...prev[folder.id],
          progress: 100,
          status: "success" as const,
        },
      }));

      // 7. Create new video object
      const newVideo: Video = {
        id: data.data.video.id,
        azureVideoId: data.data.azure?.blobName || "",
        videoName: data.data.video.name,
        videoSize: data.data.video.size,
        videoLocation: data.data.video.url,
        videoDuration,
        imageLocation: null,
        indexingStatus: "PENDING",
        indexedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerNumber: user.customerNumber,
        folderId: data.data.video.folderId,
      };

      // 8. Update folders with new video
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folder.id
            ? {
              ...f,
              videos: [...f.videos, newVideo],
            }
            : f
        )
      );

      // 9. Set video source and current video
      setVideoSrc(newVideo.videoLocation);
      setCurrentVideo(newVideo.videoLocation);

      // 10. Clear upload state after 3 seconds
      setTimeout(() => {
        setUploadStates((prev) => {
          const newState = { ...prev };
          delete newState[folder.id];
          return newState;
        });
      }, 3000);
    } catch (error) {
      // Handle errors
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
    // won't proceed if video is invalid or already selected
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

    setVideoSrc(video.videoLocation);
    setCurrentVideo(video.videoLocation);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00:00");
    setTotalTime("0:00:00");

    // Handles video element
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

  //console.log("users informations: ", user);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="w-[75%] relative overflow-y-auto">
        {!videoSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C3A]/90 to-[#242648]/90 p-8">
            <div className="text-center max-w-md">
              <FolderOpenIcon className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                No Video Selected
              </h3>
              <p className="text-gray-300 mb-6">
                Get started by uploading a new video or selecting one from your
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

                {/* Folder selection dropdown + upload button */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 border border-indigo-400 text-white hover:bg-indigo-900/30 rounded-lg transition-colors">
                    <UploadIcon className="w-5 h-5" />
                    Upload Video
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
                              accept={validVideoTypes.join(",")}
                              className="hidden"
                              placeholder="Upload video"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadVideo(
                                    folder.folderName,
                                    e.target.files[0]
                                  );
                                }
                                e.target.value = ""; // Reset input
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
                  MP4, MOV, AVI, MKV, MPEG-1/2, WMV, FLV
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
                <p className="text-gray-400 text-sm">500MB per video</p>
              </div>
            </div>
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
            // publicViewLink={publicViewLink}
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
              onDeleteFile={handleDeleteVideo} 
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