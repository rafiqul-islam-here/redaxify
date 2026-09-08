"use client";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { VideoSkeleton } from "./VideoSkeleton";

interface Video {
  id: number;
  videoId: string | null;
  title: string;
  thumbnailUrl: string;
  status: string;
  duration: number;
  formattedDuration: string;
  size: number;
  createdAt: string;
  indexedAt: string | null;
  isIndexed: boolean;
  processingProgress: number;
}

interface VideoLibraryProps {
  customHeader?: React.ReactNode;
  showStats?: boolean;
  skeletonCount?: number;
}

export default function VideoLibrary({
  customHeader,
  showStats = false,
}: VideoLibraryProps) {
  const user = useSelector((state: RootState) => state.user);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    if (!user?.customerNumber) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/video/videos?customerNumber=${user.customerNumber}`,
        {
          withCredentials: true,
        }
      );
      setVideos(response.data.data.videos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.customerNumber]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
            Ready
          </span>
        );
      case "PROCESSING":
        return (
          <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">
            {progress}%
          </span>
        );
      case "FAILED":
        return (
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
            Failed
          </span>
        );
      default:
        return (
          <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return <VideoSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[#090E30] text-white px-5 py-4">
      <div className="mb-5">
        {customHeader || (
          <h1 className="text-3xl font-bold mb-4">Your Video Library</h1>
        )}
        {showStats && <div className="flex gap-4"></div>}
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl">No videos found</p>
          <button
            onClick={fetchVideos}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-[#1A1F4B] rounded-lg overflow-hidden hover:scale-100 transition-transform shadow-lg"
            >
              <div className="relative group w-full h-44">
                <Image
                  src={video.thumbnailUrl || "https://placehold.co/600x400.png"}
                  alt={video.title}
                  fill
                  className="object-cover rounded"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400.png";
                  }}
                />

                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
                  {video.formattedDuration}
                </div>
                <div className="absolute top-2 left-2">
                  {getStatusBadge(video.status, video.processingProgress)}
                </div>

                {video.isIndexed && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 space-x-2">
                    <Link
                      href={`/video/${video.id}`}
                      className="bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] hover:from-[#1A4BFF] hover:to-[#335FFF] text-white px-4 py-2 rounded font-medium shadow-md text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-base mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{formatDate(video.createdAt)}</span>
                  <span>
                    {video.size > 0
                      ? `${(video.size / (1024 * 1024)).toFixed(1)} MB`
                      : "N/A"}
                  </span>
                </div>
                {video.isIndexed && video.indexedAt && (
                  <div className="mt-1 text-xs text-gray-500">
                    Indexed: {formatDate(video.indexedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
