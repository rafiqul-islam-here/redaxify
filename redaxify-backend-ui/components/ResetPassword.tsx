"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Check, Eye, EyeOff, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import InLoader from "./InLoader";
import TypingHeading from "./TypeHeading";

type FormData = {
  password: string;
  confirmPassword: string;
};

const ResetPassword = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { touchedFields },
  } = useForm<FormData>({
    mode: "onChange", // Enable validation on change for real-time feedback
  });

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation states
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isConfirmPasswordTouched, setIsConfirmPasswordTouched] =
    useState(false);

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  // Password validation rules
  const isPasswordLengthValid =
    passwordValue.length >= 8 && passwordValue.length <= 20;
  // const hasPasswordLetter = /[A-Za-z]/.test(passwordValue);
  // const hasPasswordNumber = /\d/.test(passwordValue);
  const isPasswordValid = isPasswordLengthValid;
  // && hasPasswordLetter && hasPasswordNumber;

  // Confirm password validation
  const doPasswordsMatch = confirmPasswordValue === passwordValue;
  const isConfirmPasswordValid =
    confirmPasswordValue.length > 0 && doPasswordsMatch;

  const searchParams = useSearchParams();
  const value = searchParams.get("email");
  const [loading, setLoading] = useState(false);

  // Watch for touched fields
  useEffect(() => {
    if (touchedFields.password) setIsPasswordTouched(true);
    if (touchedFields.confirmPassword) setIsConfirmPasswordTouched(true);
  }, [touchedFields]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      if (data.password === data.confirmPassword) {
        const userdata = {
          password: data.password,
          email: value,
        };
        const apiUrl = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
        const response = await axios.post(
          `${apiUrl}/api/users/reset`,
          userdata,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          toast.success("Password changed successfully!");
          router.push(`/sign-in`);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("User already exists!");
        } else {
          toast.error("Reset failed!");
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
          Reset Your Password
        </h2>
        <p className="text-gray-400 text-center text-sm mt-2 mb-6">
          Create a strong password for your account
        </p>
      </div>
      <div className="max-w-md w-full bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-9 rounded-2xl shadow-lg">
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Password */}
          <div className="flex-1 relative">
            <Label className="text-white text-sm mb-2">
              Enter Your Password
            </Label>
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Password must not be more than 20 characters",
                },
                // pattern: {
                //   value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                //   message:
                //     "Password must contain at least one letter and one number",
                // },
              })}
              className={`bg-[#0A0D1F] border-2 ${
                isPasswordTouched
                  ? isPasswordValid
                    ? "border-green-500"
                    : ""
                  : "border-[#515152]"
              } text-white pr-10`}
              onFocus={() => setIsPasswordTouched(true)}
            />
            <div
              className="absolute right-2 top-9 cursor-pointer z-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="text-white" />
              ) : (
                <Eye className="text-white" />
              )}
            </div>

            {/* Password requirements feedback */}
            {isPasswordTouched && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isPasswordLengthValid ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {isPasswordLengthValid ? (
                      <Check size={12} className="text-white" />
                    ) : (
                      <X size={12} className="text-white" />
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isPasswordLengthValid ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    Between 8-20 characters
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex-1 relative">
            <Label className="text-white text-sm mb-2">Confirm Password</Label>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className={`bg-[#0A0D1F] border-2 ${
                isConfirmPasswordTouched
                  ? isConfirmPasswordValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-[#515152]"
              } text-white pr-10`}
              onFocus={() => setIsConfirmPasswordTouched(true)}
            />
            <div
              className="absolute right-2 top-9 cursor-pointer z-10"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="text-white" />
              ) : (
                <Eye className="text-white" />
              )}
            </div>

            {/* Confirm password feedback */}
            {isConfirmPasswordTouched && confirmPasswordValue.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    doPasswordsMatch ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {doPasswordsMatch ? (
                    <Check size={12} className="text-white" />
                  ) : (
                    <X size={12} className="text-white" />
                  )}
                </div>
                <p
                  className={`text-xs ${
                    doPasswordsMatch ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {doPasswordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full cursor-pointer ${
              isPasswordValid && isConfirmPasswordValid
                ? "bg-[#335FFF] hover:bg-[#1A4BFF]"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            disabled={loading || !isPasswordValid || !isConfirmPasswordValid}
          >
            {loading ? <InLoader size={48} /> : "Reset Password"}
          </Button>
        </form>
        <div className="text-center text-white mt-8">
          <Link href="/sign-in" className="text-xs text-gray-100">
            Back to <span className="text-white">Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
