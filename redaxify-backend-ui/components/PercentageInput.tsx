"use client";

import Image from "next/image";
import React, { useState } from "react";

const PercentageInput = () => {
  const [value, setValue] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace("%", ""); // Remove "%" for validation
    if (!isNaN(Number(rawValue)) || rawValue === "") {
      setValue(rawValue); // Set the value only if it's a valid number
    }
  };

  return (
    <div className="relative w-28 flex items-center bg-[#353652] rounded-2xl">
      {/* Input Field */}
      <input
        type="text"
        value={value + (value ? "%" : "")} // Display the value with a "%" appended
        onChange={handleInputChange}
        placeholder="0%"
        className="w-full h-full bg-[#353652] text-white text-sm rounded-2xl px-5 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-[#2C2E4B]"
      />
      {/* Triangle Icon */}
      <Image
        src="/icons/arrow.svg"
        alt="Arrow Down Icon"
        width={18}
        height={18}
        className="absolute right-3 text-white "
      />
    </div>
  );
};

export default PercentageInput;
