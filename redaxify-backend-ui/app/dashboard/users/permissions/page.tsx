"use client";

import CustomPagination from "@/components/dashboard/CustomPagination";
import Loader from "@/components/dashboard/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { CheckCircle, Pencil, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

interface User {
  id: number;
  customerNumber: number;
  name: string;
  email: string;
  password?: string | null;
  provider?: string | null;
  providerId?: string | null;
  userType: "regular" | "basic" | "premium";
  userAuth: boolean | null;
  permission: boolean | null;
  userRole: "user" | "admin" | "support" | "marketing";
  otp?: string | null;
  otpExpires?: string | null;
  mailVerifytoken?: string | null;
  mailVerifytokenExpires?: string | null;
}

const Page: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPermission, setNewPermission] = useState<boolean | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    // Fetch users from the API when the component mounts
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/users`);

        // Filter out users with the 'admin' role
        const filteredUsers = response.data.filter(
          (user: User) => user.userRole !== "admin"
        );

        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_BASE_URL]);

  const handleUpdate = (user: User) => {
    setSelectedUser(user);
    setNewPermission(user.permission); // Set the current permission status
    setIsModalOpen(true); // Open the modal
  };

  const handlePermissionUpdate = async () => {
    if (selectedUser) {
      try {
        // Make the PATCH API call to update the user's permission status
        const response = await axios.patch(
          `${API_BASE_URL}/api/dashboard/users`,
          {
            userId: selectedUser.id,
            permission: newPermission,
          }
        );

        // Handle response and update the users list with the updated user
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id
              ? { ...user, permission: newPermission }
              : user
          )
        );
        setIsModalOpen(false);
        console.log(response);
      } catch (error) {
        console.error("Error updating user permission:", error);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLoadingSearch(true);

    // Add a slight delay to avoid calling the API on each keystroke
    const timer = setTimeout(async () => {
      setLoadingSearch(false);
    }, 300);

    return () => clearTimeout(timer);
  };

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="px-2">
      <h1 className="text-2xl font-bold mb-4">
        Users Permissions ({users.length})
      </h1>
      <Input
        placeholder="Search users..."
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-1/3"
      />
      {loadingSearch && <div>Searching...</div>}

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2 items-start">ID</th>
            <th className="border p-2 items-start">Name</th>
            <th className="border p-2 items-start">Email</th>
            <th className="border p-2 items-start">User Type</th>
            <th className="border p-2 items-start">User Role</th>
            <th className="border p-2 items-start">Permission</th>
            <th className="border p-2 items-start">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} rowSpan={10} className="p-4 text-center">
                <Loader />
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center">
                No users available.
              </td>
            </tr>
          ) : (
            currentUsers
              .filter((user) =>
                user.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((user, index) => (
                <tr
                  key={user.id}
                  className={`border ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-2 border items-start">{user.id}</td>
                  <td className="p-2 border items-start">{user.name}</td>
                  <td className="p-2 border items-start">{user.email}</td>
                  <td className="p-2 border items-start">{user.userType}</td>
                  <td
                    className={`p-2 border items-start ${
                      user.userRole === "admin"
                        ? "text-red-500"
                        : user.userRole === "support"
                        ? "text-green-500"
                        : user.userRole === "marketing"
                        ? "text-yellow-500"
                        : "text-blue-500"
                    }`}
                  >
                    {user.userRole}
                  </td>
                  <td className="p-2 border items-start">
                    {user.permission ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                  </td>
                  <td className="p-2 border space-x-2 flex">
                    <Button
                      variant="ghost"
                      className="bg-cyan-50 cursor-pointer"
                      onClick={() => handleUpdate(user)}
                    >
                      <Pencil size={18} />
                    </Button>
                  </td>
                </tr>
              ))
              .reverse()
          )}
        </tbody>
      </table>

      {/* Modal for updating user permission */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h2 className="text-lg font-semibold mb-4">
              Update User Permission
            </h2>
            <p className="mb-4">
              Current status:{" "}
              <strong>
                {selectedUser.permission ? "Granted" : "Not Granted"}
              </strong>
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setNewPermission(true)}
                className={`${
                  newPermission === true
                    ? "bg-black text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                Grant Permission
              </Button>
              <Button
                onClick={() => setNewPermission(false)}
                className={`${
                  newPermission === false
                    ? "bg-black text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                Revoke Permission
              </Button>
            </div>
            <div className="mt-4 flex justify-between">
              <Button
                onClick={handlePermissionUpdate}
                className="bg-blue-500 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-400 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <CustomPagination
        currentPage={currentPage}
        totalPages={Math.ceil(users.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Page;
