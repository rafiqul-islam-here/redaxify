"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface FormState {
  name: string;
  description: string;
  price: string;
  gpuLimit: string;
  storageLimit: string;
  durationDays: string;
  isActive: boolean;
}

const UpdatePlanPage = () => {
  const { id: planId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    price: "",
    gpuLimit: "",
    storageLimit: "",
    durationDays: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setInitialLoad(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription/${planId}`
        );
        const plan = res.data;

        setForm({
          name: plan.name,
          description: plan.description || "",
          price: plan.price.toString(),
          gpuLimit: plan.gpuLimit.toString(),
          storageLimit: plan.storageLimit.toString(),
          durationDays: plan.durationDays.toString(),
          isActive: plan.isActive,
        });
      } catch (error) {
        toast.error("Failed to load plan data. Please try again.");
        console.error("Plan fetch error:", error);
        router.push("/dashboard/billing/plans");
      } finally {
        setInitialLoad(false);
      }
    };

    if (planId) fetchPlan();
  }, [planId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const validateForm = (): boolean => {
    const numericFields = [
      { name: "Price", value: form.price, min: 1 },
      { name: "GPU Limit", value: form.gpuLimit, min: 1 },
      { name: "Storage Limit", value: form.storageLimit, min: 1 },
      { name: "Duration", value: form.durationDays, min: 1 },
    ];

    for (const field of numericFields) {
      const numValue = Number(field.value);
      if (isNaN(numValue)) {
        toast.error(`${field.name} must be a valid number`);
        return false;
      }
      if (numValue < field.min) {
        toast.error(`${field.name} must be at least ${field.min}`);
        return false;
      }
    }

    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return false;
    }

    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription/${planId}`,
        {
          name: form.name.trim(),
          description: form.description.trim(),
          price: parseFloat(form.price),
          gpuLimit: parseInt(form.gpuLimit),
          storageLimit: parseInt(form.storageLimit),
          durationDays: parseInt(form.durationDays),
          isActive: form.isActive,
        }
      );

      toast.success("Plan updated successfully!");
      router.push("/dashboard/billing/plans");
      router.refresh(); // Ensure the list page gets fresh data
    } catch (error: any) {
      console.error("Update error:", error);

      let errorMessage = "Failed to update plan. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
        if (error.response?.status === 404) {
          errorMessage = "Plan not found. It may have been deleted.";
        } else if (error.response?.status === 409) {
          errorMessage = "A plan with this name already exists.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 shadow-md rounded-2xl border border-gray-200">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={handleUpdate}
        className="bg-white p-6 shadow-md rounded-2xl border border-gray-200"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Plan</h2>

        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <Input
                name="price"
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPU Limit *
              </label>
              <Input
                name="gpuLimit"
                type="number"
                min="1"
                value={form.gpuLimit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Limit (GB) *
              </label>
              <Input
                name="storageLimit"
                type="number"
                min="1"
                value={form.storageLimit}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Days) *
              </label>
              <Input
                name="durationDays"
                type="number"
                min="1"
                value={form.durationDays}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Active</label>
            <Switch checked={form.isActive} onCheckedChange={handleToggle} />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/billing/plans")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Updating...
                </span>
              ) : (
                "Update Plan"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdatePlanPage;
