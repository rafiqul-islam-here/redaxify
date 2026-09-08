"use client";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileStack,
  FileText,
  Folder,
  HelpCircle,
  History,
  HistoryIcon,
  LayoutDashboard,
  MessageCircle,
  Ticket,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

const menuItems = [
  {
    category: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    link: "/dashboard",
  },
  {
    category: "Users",
    icon: <Users size={18} />,
    items: [
      {
        icon: <UserCircle size={18} />,
        text: "All Users",
        link: "/dashboard/users/users",
      },
      {
        icon: <UserCog size={18} />,
        text: "User Management",
        link: "/dashboard/users/user-management",
      },
      {
        icon: <FileText size={18} />,
        text: "Permissions",
        link: "/dashboard/users/permissions",
      },
      {
        icon: <History size={18} />,
        text: "Activity Log",
        link: "/dashboard/users/activity-log",
      },
      {
        icon: <Folder size={18} />,
        text: "Folders",
        link: "/dashboard/users/folders",
      },
    ],
  },
  {
    category: "Billings",
    icon: <CreditCard size={18} />,
    items: [
      {
        icon: <Ticket size={18} />,
        text: "Coupons & Discounts",
        link: "/dashboard/billing/coupons",
      },
      {
        icon: <FileStack size={18} />,
        text: "Subscription Plans",
        link: "/dashboard/billing/plans",
      },
      {
        icon: <HistoryIcon size={18} />,
        text: "Payment History",
        link: "/dashboard/billing/payment-history",
      },
    ],
  },
  {
    category: "Support",
    icon: <HelpCircle size={18} />,
    items: [
      {
        icon: <MessageCircle size={18} />,
        text: "FeedBacks",
        link: "/dashboard/support/feedbacks",
      },
    ],
  },
];

const DashboardSideNav = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const [data, setData] = useState<{
    name: string;
    email: string;
    userRole: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/proxy?url=/api/users/user`, {
          withCredentials: true,
        });
        setData(response.data.data);
      } catch (error) {
        console.log("User not logged in:", error);
        setData(null);
      }
    };

    fetchUser();
  }, []);

  const renderMenu = () =>
    menuItems.map((section, index) => {
      const isVisibleToUser =
        data?.userRole === "admin" ||
        (section.category !== "Users" && section.category !== "Billings");

      if (!isVisibleToUser) return null;

      return (
        <div key={index}>
          {section.link ? (
            <Link
              href={section.link}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 uppercase hover:bg-gray-100 rounded-lg transition-all"
            >
              {section.icon} {section.category}
            </Link>
          ) : (
            <>
              <button
                className="w-full flex justify-between items-center px-4 py-2 text-xs font-bold text-gray-700 uppercase hover:bg-gray-100 rounded-lg transition-all"
                onClick={() => toggleCategory(section.category)}
              >
                <span className="flex items-center gap-2">
                  {section.icon} {section.category}
                </span>
                {openCategory === section.category ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              <ul
                className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
                  openCategory === section.category ? "max-h-96" : "max-h-0"
                }`}
              >
                {section.items?.map((item, idx) => (
                  <li key={idx} className="text-gray-700">
                    <Link
                      href={item.link}
                      className="flex items-center gap-3 px-6 py-2 text-sm font-medium hover:bg-gray-100 rounded-xl transition-all"
                    >
                      {item.icon} {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    });

  return (
    <div className="bg-white w-60 h-screen px-2 fixed top-0 left-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-lg z-40">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-4 py-2 border-b border-gray-200"
      >
        <Image
          src="/assets/redaxify-logo-blue.svg"
          alt="Redaxify Logo"
          width={24}
          height={20}
        />
        <span className="text-2xl font-semibold text-gray-700">Redaxify</span>
      </Link>

      <div className="w-full mt-6 space-y-3">{renderMenu()}</div>
    </div>
  );
};

export default DashboardSideNav;
