"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import SelectInput from "./SelectInput";
import PercentageInput from "./PercentageInput";
import Link from "next/link";
import axios from "axios";
// import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { clearUser } from "@/store/userSlice";
import { useDispatch } from "react-redux";

type UserData = {
  name: string;
  email: string;
  userRole: string;
  userType: string;
};

const Navbar: React.FC = () => {
  const [data, setData] = useState<UserData | null>(null); // User data state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state
  const dropdownRef = useRef<HTMLDivElement | null>(null); // Ref for dropdown
  const buttonRef = useRef<HTMLButtonElement | null>(null); // Ref for user initial button
  const router = useRouter();
  const dispatch = useDispatch();
  // Fetch user data from API
  const handleLogout = async () => {
    try {
      // const apiUrl = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
      await axios.get(`/api/proxy?url=/api/users/signout`, {
        withCredentials: true,
      }); // Your API endpoint
      // await signOut({ redirect: false });
      dispatch(clearUser());
      setData(null);
      router.push("/sign-in");
    } catch (error) {
      console.log("User not logged in:", error);
    }
  };

  // Handle clicks outside dropdown to close it
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false); // Close the dropdown if the click is outside the button and dropdown
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // const apiUrl = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
        const response = await axios.get(`/api/proxy?url=/api/users/user`, {
          withCredentials: true,
        }); // Your API endpoint
        setData(response.data.data); // Set user data
        // console.log("data", response.data.data); // Set user data
      } catch (error) {
        console.log("User not logged in:", error);
        setData(null); // Clear user data on error
      }
    };

    fetchUser();

    // Listen for click events outside the dropdown and button
    document.addEventListener("click", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className="w-full h-12 flex justify-between items-center px-8 py-2.5 bg-gradient-to-b from-[#1C1C3A] to-[#242648] border-b-2 border-b-[#2C2E4B] fixed top-0 left-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/assets/redaxify-logo.svg"
          alt="Redaxify Logo"
          width={24}
          height={20}
        />
        <span className="text-[1.4rem] font-semibold text-white">Redaxify</span>
      </Link>
      <div className="hidden gap-3">
        {/* <div className="flex items-center gap-3"> */}
        <SelectInput options={["Edit Mode", "Preview Mode", "Delete Mode"]} />
        <button className="px-2 py-1.5 bg-[#353652] rounded-full cursor-pointer transition-colors duration-200 hover:bg-[#41436D]">
          <Image
            src="/icons/zoom_in.svg"
            alt="Zoom In"
            width={20}
            height={20}
          />
          {""}
        </button>
        <button className="px-2 py-1.5 bg-[#353652] rounded-full cursor-pointer transition-colors duration-200 hover:bg-[#41436D]">
          <Image
            src="/icons/zoom_out.svg"
            alt="Zoom Out"
            width={20}
            height={20}
          />{" "}
        </button>
        <PercentageInput />
      </div>
      <div className="flex items-center gap-2">
        <button className="bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] flex items-center justify-center gap-1 text-sm font-medium rounded-full px-3 py-[0.3rem]">
          <Image
            src="/icons/export.svg"
            alt="Export Icon"
            width={26}
            height={26}
          />
          <span className="text-white">Export</span>
        </button>
        {data?.name && (
          <div className="relative inline-block">
            {/* User Initial Button */}
            <button
              ref={buttonRef} // Set ref for the user initial button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown on click
              className="w-8 h-8 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white flex items-center justify-center rounded-full font-bold cursor-pointer"
            >
              {data.name.charAt(0)}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef} // Set ref for the dropdown container
                className="absolute right-0 mt-2 px-4 py-3 bg-white text-sm rounded-lg shadow-lg opacity-100 transition-opacity cursor-alias w-auto"
              >
                <div className="text-gray-900 font-semibold">{data.name}</div>
                <div className="text-gray-500">{data.email}</div>
                <div className="text-gray-500">
                  Account Type:{" "}
                  {data.userType.slice(0, 1).toUpperCase() +
                    data.userType.slice(1)}
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-1 flex items-center justify-center bg-gradient-to-r from-[#5175f7] to-[#1A4BFF] text-white rounded-lg shadow-md hover:bg-blue-600 transition-all cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
