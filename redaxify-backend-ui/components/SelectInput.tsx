"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface SelectInputProps {
  options: string[];
}

const SelectInput: React.FC<SelectInputProps> = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]); // Default to the first option
  const dropdownRef = useRef<HTMLDivElement>(null); // To track the dropdown container

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false); // Closes the dropdown after selecting
  };

  // Closes dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-52" ref={dropdownRef}>
      {/* Select Input */}
      <div
        className="flex items-center justify-center gap-3 bg-[#353652] text-white rounded-2xl px-3.5 py-1.5 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Icon */}
        <Image
          src="/icons/doc_manual.svg"
          alt="Add Mode"
          width={20}
          height={20}
        />
        {/* Selected Text */}
        <span className="flex-grow text-[0.8rem]">{selectedOption}</span>
        {/* Dropdown Arrow */}
        <span className="text-gray-400 text-base">
          {isOpen ? (
            <Image
              src="/icons/arrow.svg"
              alt="Arrow Down Icon"
              width={18}
              height={18}
            />
          ) : (
            <Image
              src="/icons/arrow.svg"
              alt="Arrow Down Icon"
              width={18}
              height={18}
              className="rotate-180"
            />
          )}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 px-1.5 py-1.5 w-full bg-[#353652] text-white rounded-lg shadow-lg z-10">
          {options.map((option) => (
            <div
              key={option}
              className="p-2 hover:bg-gray-600 px-3 text-[0.8rem] rounded-lg cursor-pointer"
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectInput;
