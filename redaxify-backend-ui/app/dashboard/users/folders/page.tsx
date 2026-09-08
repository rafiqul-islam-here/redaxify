"use client";
import React, { useEffect, useState } from "react";
import CustomPagination from "@/components/dashboard/CustomPagination";
import Loader from "@/components/dashboard/Loader";
import { Input } from "@/components/ui/input";
import axios from "axios";

interface Folder {
  serialNumber: number;
  folderId: number;
  userName: string;
  folderName: string;
  createdAt: string;
  fileCount: number;
  userEmail: string;
}

const Page = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${API_BASE_URL}/api/dashboard/folder`
        );
        setFolders(response.data);
      } catch (err) {
        console.error("Error fetching folders:", err);
        setError("Failed to load folders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [API_BASE_URL]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLoadingSearch(true);
    setTimeout(() => {
      setLoadingSearch(false);
    }, 300);
  };

  // Filter folders based on search
  const filteredFolders = folders.filter(
    (folder) =>
      folder.userName.toLowerCase().includes(search.toLowerCase()) ||
      folder.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      folder.folderName.toLowerCase().includes(search.toLowerCase()) ||
      folder.createdAt.toLowerCase().includes(search.toLowerCase()) ||
      folder.fileCount.toString().includes(search)
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFolders = filteredFolders.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredFolders.length / itemsPerPage);

  return (
    <div className="px-2">
      <h1 className="text-2xl font-bold mb-3">Folders ({folders.length})</h1>
      <Input
        placeholder="Search folders by Username, User Email, Folder Name, File Count, Created At....."
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-1/2"
      />
      {loadingSearch && <div>Searching...</div>}

      {error ? (
        <div className="p-4 text-center text-red-500 font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="text-center">
          <Loader />
        </div>
      ) : folders.length === 0 ? (
        <div className="p-4 text-center text-gray-500 font-semibold">
          No folders available.
        </div>
      ) : (
        <>
          <table className="w-full border-collapse border border-gray-200 mb-4">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">Serial</th>
                <th className="border p-2">Username</th>
                <th className="border p-2">User Email</th>
                <th className="border p-2">Folder Name</th>
                <th className="border p-2">File Count</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentFolders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6} // Updated to 6 columns
                    className="p-4 text-center text-red-500 font-semibold"
                  >
                    No search results found.
                  </td>
                </tr>
              ) : (
                currentFolders.map((folder, index) => (
                  <tr
                    key={folder.folderId}
                    className={`border ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-2 border">{folder.serialNumber}</td>
                    <td className="p-2 border">{folder.userName}</td>
                    <td className="p-2 border">{folder.userEmail}</td>
                    <td className="p-2 border font-semibold">
                      {folder.folderName}
                    </td>
                    {/* <td className="p-2 border">{folder.fileCount}</td> */}
                    <td className="p-2 border">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          folder.fileCount > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {folder.fileCount > 0 && (
                          <svg
                            className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        )}
                        {folder.fileCount}
                      </span>
                    </td>
                    {/* <td className="p-2 border">
                      {new Date(folder.createdAt).toLocaleString()}
                    </td> */}
                    <td className="p-2 border">
                      {new Date(folder.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination component */}
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default Page;
