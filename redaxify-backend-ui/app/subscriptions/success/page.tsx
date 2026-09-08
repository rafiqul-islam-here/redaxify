"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { updateUser } from "@/store/userSlice";
import { Check, X, Loader2, Zap } from "lucide-react";
import Image from "next/image";

export default function SuccessPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090E30] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-white text-lg">
              Loading payment verification...
            </p>
          </div>
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  );
}

function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
  console.log(isVerified);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("Missing session ID");
      setIsLoading(false);
      setTimeout(() => router.push("/subscriptions"), 3000);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/verify-session?session_id=${sessionId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        dispatch(
          updateUser({
            userType: data.user?.userType || "premium",
            userAuth: true,
            currentSubscriptionId: data.subscription?.planId,
            stripeCustomerId: data.subscription?.stripeSubId,
          })
        );

        setIsVerified(true);
      } catch (err) {
        console.error("Payment verification failed:", err);
        setError(
          err instanceof Error ? err.message : "Payment verification failed"
        );
        setTimeout(() => router.push("/subscriptions/failed"), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, dispatch, API_BASE_URL]);

  if (error) {
    return (
      <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen relative overflow-hidden">
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

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Image
              src="/icons/star.png"
              alt="Logo"
              height={32}
              width={32}
              className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            />
            <h1 className="text-3xl font-bold text-white">Payment Failed</h1>
          </div>

          <div className="bg-[#0F1436] border border-[#1F2445] rounded-xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-red-900/20 border border-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Verification Failed
            </h2>
            <p className="text-[#A7ADBE] mb-8">{error}</p>

            <div className="bg-[#1F2445] p-4 rounded-lg mb-8">
              <p className="text-white">
                We couldn&apos;t verify your payment. Please try again.
              </p>
            </div>

            <button
              onClick={() => router.push("/subscriptions")}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300"
            >
              Back to Subscriptions
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090E30] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-white text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen relative overflow-hidden">
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

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <Image
            src="/icons/star.png"
            alt="Logo"
            height={32}
            width={32}
            className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          />
          <h1 className="text-3xl font-bold text-white">Payment Successful</h1>
        </div>

        <div className="bg-[#0F1436] border border-[#1F2445] rounded-xl p-8 shadow-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-900/20 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Welcome to {user.userType || "premium"}!
            </h2>
            <p className="text-[#A7ADBE] mb-8">
              Your subscription is now active and ready to use.
            </p>

            <div className="bg-[#1F2445] p-4 rounded-lg mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <p className="text-white">Premium features unlocked</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
