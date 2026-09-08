"use client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"; // OTP components
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import InLoader from "./InLoader";
import TypingHeading from "./TypeHeading";

type FormData = {
  otp: string;
};

const OtpPage = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourse = searchParams.get("source");
  const email = searchParams.get("email");
  console.log(sourse);
  console.log(email);
  const [loading, setLoading] = useState(false);
  const onSubmit = async (data: FormData) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
    try {
      setLoading(true);
      console.log("Form Data:", data);
      const userdata = { token: data.otp };
      // console.log(userdata);
      const response = await axios.post(
        `${API_BASE_URL}/api/users/verifyotp`,
        userdata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // console.log(response);
      if (response.status === 200) {
        toast.success("OTP Verified");
        if (sourse === "VERIFY") {
          router.push(`/sign-in`);
        } else {
          router.push(`/reset-password?email=${email}`);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          // console.log(error);
          toast.error(error.response.data.error);
        } else {
          toast.error("OTP Check Failed!");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setLoading(false);
    }
  };
  const [isResending, setIsResending] = useState(false);
  const handleResendOTP = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
    if (!email) {
      toast.error("Email not found!");
      return;
    }
    setIsResending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/resendotp`, {
        source: sourse,
        email,
      });

      if (response.status === 200) {
        toast.success("OTP Resent Successfully!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("Failed to resend OTP!");
        } else {
          toast.error("OTP Check Failed!");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setIsResending(false);
    }
  };
  return (
    <div className="flex justify-center flex-col items-center min-h-screen">
      <div>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
      <div>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image
            src="/icons/star.png"
            alt="CommunityC Logo"
            height={50}
            width={50}
          />
          <TypingHeading />
        </div>

        {/* Heading */}
        <h2 className="text-white text-2xl font-bold text-center">
          Enter Passcode
        </h2>
        <p className="text-gray-400 text-center mt-1 mb-6">
          We sent a code to {email}
        </p>
      </div>
      <div className="max-w-md w-full bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-9 rounded-2xl shadow-lg">
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* OTP Input Fields */}
          <div>
            <Controller
              name="otp"
              control={control}
              rules={{ required: "OTP is required", minLength: 6 }}
              render={({ field }) => (
                <InputOTP {...field} className="w-full" maxLength={6}>
                  <InputOTPGroup className="w-full flex justify-between gap-2 ">
                    <InputOTPSlot
                      index={0}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                    <InputOTPSlot
                      index={1}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                    <InputOTPSlot
                      index={2}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                    <InputOTPSlot
                      index={3}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                    <InputOTPSlot
                      index={4}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                    <InputOTPSlot
                      index={5}
                      className="flex-1 text-center bg-[#0A0D1F] text-white border border-gray-500 rounded-md text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-8 h-12"
                    />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {errors.otp && (
              <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
            disabled={loading}
          >
            {loading ? <InLoader size={40} /> : "Verify OTP"}
          </Button>
        </form>
        <div className="text-gray-400 text-center">
          <p className="my-4 text-sm">
            Didn’t receive the code?{" "}
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="font-bold text-white cursor-pointer disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend"}
            </button>
          </p>
          <Link href="/sign-in" className="mt-10 text-sm">
            Back to <span className="font-bold text-white">Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
