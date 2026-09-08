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
import { CheckCircle, Eye, Trash2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

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

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // Number of users per page
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/users`);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_BASE_URL]);

  const handleDelete = (id: number) => {
    const confirmDelete = () =>
      new Promise<void>(async (resolve, reject) => {
        try {
          await axios.delete(`${API_BASE_URL}/api/dashboard/users/${id}`);
          setUsers((prev) => prev.filter((user) => user.id !== id));
          resolve();
        } catch (error) {
          console.error("Error deleting user:", error);
          reject("Failed to delete user.");
        }
      });

    toast(
      (t) => (
        <span className="flex flex-col gap-2">
          <span>Are you sure you want to delete this user?</span>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                toast.promise(confirmDelete(), {
                  loading: "Deleting...",
                  success: "User deleted successfully!",
                  error: (err) => err || "Something went wrong",
                });
                toast.dismiss(t.id);
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
          </div>
        </span>
      ),
      {
        duration: 5000,
      }
    );
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
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter and paginate
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.userRole.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="px-2">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">All Users ({users.length})</h1>
      <Input
        placeholder="Search users by Name, Email, Role......"
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-1/3"
      />

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">User Role</th>
            <th className="border p-2">User Type</th>
            <th className="border p-2">Auth</th>
            <th className="border p-2">Provider</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="p-4 text-center">
                <Loader />
              </td>
            </tr>
          ) : currentUsers.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center">
                No users found.
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
                <td className="p-2 border">{user.id}</td>
                <td className="p-2 border">{user.name}</td>
                <td className="p-2 border">{user.email}</td>
                <td
                  className={`p-2 border ${
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
                <td className="p-2 border">{user.userType}</td>
                <td className="p-2 border">
                  {user.userAuth ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </td>
                <td className="p-2 border">{user.provider || "Email"}</td>
                <td className="p-2 border flex gap-2">
                  {/* <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUser(user);
                      setUpdatedRole(user.userRole);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil size={18} />
                  </Button> */}
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
                    disabled={user.userRole === "admin"}
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* View Dialog */}
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

      {/* Role Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
