"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<
    "verifying" | "processing" | "success" | "error"
  >("verifying");
  const [error, setError] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid session ID");
      setStatus("error");
      return;
    }

    const verifyPayment = async () => {
      try {
        // Add timeout to the verification request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const verification = await fetch(
          `${API_BASE_URL}/api/subscriptions/verify?session_id=${sessionId}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!verification.ok) {
          throw new Error(`HTTP error! status: ${verification.status}`);
        }

        const data = await verification.json();

        if (!data.verified) {
          throw new Error(data.error || "Payment verification failed");
        }

        if (data.processed) {
          // Fully processed
          setStatus("success");
          setTimeout(() => router.push("/"), 2000);
        } else {
          // Webhook is still processing
          setStatus("processing");
          pollForCompletion();
        }
      } catch (err) {
        let errorMessage = "An unexpected error occurred";

        if (err instanceof Error) {
          errorMessage =
            err.name === "AbortError"
              ? "Verification timed out. Your subscription is being processed."
              : err.message;
        }

        setError(errorMessage);
        setStatus("error");
      }
    };

    const pollForCompletion = async (attempt = 0) => {
      if (attempt >= 5) {
        // Max 5 attempts
        setError(
          "Processing is taking longer than expected. Please check your dashboard later."
        );
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/subscriptions/verify?session_id=${sessionId}`
        );
        const data = await response.json();

        if (data.processed) {
          setStatus("success");
          setTimeout(() => router.push("/"), 2000);
        } else {
          setTimeout(() => pollForCompletion(attempt + 1), 2000); // Poll every 2s
        }
      } catch {
        setTimeout(() => pollForCompletion(attempt + 1), 2000);
      }
    };

    verifyPayment();
  }, [sessionId, router, API_BASE_URL]);

  // Render states
  if (status === "verifying") {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Verifying your payment...</p>
        <p className="text-sm text-gray-500 mt-2">
          This should only take a moment.
        </p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="text-center p-8">
        <div className="animate-pulse flex justify-center mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full"></div>
        </div>
        <p>Finalizing your subscription...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a few seconds.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center p-8">
        <h2 className="text-red-500 text-xl mb-4">Error</h2>
        <p className="mb-4">{error}</p>

        {error.includes("timed out") ||
        error.includes("longer than expected") ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Your subscription is being processed in the background.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/subscription")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-green-500 text-xl mb-2">Success!</h2>
      <p className="mb-4">Your subscription is now active.</p>
      <div className="animate-pulse text-blue-600">
        Redirecting to dashboard...
      </div>
    </div>
  );
}
