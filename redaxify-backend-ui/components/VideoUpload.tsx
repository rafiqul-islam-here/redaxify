"use client";
import { UploadCloud } from "lucide-react";

interface VideoUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const VideoUpload = ({ onFileChange }: VideoUploadProps) => {
  return (
    <div className="absolute inset-0 z-10 flex justify-center backdrop-blur-md">
      <div className="z-20 mt-16 flex flex-col items-center justify-center bg-[#090E30] bg-gradient-to-l from-[#242648] to-[#1C1C3A] backdrop-blur-3xl px-6 shadow-3xl border-2 border-[#222645] w-[60%] h-[50%] rounded-xl">
        <h2 className="text-4xl font-extrabold text-white mt-6 mb-4 tracking-wide text-center">
          Upload a Video
        </h2>
        <p className="text-md text-gray-400 mb-4 text-center">
          Drag & Drop your video here or browse to select a file.
        </p>
        <label className="relative cursor-pointer flex flex-col items-center justify-center w-full h-60 border-2 border-dashed border-blue- bg-[#2E2E2E] rounded-xl">
          <UploadCloud className="w-18 h-18 text-slate-200 mb-4 drop-shadow-md" />
          <span className="text-xl text-gray-300 font-semibold">
            Click to Upload or Drag Here.
          </span>
          <input
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-xl"
          />
        </label>
        <p className="text-sm text-gray-400 mt-3 mb-4 text-center">
          Supported formats: MP4, AVI, MOV, MKV
        </p>
      </div>
    </div>
  );
};

export default VideoUpload;
