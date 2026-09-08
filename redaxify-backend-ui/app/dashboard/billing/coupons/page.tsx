"use client";
import CustomPagination from "@/components/dashboard/CustomPagination";
import Loader from "@/components/dashboard/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

interface Coupon {
  id: number;
  code: string;
  discountValue: number;
  discountType: "percentage" | "fixed";
  startDate: string;
  endDate: string;
  isActive: boolean;
  userId: number | null;
  user?: {
    name: string;
    customerNumber: number;
  };
  usageLimit: number;
  usages?: {
    timesUsed: number;
  }[];
}

const Page = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/dashboard/billing/coupons`, {
        params: {
          include: "user", // Request user data with coupons
        },
      })
      .then((response) => {
        setCoupons(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching coupons:", error);
        setLoading(false);
      });
  }, [API_BASE_URL]);

  // Format coupon for display
  const formatCouponForDisplay = (coupon: Coupon) => {
    return {
      ...coupon,
      assignedTo: coupon.userId
        ? coupon.user?.name || `User #${coupon.userId}`
        : "All Users",
      totalUses:
        coupon.usages?.reduce((sum, usage) => sum + usage.timesUsed, 0) || 0,
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    setLoadingSearch(true);
    const timeout = setTimeout(() => {
      setLoadingSearch(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = (id: number) => {
    toast.custom((t) => (
      <div className="bg-white shadow-lg border rounded p-4 w-80">
        <p className="text-sm mb-4">
          Are you sure you want to delete this coupon?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            onClick={async () => {
              try {
                await axios.delete(
                  `${API_BASE_URL}/api/dashboard/billing/coupons/${id}`
                );
                setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
                toast.dismiss(t.id);
                toast.success("Coupon deleted successfully!");
              } catch (err) {
                console.error("Error deleting coupon:", err);
                toast.dismiss(t.id);
                toast.error("Failed to delete coupon. Please try again.");
              }
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    ));
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const formattedCoupon = formatCouponForDisplay(coupon);
    return (
      coupon.code.toLowerCase().includes(search.toLowerCase()) ||
      coupon.discountValue
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      coupon.discountType.toLowerCase().includes(search.toLowerCase()) ||
      formattedCoupon.assignedTo.toLowerCase().includes(search.toLowerCase())
    );
  });

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCoupons = filteredCoupons.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <div className="px-2 py-4">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Coupons List ({coupons.length})</h1>
        <Link href="/dashboard/billing/create-coupon">
          <Button className="flex items-center gap-2 cursor-pointer">
            <Plus size={18} /> Create Coupon
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <Input
          placeholder="Search Coupons by Code, Discount Value, Discount Type or Assigned To"
          value={search}
          onChange={handleSearchChange}
          className="w-1/2"
        />
        {loadingSearch && <div>Searching...</div>}
      </div>

      {loading ? (
        <div className="text-center">
          <Loader />
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-4 text-center text-gray-500 font-semibold">
          No coupons available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">Code</th>
                <th className="border p-2">Discount Value</th>
                <th className="border p-2">Discount Type</th>
                <th className="border p-2">Validation (Start - End)</th>
                <th className="border p-2">Active</th>
                <th className="border p-2">Assigned To</th>
                <th className="border p-2">Usage Limit</th>
                <th className="border p-2">Used</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-4 text-center text-red-500 font-semibold"
                  >
                    No search results found.
                  </td>
                </tr>
              ) : (
                currentCoupons.map((coupon, index) => {
                  const formattedCoupon = formatCouponForDisplay(coupon);
                  return (
                    <tr
                      key={coupon.id}
                      className={`border ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-2 border font-semibold">
                        {coupon.code}
                      </td>
                      <td className="p-2 border">
                        {coupon.discountValue}
                        {coupon.discountType === "percentage" ? "%" : ""}
                      </td>
                      <td className="p-2 border">
                        {coupon.discountType.toUpperCase()}
                      </td>
                      <td className="p-2 border">
                        {formatDate(coupon.startDate)} -{" "}
                        {formatDate(coupon.endDate)}
                      </td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            coupon.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-2 border">
                        {formattedCoupon.assignedTo === "All Users" ? (
                          <span className="text-gray-600">All Users</span>
                        ) : (
                          <span className="text-blue-600">
                            {formattedCoupon.assignedTo}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border">{coupon.usageLimit}</td>
                      <td className="p-2 border">
                        {formattedCoupon.totalUses}
                      </td>
                      <td className="p-2 border">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/billing/coupons/${coupon.id}`
                              )
                            }
                            className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <CustomPagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredCoupons.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Page;
