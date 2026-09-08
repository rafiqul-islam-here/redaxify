"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Check, CircleCheck, Eye, EyeOff, X } from "lucide-react"; // Added Check and X icons
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import InLoader from "./InLoader";
import TypingHeading from "./TypeHeading";
// import SocialLogin from "./ui/SocialLogin";

type FormData = {
  email: string;
  password: string;
  terms: boolean;
};

const SignIn = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<FormData>({
    mode: "onChange", // Enable validation on change for real-time feedback
  });

  const router = useRouter();
  const emailValue = watch("email") || "";
  const passwordValue = watch("password") || "";

  // Email validation states
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const isEmailValid = /^\S+@\S+\.\S+$/.test(emailValue);

  // Password validation states
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password requirements
  const isPasswordLengthValid =
    passwordValue.length >= 8 && passwordValue.length <= 20;
  // const hasPasswordLetter = /[A-Za-z]/.test(passwordValue);
  // const hasPasswordNumber = /\d/.test(passwordValue);

  const [loading, setLoading] = useState(false);

  // Watch for touch events
  useEffect(() => {
    if (touchedFields.email) setIsEmailTouched(true);
    if (touchedFields.password) setIsPasswordTouched(true);
  }, [touchedFields]);

  // const backendDomain = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const userdata = {
        email: data.email,
        password: data.password,
      };
      const response = await axios.post(
        `/api/proxy?url=/api/users/signin`,
        userdata,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        toast.success(`${response.data.message}`);
        // Check userType first
        if (response.data.user.userType === "regular") {
          router.push(`/subscriptions`);
          return;
        }

        if (response.data.user.userRole === "user") {
          router.push(`/`);
        }
        if (response.data.user.userRole === "admin") {
          router.push(`/dashboard`);
          // window.location.href = "https://www.redaxify.com/";
        }
        if (response.data.user.userRole === "support") {
          router.push(`/dashboard/support/feedbacks`);
        }
        if (response.data.user.userRole === "marketing") {
          router.push(`/dashboard/support/feedbacks`);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        toast.error(`${error.response?.data?.error}`);
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 md:gap-0 md:flex-row justify-center items-center min-h-screen px-2">
      {/* Toaster */}
      <div>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
      {/* for mbl device */}
      <div className="md:hidden ">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/icons/star.png"
            alt="Redaxify Logo"
            height={40}
            width={40}
          />
          <TypingHeading />
        </div>
      </div>
      {/* Logo and Heading */}
      <div className="hidden md:block  md:w-1/2 md:h-full ">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/icons/star.png"
            alt="Redaxify Logo"
            height={40}
            width={40}
          />
          <TypingHeading />
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-white text-2xl font-bold text-center">
            Welcome Back to Redaxify
          </h2>
          <p className="text-gray-400 text-center mt-1 mb-6">
            Streamline your video, audio, and text processing with ease.
          </p>
        </div>

        {/* Features List */}
        <div className="w-[500px] mx-auto  ">
          <ol>
            <li className="py-2 flex items-start justify-start text-blue-200 my-2 gap-2">
              <Image src="/icons/tick.svg" width={20} height={20} alt="tick" />
              Automatically extract key moments from your videos for quick
              indexing.
            </li>
            <li className="py-2 flex items-start justify-start text-gray-500 my-2 gap-2">
              <Image src="/icons/tick.svg" width={20} height={20} alt="tick" />
              Reduce video and audio file sizes without compromising quality.
            </li>
            <li className="py-2 flex items-start justify-start text-gray-500 my-2 gap-2">
              <Image src="/icons/tick.svg" width={20} height={20} alt="tick" />
              Convert speech to text and generate accurate video captions
              effortlessly.
            </li>
          </ol>
        </div>
      </div>

      {/* Signin Form */}
      <div className="max-w-md w-full bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-9 rounded-2xl shadow-lg ">
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
                  value: /^\S+@\S+\.\S+$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="you@company.com"
              className={`bg-[#0A0D1F] border-2 ${
                isEmailTouched
                  ? isEmailValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-[#515152]"
              } text-white`}
              onFocus={() => setIsEmailTouched(true)}
            />
            {isEmailTouched && (
              <div className="absolute right-2 top-9">
                {isEmailValid ? (
                  <CircleCheck className="text-green-500" />
                ) : (
                  <X className="text-red-500" />
                )}
              </div>
            )}
            {isEmailTouched && !isEmailValid && (
              <p className="text-red-500 text-xs mt-1">
                {emailValue.length === 0
                  ? "Email is required"
                  : "Invalid email format"}
              </p>
            )}
          </div>

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
                  message: "Password must be at most 20 characters",
                },
                // pattern: {
                //   value: /^(?=.*\d).+$/,
                //   message: "Password must contain at least one number",
                // },
              })}
              className={`bg-[#0A0D1F] border-2 ${
                isPasswordTouched
                  ? isPasswordLengthValid
                    ? // hasPasswordLetter &&
                      // hasPasswordNumber
                      "border-green-500"
                    : "border-red-500"
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
                      <Check size={12} />
                    ) : (
                      <X size={12} />
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

          {/* Terms & Condition */}
          <div>
            <div className="flex justify-between items-center">
              {/* <div> */}
              {/* Terms & Conditions */}
              <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id="terms"
                  className="hidden"
                  {...register("terms", {
                    required: "You must agree to terms",
                  })}
                />
                <label
                  htmlFor="terms"
                  className={`checkmark w-4 h-4 border border-[#515152] bg-[#0A0D1F] flex items-center justify-center cursor-pointer rounded-sm ${
                    watch("terms") ? "bg-blue-600" : ""
                  }`}
                >
                  {watch("terms") && (
                    <Image
                      src="/icons/checked.svg"
                      alt="Checked"
                      width={23}
                      height={23}
                    />
                  )}
                </label>
                <label htmlFor="terms" className="text-gray-300 text-sm">
                I agree to the terms and conditions.
                </label>
              </div>
              {/* </div> */}
              <div>
                <Link href="forget-password" className="text-gray-300 text-sm">
                  Forgot password?
                </Link>
              </div>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-xs mt-1">
                {errors.terms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full cursor-pointer ${
              isEmailValid && isPasswordLengthValid && watch("terms")
                ? "bg-[#335FFF] hover:bg-[#1A4BFF]"
                : "bg-[#2f5ed2] cursor-not-allowed"
            }`}
            disabled={
              loading ||
              !isEmailValid ||
              !isPasswordLengthValid ||
              !watch("terms")
            }
          >
            {loading ? <InLoader size={48} /> : "Continue"}
          </Button>
        </form>

        {/* <div>
          <h2 className="text-sm mt-4 text-center text-white">
            Or Continue With
          </h2>
        </div> */}
        {/* <SocialLogin /> */}
        <div className="text-center text-white mt-8 text-sm">
          Don&apos;t have an account?&nbsp;&nbsp;
          <Link
            href="/sign-up"
            className=" font-semibold border-b-2 border-b-blue-500 hover:text-blue-500 "
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
