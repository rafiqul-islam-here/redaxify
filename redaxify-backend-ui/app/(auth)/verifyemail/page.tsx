"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    source: "",
    email: "",
    token: "",
  });

  const { source, email, token } = data;

  const handleVerify = async () => {
    try {
      // Verification logic goes here
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
    }
  };

  useEffect(() => {
    const source = searchParams.get("source") || "";
    const email = searchParams.get("email") || "";
    const token = searchParams.get("token") || "";

    setData({ source, email, token });
  }, [searchParams]);

  return (
    <section className="bg-[rgb(15,15,15)] bg-gradient-to-t from-[rgba(15,15,15,0.93)] to-[rgba(1,9,46,0.69)] min-h-screen">
      <div>
        <Toaster />
      </div>
      <div className="flex justify-center items-center min-h-screen">
        {source && email && token ? (
          <Button
            onClick={handleVerify}
            variant="secondary"
            className="cursor-pointer"
          >
            Verify
          </Button>
        ) : (
          <h2 className="text-red-400">Link Is not valid</h2>
        )}
      </div>
    </section>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
};

export default Page;
