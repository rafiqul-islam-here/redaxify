"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function PackageForm() {
  const [packageName, setPackageName] = useState("");
  const [amount, setAmount] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  const handleCheckout = async () => {
    if (!packageName || !amount) {
      alert("Please enter package name and amount");
      return;
    }

    const stripe = await stripePromise;
    const { data } = await axios.post(`${API_BASE_URL}/api/checkout`, {
      packageName,
      amount: parseFloat(amount),
    });

    if (data.sessionId && stripe) {
      stripe.redirectToCheckout({ sessionId: data.sessionId });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-1/3 mx-auto mt-10 p-4 border rounded">
      <h2 className="text-xl font-semibold">Buy a Package</h2>
      <input
        type="text"
        placeholder="Package Name"
        className="p-2 border rounded"
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount (USD)"
        className="p-2 border rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={handleCheckout}
        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Buy Now
      </button>
    </div>
  );
}
