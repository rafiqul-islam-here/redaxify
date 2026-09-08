"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
// import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { clearUser } from "@/store/userSlice";
import { useDispatch } from "react-redux";

const DashboardTopNav = () => {
  // const [data, setData] = useState("");
  const [data, setData] = useState<{
    name: string;
    email: string;
    userRole: string;
  } | null>(null);
  // console.log(data);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
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
      // Set the user data if found
    } catch (error) {
      console.log("User not logged in:", error);
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // const apiUrl =
        //   process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL ||
        //   "https://api.redaxify.com";
        const response = await axios.get(`/api/proxy?url=/api/users/user`, {
          withCredentials: true,
        });
        setData(response.data.data); // Set the user data if found
        // console.log("NAvData", response.data.data);
      } catch (error) {
        console.log("User not logged in:", error);
        setData(null); // Ensure user state is null if request fails
      }
    };

    fetchUser();
  }, []);

  // Format pathname for breadcrumb-style display
  const formatPathname = (path: string) => {
    if (path === "/") return "Home";

    const parts = path
      .split("/")
      .filter(Boolean)
      .map((part) =>
        part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      );

    return (
      <div className="flex items-center space-x-2">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-gray-500 font-semibold">{part}</span>
            {index < parts.length - 1 && (
              <span className="text-gray-400">&nbsp;&gt;&nbsp;&nbsp;</span> // Ensures spacing before and after ">"
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <nav className="w-full h-12 flex justify-between items-center px-8 py-2.5 bg-white shadow-md fixed top-0 left-0 z-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/redaxify-logo-blue.svg"
            alt="Redaxify Logo"
            width={24}
            height={20}
            className="text-blue-700"
          />
          <span className="text-[1.4rem] font-semibold">Redaxify</span>
        </Link>

        {/* Current Page Path with Breadcrumb */}
        <div className="ml-28 flex items-center gap-2 text-gray-700 text-sm font-medium">
          <Home className="text-blue-500 w-5 h-5" />
          <span className="text-gray-400">/</span>
          {formatPathname(pathname)}
        </div>
      </div>

      {/* Shows the authenticated users info and logout */}
      <div className="flex items-center gap-2">
        {data?.name && (
          <div className="relative group inline-block">
            {/* User Initial Button */}
            <button className="w-8 h-8 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white flex items-center justify-center rounded-full font-bold">
              {data.name.charAt(0)}
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-0 px-4 py-3 bg-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer w-auto group-hover:block hidden">
              <div className="text-gray-900 font-semibold">{data.name}</div>
              <div className="text-gray-500">{data.email}</div>
              <div className="text-black">
                Role:{" "}
                <span className="font-semibold text-sm">
                  {data.userRole.toUpperCase()}
                </span>
              </div>

              <div className="mt-3">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-1.5 flex items-center justify-center bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white rounded-lg shadow-md hover:bg-blue-600 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardTopNav;
