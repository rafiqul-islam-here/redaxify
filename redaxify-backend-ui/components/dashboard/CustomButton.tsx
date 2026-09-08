import React, { ReactNode } from "react";

// Button Component Props
interface ButtonProps {
  children: ReactNode;
  variant?: "black" | "blue" | "outline";
  onClick?: () => void;
}

const CustomButton: React.FC<ButtonProps> = ({
  children,
  variant = "black",
  onClick,
}) => {
  const variants = {
    black: "bg-black text-white hover:bg-gray-900",
    blue: "bg-blue-500 text-white hover:bg-blue-700",
    outline: "border border-block text-white hover:bg-gray-900",
  };
  return (
    <button
      className={`px-4 py-2 rounded-md font-medium transition ${variants[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default CustomButton;
