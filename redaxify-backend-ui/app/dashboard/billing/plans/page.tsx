"use client";
import CustomPagination from "@/components/dashboard/CustomPagination";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  gpuLimit: number;
  storageLimit: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
}

const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    axios
      .get(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription`
      )
      .then((res) => {
        setPlans(res.data);
      })
      .catch(() => {
        toast.error("Failed to fetch subscription plans.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Pagination logic
  const plansPerPage = 8;
  const totalPages = Math.ceil(plans.length / plansPerPage);
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = plans.slice(indexOfFirstPlan, indexOfLastPlan);

  const handleDelete = (id: number) => {
    toast.custom((t) => (
      <div className="bg-white shadow-md border border-gray-200 rounded-md p-4 w-80">
        <p className="text-sm text-gray-800 mb-4">
          Are you sure you want to delete this plan?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await axios.delete(
                  `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription/${id}`
                );
                setPlans((prev) => prev.filter((plan) => plan.id !== id));
                toast.dismiss(t.id);
                toast.success("Plan deleted successfully!");
              } catch (error) {
                toast.dismiss(t.id);
                toast.error("Failed to delete plan.");
                console.log(error);
              }
            }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Confirm
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="px-2 py-4">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Subscription Plans ({plans.length})
        </h1>
        <Link href={`/dashboard/billing/create-plan`}>
          <Button className="flex gap-2 items-center">
            <Plus size={18} /> Create Plan
          </Button>
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : plans.length === 0 ? (
        <div className="text-center text-gray-500">
          No subscription plans found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">GPU Limit (Core)</th>
                <th className="p-3 border">Storage Limit (GB)</th>
                <th className="p-3 border">Duration (Days)</th>
                <th className="p-3 border">Created At</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPlans.map((plan, i) => (
                <tr
                  key={plan.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-3 border font-semibold">{plan.name}</td>
                  <td className="p-3 border">${plan.price}</td>
                  <td className="p-3 border">{plan.gpuLimit}</td>
                  <td className="p-3 border">{plan.storageLimit}</td>
                  <td className="p-3 border">{plan.durationDays}</td>
                  <td className="p-3 border">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        plan.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/billing/create-plan/${plan.id}`
                          )
                        }
                        className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SubscriptionPlansPage;
