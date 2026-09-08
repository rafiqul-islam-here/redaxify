"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormState {
  name: string;
  description: string;
  price: string;
  gpuLimit: string;
  storageLimit: string;
  durationDays: string;
  isActive: boolean;
}

const CreatePlanForm = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    price: "",
    gpuLimit: "",
    storageLimit: "",
    durationDays: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const validateForm = (): string | null => {
    const { name, description, price, gpuLimit, storageLimit, durationDays } =
      form;

    if (!name.trim()) return "Plan name is required.";
    if (name.length > 50) return "Plan name must be less than 50 characters.";
    if (!description.trim()) return "Description is required.";
    if (description.length > 500)
      return "Description must be less than 500 characters.";

    const numericFields = [
      { name: "Price", value: price, min: 1, max: 10000 },
      { name: "GPU limit", value: gpuLimit, min: 1, max: 100 },
      { name: "Storage limit", value: storageLimit, min: 1, max: 10000 },
      { name: "Duration", value: durationDays, min: 1, max: 3650 }, // 10 years max
    ];

    for (const field of numericFields) {
      const numValue = Number(field.value);
      if (isNaN(numValue)) {
        return `${field.name} must be a valid number.`;
      }
      if (numValue < field.min) {
        return `${field.name} must be at least ${field.min}.`;
      }
      if (numValue > field.max) {
        return `${field.name} must be less than ${field.max}.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      return setMessage({ type: "error", text: validationError });
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription`,
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
      console.log(response);

      setMessage({
        type: "success",
        text: "Subscription plan created successfully! Redirecting...",
      });

      setTimeout(() => {
        router.push("/dashboard/billing/plans");
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Plan creation error:", error);

      let errorMessage = "Failed to create plan. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
        if (error.response?.status === 409) {
          errorMessage = "A plan with this name already exists.";
        }
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded-2xl border border-gray-200"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create Subscription Plan
        </h2>

        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <Input
              name="name"
              placeholder="e.g. Pro, Premium"
              value={form.name}
              onChange={handleChange}
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Max 50 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Textarea
              name="description"
              placeholder="Describe what this plan offers"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <Input
                name="price"
                type="number"
                min="0"
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

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

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
                  Creating...
                </span>
              ) : (
                "Create Plan"
              )}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-4 text-sm text-gray-500">
        <p>* Required fields</p>
      </div>
    </div>
  );
};

export default CreatePlanForm;
