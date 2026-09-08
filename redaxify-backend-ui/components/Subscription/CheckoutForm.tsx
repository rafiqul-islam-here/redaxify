"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
}

interface Coupon {
  id: number;
  code: string;
  discountValue: number;
  discountType: string;
  assignedTo: string;
}

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    if (!planId) {
      router.push("/subscription");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch plan details
        const planResponse = await axios.get(
          `${API_BASE_URL}/api/subscriptions/${planId}`
        );
        setPlan(planResponse.data);
        setFinalPrice(planResponse.data.price);

        // Fetch available coupons
        const couponsResponse = await axios.get(
          `${API_BASE_URL}/api/dashboard/billing/coupons`
        );
        const userCoupons = couponsResponse.data.filter(
          (c: Coupon) =>
            c.assignedTo === "all" ||
            c.assignedTo === user?.customerNumber?.toString()
        );
        setCoupons(userCoupons);
      } catch (err) {
        setError("Failed to load checkout data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId, user.customerNumber, router, API_BASE_URL]);

  const handleCouponApply = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    if (plan) {
      const discount =
        coupon.discountType === "percentage"
          ? plan.price * (coupon.discountValue / 100)
          : coupon.discountValue;
      setFinalPrice(Math.max(plan.price - discount, 0));
    }
  };

  const handleCheckout = async () => {
    if (!plan) return;

    try {
      // 1. Create checkout session
      const response = await axios.post(`${API_BASE_URL}/api/subscriptions`, {
        planId: plan.id,
        couponCode: selectedCoupon?.code || null,
        user: {
          // Send all required user data
          id: user.id,
          email: user.email,
          name: user.name,
          customerNumber: user.customerNumber,
          stripeCustomerId: user.stripeCustomerId || null,
        },
      });

      // 2. Redirect to Stripe
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate checkout");
      console.error(err);
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading checkout...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!plan) return <div className="text-center py-8">Plan not found</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Complete Your Subscription
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Plan Price:</span>
            <span>${plan.price.toFixed(2)}</span>
          </div>

          {selectedCoupon && (
            <div className="flex justify-between">
              <span>Discount Applied:</span>
              <span className="text-green-600">
                -${(plan.price - finalPrice).toFixed(2)}
              </span>
            </div>
          )}

          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Total:</span>
            <span>${finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Available Coupons</h3>
        {coupons.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {coupons.map((coupon) => (
              <button
                key={coupon.id}
                onClick={() => handleCouponApply(coupon)}
                className={`p-2 border rounded text-sm ${
                  selectedCoupon?.id === coupon.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{coupon.code}</div>
                <div className="text-xs text-gray-600">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% off`
                    : `$${coupon.discountValue} off`}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No coupons available for you</p>
        )}
      </div>

      <button
        onClick={handleCheckout}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        Proceed to Payment
      </button>
    </div>
  );
}
