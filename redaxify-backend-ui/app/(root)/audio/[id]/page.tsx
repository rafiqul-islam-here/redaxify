"use client";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Copy } from "lucide-react";
import VideoDetailSkeleton from "@/components/VideoDetailSkeleton";
import { toast } from "react-hot-toast";

export default function AudioDetailPage() {
  const { id } = useParams();
  const user = useSelector((state: RootState) => state.user);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "transcript">("summary");
  const [transcriptData, setTranscriptData] = useState<{
    transcript: string;
    summary: string;
  } | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!user?.customerNumber) return;

      try {
        setLoading(true);
        const response = await axios.get('/api/proxy', {
          params: {
            url: `/api/video/videos/${id}?customerNumber=${user.customerNumber}`
          },
          withCredentials: true,
        });
        setVideoData(response.data.data);
      } catch (err) {
        setError("Failed to load audio details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id, user?.customerNumber]);

  const fetchTranscript = async () => {
    try {
      setTranscriptLoading(true);
      const response = await axios.get('/api/proxy', {
        params: {
          url: `/api/video/summary?id=${id}&customerNumber=${user.customerNumber}`
        },
        withCredentials: true,
      });
      setTranscriptData({
        transcript: response.data.transcript,
        summary: response.data.summary,
      });
      setShowTranscript(true);
      setViewMode("summary");

      setTimeout(() => {
        const transcriptElement = document.getElementById("transcript-section");
        if (transcriptElement) {
          transcriptElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    } catch (err) {
      setError("Failed to load transcript");
      console.error(err);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!transcriptData?.summary) return;
    navigator.clipboard.writeText(transcriptData.summary);
    toast.success("Copied to clipboard!", {
      position: "bottom-center",
      duration: 2000,
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m > 9 ? m : h ? "0" + m : m || "0", s > 9 ? s : "0" + s]
      .filter(Boolean)
      .join(":");
  };

  if (loading) {
    return <VideoDetailSkeleton />;
  }

  if (error)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)] bg-[#090E30] text-red-500">
        {error}
      </div>
    );

  if (!videoData)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)] bg-[#090E30] text-white">
        Audio not found
      </div>
    );

  return (
    <div className="w-full bg-[#090E30] text-white px-4 py-4 h-[calc(100vh-48px)] overflow-auto">
      {/* Video Info First */}
      <div className="bg-[#1A1F4B] p-4 rounded-md shadow-lg mb-4 relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {videoData.title.charAt(0).toUpperCase() +
                videoData.title.slice(1)}
            </h1>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p>
                Size: &nbsp;&nbsp;
                <span>
                  {videoData.size > 0
                    ? `${(videoData.size / (1024 * 1024)).toFixed(1)} MB`
                    : "N/A"}
                </span>
              </p>
              <p>
                Duration: &nbsp;&nbsp;
                <span>{formatDuration(videoData.duration)}</span>
              </p>
              <p className="text-gray-300 col-span-2">
                Uploaded: {new Date(videoData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!showTranscript) {
                  fetchTranscript();
                } else {
                  setShowTranscript(false);
                }
              }}
              className="bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white px-4 py-2 rounded-md transition-colors"
              disabled={transcriptLoading}
            >
              {transcriptLoading
                ? "Processing..."
                : showTranscript
                ? "Hide Summary"
                : "Generate Summary"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-140px)]">
        {/* Player */}
        <div className="bg-[#1A1F4B] rounded-md overflow-hidden shadow-lg h-full">
          <h2 className="text-xl font-semibold px-4 py-3 border-b border-[#334155]">
            Audio Player
          </h2>
          <div className="h-[calc(100%-56px)]">
            <iframe
              title="Audio Player"
              width="100%"
              height="100%"
              src={videoData.playerUrl}
              frameBorder="0"
              allowFullScreen
              className="w-full h-full min-h-[510px]"
            ></iframe>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-[#1A1F4B] rounded-md overflow-hidden shadow-lg h-full">
          <h2 className="text-xl font-semibold px-4 py-3 border-b border-[#334155]">
            Audio Insights
          </h2>
          <div className="h-[calc(100%-56px)]">
            <iframe
              title="Audio Insights"
              width="100%"
              height="100%"
              src={videoData.insightsUrl}
              frameBorder="0"
              allowFullScreen
              className="w-full h-full min-h-[510px]"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Transcript & Summary Section */}
      {showTranscript && (
        <div
          id="transcript-section"
          className="mt-4 bg-[#1A1F4B] rounded-sm p-4 shadow-lg"
        >
          {/* View Mode Toggle Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                viewMode === "summary"
                  ? "bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white"
                  : "bg-[#0f1329] text-gray-300 hover:bg-[#1A1F4B]"
              }`}
            >
              Short Summary
            </button>
            <button
              onClick={() => setViewMode("transcript")}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                viewMode === "transcript"
                  ? "bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white"
                  : "bg-[#0f1329] text-gray-300 hover:bg-[#1A1F4B]"
              }`}
            >
              Long Summary
            </button>
          </div>

          {viewMode === "summary" && transcriptData?.summary && (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Audio Summary</h2>
                <button
                  onClick={handleCopySummary}
                  className="text-blue-400 hover:text-blue-300 transition-colors p-1 cursor-copy"
                  title="Copy summary"
                >
                  <Copy size={18} />
                </button>
              </div>
              <div className="bg-[#0f1329] p-4 rounded-md whitespace-pre-wrap">
                {transcriptData.summary}
              </div>
            </div>
          )}

          {viewMode === "transcript" && (
            <>
              <h2 className="text-xl font-semibold mb-3">Audio Summary</h2>
              <div className="bg-[#0f1329] p-4 rounded-md whitespace-pre-wrap">
                {transcriptData?.transcript || "No transcript available"}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
