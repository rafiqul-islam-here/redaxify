import { ChevronsLeft, ChevronsRight } from "lucide-react";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CustomPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null; // Hide pagination if only one page

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      // Show all pages if total pages <= 5
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1, 2); // Always show first two pages

    if (currentPage > 4) {
      pages.push("...");
    }

    // Show current, previous, and next pages (if applicable)
    for (
      let i = Math.max(3, currentPage - 1);
      i <= Math.min(totalPages - 2, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages); // Always show last page

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      {/* Previous Button */}
      <button
        className="px-3 py-2 text-gray-600 rounded-md disabled:opacity-50"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft size={30} />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          className={`px-4 py-2 rounded-md cursor-pointer ${
            currentPage === page
              ? "bg-black text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          } ${page === "..." ? "cursor-default" : ""}`}
          onClick={() => typeof page === "number" && handlePageClick(page)}
          disabled={page === "..."}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        className="px-3 py-2 flex items-center text-gray-600 bg-gray-200 rounded-md disabled:opacity-50"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight size={30} />
      </button>
    </div>
  );
};

export default CustomPagination;
