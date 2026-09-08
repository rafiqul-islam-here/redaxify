"use client";

import CustomPagination from "@/components/dashboard/CustomPagination";
import Loader from "@/components/dashboard/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { CheckCircle, Eye, Pencil, Trash2, XCircle } from "lucide-react";
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
  userAuth: boolean;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [updatedRole, setUpdatedRole] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // Number of users per page

  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    // Fetch users from the API when the component mounts
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/users`);
        const filteredUsers = response.data.filter(
          (user: User) => !user.provider
        ); // Keep users without a provider
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_BASE_URL]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/dashboard/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleUpdate = async () => {
    if (selectedUser) {
      try {
        await axios.patch(
          `${API_BASE_URL}/api/dashboard/users/${selectedUser.id}`,
          {
            userRole: updatedRole,
          }
        );
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  userRole: updatedRole as
                    | "user"
                    | "admin"
                    | "support"
                    | "marketing",
                }
              : user
          )
        );
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error updating user:", error);
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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.userType.toLowerCase().includes(search.toLowerCase()) ||
      user.userRole.toLowerCase().includes(search.toLowerCase())
  );
  // pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="px-2">
      <h1 className="text-2xl font-bold mb-4">
        Users Management ({users.length})
      </h1>
      <Input
        placeholder="Search Users by Name, Email, User Type, User Role......"
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-1/2"
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
            <th className="border p-2 items-start">User Auth</th>
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
          ) : filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center text-red-500">
                No search results found.
              </td>
            </tr>
          ) : (
            currentUsers.map((user, index) => (
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
                  {user.userAuth ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </td>
                <td className="p-2 border space-x-2 flex">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUser(user);
                      setUpdatedRole(user.userRole);
                      setIsDialogOpen(true);
                    }}
                    className={`${
                      user.userRole === "admin"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={user.userRole === "admin"} // Disable button for admins
                  >
                    <Pencil size={18} />
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsViewOpen(true);
                    }}
                  >
                    <Eye size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(user.id)}
                    className={`text-red-500 ${
                      user.userRole === "admin"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={user.userRole === "admin"} // Disable button for admins
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2">
              {Object.entries(selectedUser).map(([key, value]) => (
                <p key={key} className="break-all">
                  <strong>
                    {key.replace(/([A-Z])/g, " $1").toUpperCase()}:
                  </strong>{" "}
                  {value || "N/A"}
                </p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div>
              <Select value={updatedRole} onValueChange={setUpdatedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button onClick={handleUpdate}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomPagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Page;
