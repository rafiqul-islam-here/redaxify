export const FolderSkeleton = () => (
  <div className="mb-2">
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-t from-[#1b1e3b] to-[#292d5c] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
        <div className="h-4 bg-gray-600 rounded w-24"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
);
