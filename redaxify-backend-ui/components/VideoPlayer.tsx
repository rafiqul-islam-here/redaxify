"use client";
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  VolumeX,
  Volume2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface VideoPlayerProps {
  videoSrc: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  progress: number;
  currentTime: string;
  totalTime: string;
  onPlayPause: () => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRewind: () => void;
  onFastForward: () => void;
  onMute: () => void;
  onVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeUpdate: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const VideoPlayer = ({
  videoSrc,
  isPlaying,
  isMuted,
  volume,
  progress,
  currentTime,
  totalTime,
  onPlayPause,
  onSeek,
  onRewind,
  onFastForward,
  onMute,
  onVolumeChange,
  onTimeUpdate,
  videoRef,
}: VideoPlayerProps) => {
  const [showIcon, setShowIcon] = useState(false);

  // Video restarts once played.
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("ended", onPlayPause);
      return () => {
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("ended", onPlayPause);
      };
    }
  }, [onTimeUpdate, onPlayPause, videoRef]);

  return (
    <div className="w-full">
      <div
        className={`relative w-full h-[480px] flex items-center justify-center bg-black ${
          !videoSrc ? "blur-md" : ""
        }`}
        onMouseEnter={() => setShowIcon(true)}
        onMouseLeave={() => setShowIcon(false)}
      >
        <video
          key={videoSrc} // Force re-render when videoSrc changes
          ref={videoRef}
          src={videoSrc ?? undefined}
          className="w-full h-full max-w-full max-h-full object-contain"
          controls={false}
          onClick={onPlayPause}
        />

        {showIcon && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-6xl"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="w-16 h-16" />
            ) : (
              <Play className="w-16 h-16" />
            )}
          </div>
        )}
      </div>

      <div
        className={`px-0 w-full flex flex-col items-center ${
          !videoSrc ? "blur-md" : ""
        }`}
      >
        <input
          type="range"
          value={isNaN(progress) ? 0 : progress}
          onChange={onSeek}
          placeholder="....."
          className="w-full mt-2"
        />

        <div className="w-full mt-3 flex items-stretch border-2 border-[#222645]">
          <div className="flex-1 flex items-center justify-center gap-4 px-3 py-2">
            <button onClick={onRewind} className="p-2 text-white rounded">
              <Rewind />
              {""}
            </button>
            <button
              onClick={onPlayPause}
              className="p-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white rounded-full"
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button onClick={onFastForward} className="p-2 text-white rounded">
              <FastForward />
              {""}
            </button>
          </div>

          <div className="w-[150px] flex items-stretch border-x-2 border-[#222645]">
            <div className="flex-1 flex items-center justify-center text-white text-base border-r-2 border-[#222645]">
              {currentTime}
            </div>
            <div className="flex-1 flex items-center justify-center text-white text-base">
              {totalTime}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
            <button onClick={onMute} className="px-2 py-2 text-white rounded">
              {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              placeholder="....."
              value={volume}
              onChange={onVolumeChange}
              className="w-full max-w-[180px] bg-gradient-to-r from-[#335FFF] to-[#1A4BFF]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
