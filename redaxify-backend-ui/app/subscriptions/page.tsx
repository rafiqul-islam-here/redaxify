"use client";

import Image from "next/image";
import Link from "next/link";
import { Cpu, HardDrive, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/subscriptions`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch plans");
        }
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen flex items-center justify-center">
        <div className="text-white">Loading plans...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 px-6 md:px-20 lg:px-36 bg-[#090E30] min-h-screen relative overflow-hidden">
      {/* Elegant tech background elements - Pure Tailwind */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Circuit board pattern */}
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

        {/* Floating tech elements */}
        <div className="absolute top-1/4 left-1/5 opacity-10">
          <svg
            width="150"
            height="150"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.8"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <div className="absolute bottom-1/3 right-1/4 opacity-10">
          <svg
            width="180"
            height="180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.8"
          >
            <path d="M18 6L6 18M6 6l12 12" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>

        {/* Subtle binary fade */}
        <div className="absolute bottom-10 left-10 font-mono text-xs text-blue-400/10 tracking-widest">
          <div className="animate-[float_8s_ease-in-out_infinite]">
            011010 110101 101011
          </div>
          <div className="animate-[float_8s_ease-in-out_infinite_1s]">
            100110 010110 101001
          </div>
          <div className="animate-[float_8s_ease-in-out_infinite_2s]">
            110100 101010 010101
          </div>
        </div>

        {/* Floating nodes */}
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-blue-400/20 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-20 w-3 h-3 rounded-full bg-blue-400/15 animate-pulse animate-delay-300"></div>
        <div className="absolute top-20 right-1/3 w-2 h-2 rounded-full bg-blue-400/10 animate-pulse animate-delay-500"></div>
      </div>

      {/* Soft ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2.5 mb-3.5">
            <Image
              src="/icons/star.png"
              alt="CommunityC Logo"
              height={38}
              width={38}
              className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            />
            <h2 className="text-3xl font-bold text-white">Choose Your Plan</h2>
          </div>
          <p className="text-[#A7ADBE] max-w-2xl mx-auto text-lg">
            Simple pricing for every need. Pay as you grow.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan: any) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-xl border transition-all duration-300 overflow-hidden
                ${
                  plan.featured
                    ? "border-blue-500 bg-gradient-to-b from-[#0F1436] to-[#151A3A] shadow-xl shadow-blue-900/20 hover:shadow-blue-900/30"
                    : "border-[#1F2445] bg-[#0F1436] hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-900/10"
                }`}
            >
              {/* Card lighting */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 
                ${plan.featured ? "bg-blue-500/15" : "bg-blue-400/10"} 
                rounded-br-full blur-[50px] pointer-events-none`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 w-24 h-24 
                ${plan.featured ? "bg-blue-400/10" : "bg-blue-300/5"} 
                rounded-tl-full blur-[30px] pointer-events-none`}
              ></div>

              {plan.featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center z-10 shadow-lg shadow-blue-500/30">
                  <Zap className="w-3 h-3 mr-1 fill-current" />
                  Recommended
                </div>
              )}

              {/* Card content */}
              <div className="relative z-10 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white capitalize">
                    {plan.name}
                  </h3>
                  <div className="p-2 bg-[#1F2445] rounded-full text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                    <Image
                      src="/icons/tick.svg"
                      alt="Check"
                      width={24}
                      height={24}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
                <p className="text-[#A7ADBE] mb-6">{plan.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="p-2 mr-3 bg-[#1F2445] rounded-lg text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {plan.gpuLimit} GPU Cores
                      </p>
                      <p className="text-[#A7ADBE] text-sm">
                        High performance computing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="p-2 mr-3 bg-[#1F2445] rounded-lg text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {plan.storageLimit} GB Storage
                      </p>
                      <p className="text-[#A7ADBE] text-sm">Fast SSD storage</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="p-2 mr-3 bg-[#1F2445] rounded-lg text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {plan.durationDays} Days
                      </p>
                      <p className="text-[#A7ADBE] text-sm">
                        Flexible duration
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="mb-6">
                  <p className="text-white text-3xl font-bold">
                    ${plan.price}
                    <span className="text-base text-[#A7ADBE] font-medium ml-1">
                      / {plan.durationDays} days
                    </span>
                  </p>
                </div>
                <Link
                  href={`/subscriptions/${plan.id}`}
                  className={`w-full py-3 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center
                    ${
                      plan.featured
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                        : "bg-[#1F2445] hover:bg-[#2A3155]"
                    }`}
                >
                  Select Plan
                  {plan.featured && (
                    <Zap className="w-4 h-4 ml-2 fill-current" />
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
