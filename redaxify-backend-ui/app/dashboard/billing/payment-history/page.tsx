"use client";
import CustomPagination from "@/components/dashboard/CustomPagination";
import Loader from "@/components/dashboard/Loader";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface Payment {
  customerNumber: string | number;
  customerName: string;
  customerEmail: string;
  amountPaid: number;
  paymentDate: string;
  subscriptionPlan: string;
  billingPeriod: string;
  paymentStatus: "PAID" | "PENDING" | "FAILED" | string;
}

const ITEMS_PER_PAGE = 11;

const Page = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/billing/history`
      );
      setPayments(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payment history. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setRefreshing(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/dashboard/billing/history`
        );
        setPayments(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setError("Failed to load payment history. Please try again later.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLoadingSearch(true);
    setCurrentPage(1);

    setTimeout(() => {
      setLoadingSearch(false);
    }, 300);
  };

  const handleRefresh = () => {
    fetchPayments();
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      payment.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      payment.customerNumber
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.amountPaid.toString().includes(search) ||
      payment.subscriptionPlan.toLowerCase().includes(search.toLowerCase()) ||
      payment.paymentStatus.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPayments = filteredPayments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="px-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Payment History ({filteredPayments.length})
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <Input
        placeholder="Search payments by customer, amount, or status..."
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-1/3"
      />
      {loadingSearch && <div>Searching...</div>}

      {error ? (
        <div className="p-4 text-center text-red-500 font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="text-center">
          <Loader />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-4 text-center text-gray-500 font-semibold">
          {search ? "No matching payments found." : "No payments available."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border p-2">Customer ID</th>
                  <th className="border p-2">Customer Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Subscription</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Billing Period</th>
                  <th className="border p-2">Payment Date</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((payment, index) => (
                  <tr
                    key={`${payment.customerNumber}-${payment.paymentDate}`}
                    className={`border ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-2 border">{payment.customerNumber}</td>
                    <td className="p-2 border">{payment.customerName}</td>
                    <td className="p-2 border">{payment.customerEmail}</td>
                    <td className="p-2 border">{payment.subscriptionPlan}</td>
                    <td className="p-2 border font-semibold">
                      {formatCurrency(payment.amountPaid)}
                    </td>
                    <td className="p-2 border">{payment.billingPeriod}</td>
                    <td className="p-2 border">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          payment.paymentStatus
                        )}`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
};

export default Page;
