import React from "react";

export function VideoSkeleton() {
  return (
    <div className="w-full bg-[#090E30] text-white px-6 py-5">
      <div className="mb-5">
        <div className="h-10 w-lg bg-[#1A1F4B] rounded-md mb-4 animate-pulse"></div>
        {/* <div className="flex gap-4">
          <div className="bg-[#1A1F4B] p-3 rounded-xl w-36 h-20 animate-pulse"></div>
          <div className="bg-[#1A1F4B] p-3 rounded-xl w-36 h-20 animate-pulse"></div>
        </div> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-[#1A1F4B] rounded-lg overflow-hidden">
            <div className="relative w-full h-44 bg-[#2E3A74] animate-pulse"></div>
            <div className="p-4">
              <div className="h-5 w-3/4 bg-[#2E3A74] rounded mb-3 animate-pulse"></div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-[#2E3A74] rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-[#2E3A74] rounded animate-pulse"></div>
              </div>
              <div className="h-3 w-24 bg-[#2E3A74] rounded mt-2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
