"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axios from "axios";
import { Zap, ChevronRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";

export default function SubscriptionCheckout({
  params,
}: {
  params: { id: string };
}) {
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const planId = Number(params.id);
  console.log(
    "Information Regarding User: ",
    user.customerNumber,
    user.id,
    user.name
  );

  // Calculate discounted price based on selected coupon
  const calculateDiscountedPrice = () => {
    if (!selectedCoupon || !planDetails) return planDetails?.price;

    const coupon = availableCoupons.find((c) => c.code === selectedCoupon);
    if (!coupon) return planDetails.price;

    return coupon.discountType === "percentage"
      ? planDetails.price * (1 - coupon.discountValue / 100)
      : Math.max(0, planDetails.price - coupon.discountValue);
  };

  const discountedPrice = calculateDiscountedPrice();
  const appliedCoupon = selectedCoupon
    ? availableCoupons.find((c) => c.code === selectedCoupon)
    : null;

  // Fetch available coupons and plan details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isNaN(planId)) {
          throw new Error("Invalid subscription plan ID");
        }

        // Fetch plan details
        const planResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/billing/subscription/${planId}`
        );

        if (!planResponse.data) {
          throw new Error("Subscription plan not found");
        }

        setPlanDetails(planResponse.data);

        // Fetch coupons if user is logged in
        if (user?.id) {
          const couponResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/coupons/available`,
            {
              userId: user?.id,
            }
          );
          setAvailableCoupons(couponResponse.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err.message || "Failed to load plan details");
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchData();
  }, [user?.id, planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!user?.id) {
        throw new Error("You must be logged in to complete your purchase");
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/subscriptions`,
        {
          userId: user.id,
          planId: Number(params.id),
          couponCode: selectedCoupon,
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-[#090E30] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-white text-lg">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-[#090E30] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Plan Not Found</h2>
          <p className="text-[#A7ADBE] mb-6">
            {error || "The subscription plan you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/subscriptions")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Available Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen relative overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full opacity-[3%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern
            id="circuit-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="#3B82F6" />
            <path
              d="M20,0 V40 M0,20 H40"
              stroke="#3B82F6"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <Image
            src="/icons/star.png"
            alt="Logo"
            height={32}
            width={32}
            className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          />
          <h1 className="text-3xl font-bold text-white">
            Complete Your Subscription
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary Card */}
          <div className="lg:col-span-2 bg-[#0F1436] border border-[#1F2445] rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize mb-1">
                  {planDetails.name} Plan
                </h2>
                <p className="text-[#A7ADBE]">{planDetails.description}</p>
              </div>
              <div className="bg-[#1F2445] px-4 py-2 rounded-lg">
                <p className="text-white text-xl font-bold">
                  ${planDetails.price}
                  <span className="text-sm text-[#A7ADBE] ml-1">
                    / {planDetails.durationDays} days
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1F2445] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="p-2 mr-3 bg-[#0F1436] rounded-lg text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <span className="text-white font-medium">GPU Cores</span>
                  </div>
                  <p className="text-2xl font-bold text-white ml-12">
                    {planDetails.gpuLimit}
                  </p>
                </div>

                <div className="bg-[#1F2445] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="p-2 mr-3 bg-[#0F1436] rounded-lg text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                      </svg>
                    </div>
                    <span className="text-white font-medium">Storage</span>
                  </div>
                  <p className="text-2xl font-bold text-white ml-12">
                    {planDetails.storageLimit} GB
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {availableCoupons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Zap className="w-5 h-5 text-blue-400 mr-2" />
                    Available Coupons
                  </h3>
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.code}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedCoupon === coupon.code
                            ? "border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20"
                            : "border-[#1F2445] hover:border-blue-400/30 hover:bg-[#1F2445]"
                        }`}
                        onClick={() =>
                          setSelectedCoupon(
                            selectedCoupon === coupon.code ? null : coupon.code
                          )
                        }
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {selectedCoupon === coupon.code ? (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-[#A7ADBE] mr-3"></div>
                            )}
                            <span className="font-medium text-white">
                              {coupon.code}
                            </span>
                          </div>
                          <span className="text-blue-400 font-semibold">
                            {coupon.discountValue}
                            {coupon.discountType === "percentage"
                              ? "%"
                              : "$"}{" "}
                            off
                          </span>
                        </div>
                        {selectedCoupon === coupon.code && (
                          <div className="text-sm text-[#A7ADBE] mt-3 pl-8">
                            <p className="flex items-center mb-1">
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Valid until:{" "}
                              {new Date(coupon.endDate).toLocaleDateString()}
                            </p>
                            <p className="flex items-center">
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Remaining uses:{" "}
                              {coupon.usageLimit -
                                (coupon.usages?.[0]?.timesUsed || 0)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Card */}
          <div className="bg-[#0F1436] border border-[#1F2445] rounded-xl p-6 shadow-lg h-fit sticky top-8">
            <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-[#A7ADBE]">Plan</span>
                <span className="text-white font-medium capitalize">
                  {planDetails.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7ADBE]">Duration</span>
                <span className="text-white font-medium">
                  {planDetails.durationDays} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7ADBE]">Base Price</span>
                <span className="text-white font-medium">
                  ${planDetails.price}
                </span>
              </div>

              {appliedCoupon && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#A7ADBE]">Discount Applied</span>
                    <span className="text-green-400 font-medium">
                      {appliedCoupon.discountValue}
                      {appliedCoupon.discountType === "percentage"
                        ? "%"
                        : "$"}{" "}
                      off
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A7ADBE]">Discount Amount</span>
                    <span className="text-green-400 font-medium">
                      {appliedCoupon.discountType === "percentage"
                        ? `-$${(
                            (planDetails.price * appliedCoupon.discountValue) /
                            100
                          ).toFixed(2)}`
                        : `-$${appliedCoupon.discountValue}`}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t border-[#1F2445] my-2"></div>

              <div className="flex justify-between">
                <span className="text-[#A7ADBE]">Total</span>
                <div className="flex flex-col items-end">
                  {appliedCoupon && (
                    <span className="text-sm text-[#A7ADBE] line-through">
                      ${planDetails.price}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-white">
                    ${discountedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !user?.id}
              className={`w-full py-3 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center
                ${
                  isLoading || !user?.id
                    ? "bg-[#1F2445] cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            {!user?.id && (
              <p className="text-sm text-red-400 mt-3 text-center">
                You must be logged in to complete your purchase
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
