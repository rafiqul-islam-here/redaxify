"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter, useParams } from "next/navigation";
import Loader from "@/components/dashboard/Loader";
import InLoader from "@/components/InLoader";
import toast from "react-hot-toast";
import Link from "next/link";

interface CouponUser {
  id: number;
  name: string;
  customerNumber: number;
  userRole: "user" | "admin" | "support" | "marketing";
}

interface CouponData {
  id: number;
  code: string;
  discountValue: string;
  discountType: "percentage" | "fixed";
  startDate: string;
  endDate: string;
  isActive: boolean;
  userId: number | null;
  usageLimit: string;
}

const Page = () => {
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [users, setUsers] = useState<CouponUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    discountValue?: string;
    usageLimit?: string;
  }>({});

  const router = useRouter();
  const { id } = useParams();
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  // Fetch coupon details
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/dashboard/billing/coupons/${id}`
        );
        // console.log("Coupon response:", response);
        // Transform API response to match our form state
        const couponData = {
          ...response.data,
          // Convert backend format to form format
          userId: response.data.userId || null,
          startDate: formatDateForInput(response.data.startDate),
          endDate: formatDateForInput(response.data.endDate),
        };
        setCoupon(couponData);
      } catch (err) {
        console.error("Error fetching coupon:", err);
        setError("Failed to load coupon details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get<CouponUser[]>(
          `${API_BASE_URL}/api/dashboard/users`
        );
        setUsers(response.data.filter((user) => user.userRole !== "admin"));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchCoupon();
    fetchUsers();
  }, [id, API_BASE_URL]);

  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return "";
    return isoDate.split("T")[0];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (coupon) {
      const { name, value } = e.target;

      // Clear validation error when user changes the field
      if (name === "discountValue" && validationErrors.discountValue) {
        setValidationErrors((prev) => ({ ...prev, discountValue: undefined }));
      }
      if (name === "usageLimit" && validationErrors.usageLimit) {
        setValidationErrors((prev) => ({ ...prev, usageLimit: undefined }));
      }

      setCoupon({ ...coupon, [name]: value });
    }
  };

  const handleUserAssignment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (coupon) {
      const value = e.target.value;
      setCoupon({
        ...coupon,
        userId: value === "all" ? null : Number(value),
      });
    }
  };

  const toggleActive = () => {
    if (coupon) {
      setCoupon({ ...coupon, isActive: !coupon.isActive });
    }
  };

  const validateForm = () => {
    if (!coupon) return false;

    const errors: typeof validationErrors = {};
    let isValid = true;

    if (parseFloat(coupon.discountValue) <= 0) {
      errors.discountValue = "Discount value must be positive";
      isValid = false;
    }

    if (
      coupon.discountType === "percentage" &&
      parseFloat(coupon.discountValue) > 100
    ) {
      errors.discountValue = "Percentage discount cannot exceed 100%";
      isValid = false;
    }

    if (parseInt(coupon.usageLimit, 10) <= 0) {
      errors.usageLimit = "Usage limit must be positive";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;

    if (!validateForm()) {
      return;
    }

    setUpdating(true);

    try {
      // Prepare data for API
      const payload = {
        ...coupon,
        discountValue: parseFloat(coupon.discountValue),
        usageLimit: parseInt(coupon.usageLimit, 10),
      };

      await axios.patch(
        `${API_BASE_URL}/api/dashboard/billing/coupons/${id}`,
        payload
      );

      toast.success("Coupon updated successfully!");
      router.push("/dashboard/billing/coupons");
    } catch (err) {
      console.error("Error updating coupon:", err);
      toast.error("Failed to update coupon.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="text-center">
        <Loader />
      </div>
    );
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!coupon) return <p className="text-center">Coupon not found</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Coupon</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Coupon Code */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            Coupon Code <span className="text-red-500">*</span>
          </label>
          <Input
            name="code"
            value={coupon.code}
            onChange={handleChange}
            required
            className="focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Discount Value & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Discount Value <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="discountValue"
              value={coupon.discountValue}
              onChange={handleChange}
              required
              className={`focus:ring-2 focus:ring-blue-500 ${
                validationErrors.discountValue ? "border-red-500" : ""
              }`}
              min="0"
              step={coupon.discountType === "percentage" ? "0.01" : "1"}
            />
            {validationErrors.discountValue && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.discountValue}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <select
              name="discountType"
              value={coupon.discountType}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
        </div>

        {/* Start & End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Valid From <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="startDate"
              value={coupon.startDate}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Valid Until <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="endDate"
              value={coupon.endDate}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            Assigned To
          </label>
          <select
            value={coupon.userId === null ? "all" : coupon.userId.toString()}
            onChange={handleUserAssignment}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Usage Limit */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            Usage Limit <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            name="usageLimit"
            value={coupon.usageLimit}
            onChange={handleChange}
            required
            className={`focus:ring-2 focus:ring-blue-500 ${
              validationErrors.usageLimit ? "border-red-500" : ""
            }`}
            min="1"
          />
          {validationErrors.usageLimit && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.usageLimit}
            </p>
          )}
        </div>

        {/* Is Active Toggle */}
        <div className="flex items-center gap-4">
          <label className="font-semibold text-gray-700">Is Active?</label>
          <Switch checked={coupon.isActive} onCheckedChange={toggleActive} />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-md transition duration-200"
            disabled={updating}
          >
            {updating ? <InLoader size={48} /> : "Update Coupon"}
          </Button>
          <Link href="/dashboard/billing/coupons" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full font-semibold py-2 rounded-md transition duration-200"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Page;
