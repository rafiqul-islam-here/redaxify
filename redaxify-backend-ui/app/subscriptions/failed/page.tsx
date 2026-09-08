"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";
import Image from "next/image";

export default function FailedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/subscriptions");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

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
          <h1 className="text-3xl font-bold text-white">Payment Failed</h1>
        </div>

        <div className="bg-[#0F1436] border border-[#1F2445] rounded-xl p-8 shadow-lg text-center">
          <div className="w-20 h-20 bg-red-900/20 border border-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Payment Unsuccessful
          </h2>
          <p className="text-[#A7ADBE] mb-6">
            We couldn&apos;t process your subscription payment. Please try
            again.
          </p>

          <div className="bg-[#1F2445] p-4 rounded-lg mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <p className="text-white">
                No charges were applied to your account
              </p>
            </div>
          </div>

          <p className="text-[#A7ADBE] text-sm mb-6">
            You will be redirected to subscriptions in 5 seconds...
          </p>

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
