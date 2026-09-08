"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import React, { useEffect, useState } from "react";
import InLoader from "@/components/InLoader";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

interface CouponUser {
  id: number;
  customerNumber: number;
  name: string;
  email: string;
  userRole: "user" | "admin" | "support" | "marketing";
}

interface CouponData {
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
  const [coupon, setCoupon] = useState<CouponData>({
    code: "",
    discountValue: "",
    discountType: "percentage",
    startDate: "",
    endDate: "",
    isActive: true,
    userId: null,
    usageLimit: "",
  });

  const [users, setUsers] = useState<CouponUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    discountValue?: string;
    usageLimit?: string;
  }>({});

  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get<CouponUser[]>(
          `${API_BASE_URL}/api/dashboard/users`
        );
        const filteredUsers = response.data.filter(
          (user) => user.userRole !== "admin"
        );
        setUsers(filteredUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users.");
      }
    };

    fetchUsers();
  }, [API_BASE_URL]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear validation error when user changes the field
    if (name === "discountValue" && validationErrors.discountValue) {
      setValidationErrors((prev) => ({ ...prev, discountValue: undefined }));
    }
    if (name === "usageLimit" && validationErrors.usageLimit) {
      setValidationErrors((prev) => ({ ...prev, usageLimit: undefined }));
    }

    setCoupon({ ...coupon, [name]: value });
  };

  const handleUserAssignment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCoupon({
      ...coupon,
      userId: value === "all" ? null : Number(value),
    });
  };

  const toggleActive = () => {
    setCoupon({ ...coupon, isActive: !coupon.isActive });
  };

  const validateForm = () => {
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

    if (!validateForm()) {
      return;
    }

    setCreating(true);

    try {
      const payload = {
        ...coupon,
        discountValue: parseFloat(coupon.discountValue),
        usageLimit: parseInt(coupon.usageLimit, 10),
      };

      await axios.post(
        `${API_BASE_URL}/api/dashboard/billing/coupons`,
        payload
      );

      // Reset form
      setCoupon({
        code: "",
        discountValue: "",
        discountType: "percentage",
        startDate: "",
        endDate: "",
        isActive: true,
        userId: null,
        usageLimit: "",
      });

      router.push("/dashboard/billing/coupons");
      toast.success("Coupon created successfully!");
    } catch (err) {
      console.error("Error creating coupon:", err);
      toast.error("Failed to create coupon.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Coupon</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
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
            <div className="relative">
              <Input
                type="date"
                name="startDate"
                value={coupon.startDate}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
              <Calendar
                className="absolute right-3 top-3 text-gray-500"
                size={18}
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Valid Until <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                name="endDate"
                value={coupon.endDate}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
              <Calendar
                className="absolute right-3 top-3 text-gray-500"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Assigned To & Usage Limit */}
        <div className="grid grid-cols-2 gap-4">
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
            disabled={creating}
          >
            {creating ? <InLoader size={48} /> : "Create Coupon"}
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
