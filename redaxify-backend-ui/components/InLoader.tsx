import { Loader } from "lucide-react";
import React from "react";

interface InLoaderProps {
  size?: number;
}

const InLoader = ({ size = 40 }: InLoaderProps) => {
  return <Loader className="animate-spin text-white" size={size} />;
};

export default InLoader;
