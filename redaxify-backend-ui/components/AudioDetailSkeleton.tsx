import React from "react";

export default function AudioDetailSkeleton() {
  return (
    <div className="w-full bg-[#090E30] text-white px-4 py-4 h-[calc(100vh-48px)] overflow-auto">
      {/* audio info skeleton */}
      <div className="bg-[#1A1F4B] p-4 rounded-md shadow-lg mb-4 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="w-3/4">
            <div className="h-8 bg-[#2d3a7c] rounded w-2/3 mb-4"></div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="h-4 bg-[#2d3a7c] rounded w-3/4"></div>
              <div className="h-4 bg-[#2d3a7c] rounded w-3/4"></div>
              <div className="h-4 bg-[#2d3a7c] rounded w-full col-span-2"></div>
            </div>
          </div>
          <div className="h-10 bg-[#2d3a7c] rounded w-32"></div>
        </div>
      </div>

      {/* player & insights skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-140px)]">
        {/* Player Skeleton */}
        <div className="bg-[#1A1F4B] rounded-md overflow-hidden shadow-lg h-full animate-pulse">
          <div className="h-12 bg-[#2d3a7c] px-4 py-3"></div>
          <div className="h-[calc(100%-56px)] bg-[#2d3a7c] min-h-[510px]"></div>
        </div>

        {/* insights skeleton */}
        <div className="bg-[#1A1F4B] rounded-md overflow-hidden shadow-lg h-full animate-pulse">
          <div className="h-12 bg-[#2d3a7c] px-4 py-3"></div>
          <div className="h-[calc(100%-56px)] bg-[#2d3a7c] min-h-[510px]"></div>
        </div>
      </div>
    </div>
  );
}