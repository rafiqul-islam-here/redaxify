"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { ArrowDownCircle, Loader2, RefreshCw } from "lucide-react";
import Loader from "@/components/dashboard/Loader";
import CustomPagination from "@/components/dashboard/CustomPagination";
import toast, { Toaster } from "react-hot-toast";

interface Subscriber {
  customerNumber: number;
  name: string;
  email: string;
  type: string;
  validity: {
    start: string;
    end: string;
  } | null;
  status: "VALID" | "EXPIRED" | "NO_SUBSCRIPTION";
  actions: boolean;
}

export default function Page() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downgradingId, setDowngradingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 11;

  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/billing/subscribers`
      );
      setSubscribers(response.data);
      toast.success("Subscribers refreshed successfully");
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to fetch subscribers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscribers();
  };

  const handleDowngrade = async (customerNumber: number) => {
    setDowngradingId(customerNumber);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/dashboard/billing/subscribers/${customerNumber}`
      );
      setSubscribers(
        subscribers.map((sub) =>
          sub.customerNumber === customerNumber
            ? { ...sub, type: "regular", status: "NO_SUBSCRIPTION" }
            : sub
        )
      );
      toast.success("User downgraded to regular");
    } catch (error) {
      console.error("Error downgrading user:", error);
      toast.error("Failed to downgrade user");
    } finally {
      setDowngradingId(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.name.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.type.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.status.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.customerNumber.toString().includes(search)
  );

  const totalPages = Math.ceil(filteredSubscribers.length / usersPerPage);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return (
          <span className="px-2.5 py-1 bg-green-600 text-white rounded-xl text-xs font-semibold">
            Active
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-2 py-1 bg-red-600 text-white rounded-xl text-xs font-semibold">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-xl text-xs">
            No Subscription
          </span>
        );
    }
  };

  return (
    <div className="px-2 py-3">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fff",
            color: "#374151",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderLeft: "4px solid #10B981",
          },
          error: {
            style: {
              borderLeftColor: "#EF4444",
            },
          },
        }}
      />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Subscriber Management ({subscribers.length})
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search by name, email, plan, status, or customer #"
          value={search}
          onChange={handleSearchChange}
          className="w-1/2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2">Customer #</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Plan</th>
              <th className="border p-2">Validity</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  <Loader />
                </td>
              </tr>
            ) : paginatedSubscribers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  {search
                    ? "No matching subscribers found"
                    : "No subscribers available"}
                </td>
              </tr>
            ) : (
              paginatedSubscribers.map((subscriber, index) => (
                <tr
                  key={subscriber.customerNumber}
                  className={`border ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-2 border">{subscriber.customerNumber}</td>
                  <td className="p-2 border">{subscriber.name}</td>
                  <td className="p-2 border">{subscriber.email}</td>
                  <td className="p-2 border capitalize">{subscriber.type}</td>
                  <td className="p-2 border">
                    {subscriber.validity
                      ? `${formatDate(
                          subscriber.validity.start
                        )} - ${formatDate(subscriber.validity.end)}`
                      : "N/A"}
                  </td>
                  <td className="p-2 border">
                    {getStatusBadge(subscriber.status)}
                  </td>
                  <td className="p-2 border">
                    {subscriber.actions && (
                      <button
                        onClick={() =>
                          handleDowngrade(subscriber.customerNumber)
                        }
                        disabled={
                          downgradingId === subscriber.customerNumber ||
                          subscriber.status === "NO_SUBSCRIPTION"
                        }
                        className={`
                          px-3 py-1.5 text-sm rounded-md border
                          flex items-center gap-2 transition-colors
                          ${
                            downgradingId === subscriber.customerNumber
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300"
                              : subscriber.status === "NO_SUBSCRIPTION"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                              : "bg-white border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700 active:bg-rose-100"
                          }
                        `}
                      >
                        {downgradingId === subscriber.customerNumber ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="w-4 h-4" />
                            Downgrade
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredSubscribers.length > 0 && (
        <div className="mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
