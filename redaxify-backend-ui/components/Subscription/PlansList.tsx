"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { useSelector } from "react-redux";
// import { RootState } from "@/store/store";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  gpuLimit: number;
  storageLimit: number;
  durationDays: number;
}

export default function PlansList() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  // const user = useSelector((state: RootState) => state.user);
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/subscriptions`);
        setPlans(response.data);
      } catch (err) {
        setError("Failed to load subscription plans");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [API_BASE_URL]);

  const handleSelectPlan = (planId: number) => {
    router.push(`/subscription/checkout?planId=${planId}`);
  };

  if (loading) return <div className="text-center py-8">Loading plans...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-gray-600 my-2">{plan.description}</p>
          <p className="text-2xl font-bold my-4">
            ${plan.price.toFixed(2)}
            <span className="text-sm font-normal">/month</span>
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              GPU: {plan.gpuLimit} hours/month
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Storage: {plan.storageLimit} GB
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Billed every {plan.durationDays} days
            </li>
          </ul>
          <button
            onClick={() => handleSelectPlan(plan.id)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Select Plan
          </button>
        </div>
      ))}
    </div>
  );
}
