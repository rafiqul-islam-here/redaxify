"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Eye, EyeClosed, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import TypingHeading from "./TypeHeading";
// import SocialLogin from "./ui/SocialLogin";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const SignUp = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: "onChange", // This enables real-time validation as the user types
  });
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // const termsAccepted = watch("terms", false);
  // Name validation regex - allows letters, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\- ']+$/;

  // Email validation regex - more comprehensive than the default pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Function to validate email format and catch specific invalid patterns
  const validateEmail = (email: string) => {
    // Trim spaces
    email = email.trim();

    // Check for basic format
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }

    // Check for double dots in domain
    if (email.includes("..")) {
      return "Email cannot contain consecutive dots";
    }

    // Check for missing domain
    if (email.split("@")[1].startsWith(".")) {
      return "Email must have a domain name before the dot";
    }

    // Check for comma instead of dot
    if (email.includes(",")) {
      return "Email cannot contain commas";
    }

    return true;
  };

  const onSubmit = async (data: FormData) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

    // console.log("Base URL: ", API_BASE_URL);
    try {
      setLoading(true);
      // Trim whitespace from inputs
      const trimmedData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        terms: data.terms,
      };
      const userdata = {
        name: trimmedData.firstName + " " + trimmedData.lastName,
        email: trimmedData.email,
        password: trimmedData.password,
      };
      console.log(userdata);
      const response = await axios.post(
        `${API_BASE_URL}/api/users/signup`,
        userdata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        toast.success("Successfully user register!");
        router.push(`/otp?email=${userdata.email}&source=VERIFY`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("User already exists!");
        } else {
          toast.error("User Register Failed!");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setLoading(false);
    }
    console.log(data);
  };

  return (
    <div className="flex flex-col gap-8 md:gap-0 md:flex-row justify-center items-center min-h-screen">
      {/* Toast notifier */}
      <div>
        <Toaster position="top-right" reverseOrder={false} />
      </div>

      {/* Logo for Mbl device */}
      <div className=" md:hidden">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image
            src="/icons/star.png"
            alt="CommunityC Logo"
            height={50}
            width={50}
          />
          <TypingHeading />
        </div>
      </div>

      {/* Logo & Heading */}
      <div className="hidden md:block md:w-1/2 ">
        <div className="flex items-center justify-center gap-2 mb-4">
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
          Create an Account
        </h2>
        {/* <p className="text-gray-400 text-center mt-1 mb-4">
          Please enter your details
        </p> */}
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
      {/* Form Controller */}
      <div className=" max-w-md w-full bg-gradient-to-l from-[#242648] to-[#1C1C3A] px-9 py-7 rounded-2xl shadow-lg">
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* First & Last Name */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Label className="text-white text-sm mb-2">First Name</Label>
              <Input
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                  pattern: {
                    value: nameRegex,
                    message: "Only letters, hyphens, and apostrophes allowed",
                  },
                })}
                placeholder="John"
                className="bg-[#0A0D1F] border-2 border-[#515152] text-white"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-white text-sm mb-2">Last Name</Label>
              <Input
                type="text"
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                  pattern: {
                    value: nameRegex,
                    message: "Only letters, hyphens, and apostrophes allowed",
                  },
                })}
                placeholder="Doe"
                className="bg-[#0A0D1F] border-2 border-[#515152] text-white"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-white text-sm mb-2">Email</Label>
            <Input
              type="email"
              {...register("email", {
                required: "Email is required",
                validate: validateEmail,
              })}
              placeholder="you@company.com"
              className="bg-[#0A0D1F] border-2 border-[#515152] text-white"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="flex gap-4 flex-col sm:flex-row">
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
                    message: "Password cannot exceed 20 characters",
                  },
                  // pattern: {
                  //   value: /^(?=.*\d).+$/,
                  //   message: "Password must contain at least one number",
                  // },
                })}
                className="bg-[#0A0D1F] border-2 border-[#515152] text-white pr-10"
              />
              <div
                className="absolute right-2 top-9 cursor-pointer z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeClosed className="text-white" />
                ) : (
                  <Eye className="text-white" />
                )}
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="flex-1 relative">
              <Label className="text-white text-sm mb-2">
                Re-Enter Your Password
              </Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Confirm password is required",
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                className="bg-[#0A0D1F] border-2 border-[#515152] text-white pr-10"
              />
              <div
                className="absolute right-2 top-9 cursor-pointer z-10"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeClosed className="text-white" />
                ) : (
                  <Eye className="text-white" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              id="terms"
              className="hidden"
              {...register("terms", { required: "You must agree to terms" })}
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
                  width={16}
                  height={16}
                />
              )}
            </label>
            <label htmlFor="terms" className="text-gray-300 text-sm">
              I agree with the{" "}
              <a href="#" className="text-blue-400 hover:underline">
                terms and conditions
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-red-500 text-xs -mt-2 ">
              {errors.terms.message}
            </p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isValid}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="animate-spin mr-2 h-5 w-5" />
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* <div>
          <h2 className="text-sm mt-4 text-center text-white">
            Or Continue With
          </h2>
        </div>
        <SocialLogin /> */}
        <div className="text-center text-white mt-6 text-sm">
          Already have an account? &nbsp;&nbsp;
          <Link
            href="/sign-in"
            className="font-semibold border-b-2 border-b-blue-500 hover:text-blue-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
