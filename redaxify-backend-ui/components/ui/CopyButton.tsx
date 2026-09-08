"use client";
import React from "react";

type CopyButtonProps = {
    text: string;
    className?: string;
    label?: string;
    copiedLabel?: string;
};

const CopyButton: React.FC<CopyButtonProps> = ({
    text,
    className = "",
    label = "Copy",
    copiedLabel = "Copied!"
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return (
        <button
            className={`bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] flex items-center justify-center gap-1 text-sm font-medium rounded-full px-3 py-[0.3rem] text-white ${copied ? "opacity-70" : ""} ${className}`}
            onClick={handleCopy}
        >
            {copied ? copiedLabel : label}
        </button>
    );
};

export default CopyButton;
