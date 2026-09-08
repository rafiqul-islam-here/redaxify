"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import eye icons
import axios from "axios";
import { CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import InLoader from "./InLoader";
import TypingHeading from "./TypeHeading";

type FormData = {
  email: string;
};

const Forget = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const emailValue = watch("email");
  const isEmailValid = /^\S+@\S+\.\S+$/.test(emailValue);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      // console.log("Form Data:", data);
      const userdata = { email: data.email };
      // console.log(userdata);
      const apiUrl = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
      const response = await axios.post(
        `${apiUrl}/api/users/forget`,
        userdata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        toast.success("Password change mail Send!");
        router.push(`/otp?email=${userdata.email}&source=RESET`);
        // router.push(`/sign-in`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      // Type assertion
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("User not exists!");
        } else {
          toast.error("Reset mail send Failed!");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setLoading(false);
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
            height={30}
            width={30}
          />
          <TypingHeading />
        </div>

        {/* Heading */}
        <h2 className="text-white text-2xl font-bold text-center">
          Forgot Password
        </h2>
        <p className="text-gray-400 text-center text-xs mt-5 mb-6">
          No worries, we’ll send you reset instructions
        </p>
      </div>
      <div className="max-w-md w-full bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-9 rounded-2xl shadow-lg">
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div className="relative">
            <Label className="text-white text-sm mb-2">Email</Label>
            <Input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="you@company.com"
              className="bg-[#0A0D1F] border-2 border-[#515152] text-white"
            />
            {isEmailValid && (
              <CircleCheck className="absolute right-2 top-9 text-green-500" />
            )}
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-linear-to-r from-[#335FFF] to-[#1A4BFF] cursor-pointer"
            disabled={loading}
          >
            {loading ? <InLoader size={48} /> : "Reset Password"}
          </Button>
        </form>
        <div className="text-center text-white mt-8 text-xs">
          <Link href="/sign-in" className="font-semibold">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forget;
