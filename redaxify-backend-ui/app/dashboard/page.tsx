"use client";

import { RootState } from "@/store/store";
import axios from "axios";
import {
  Clock,
  FileClock,
  UserCheck,
  Users,
  UserX,
  Video,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface User {
  id: number;
  customerNumber: number;
  name: string;
  email: string;
  password?: string | null;
  provider?: string | null;
  providerId?: string | null;
  userType: "regular" | "basic" | "premium";
  userAuth: boolean;
  permission: boolean | null;
  userRole: "user" | "admin" | "support" | "marketing";
  otp?: string | null;
  otpExpires?: string | null;
  mailVerifytoken?: string | null;
  mailVerifytokenExpires?: string | null;
  createdAt: string;
}

interface VideoStats {
  totalVideoUploaded: number;
  totalDurationMinutes: number;
  totalDurationSeconds: number;
}

interface SubscriptionStats {
  totalActive: number;
  totalTrial: number;
  totalCanceled: number;
  totalExpired: number;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsages: number;
}

interface BillingStats {
  totalRevenue: number;
  pendingPayments: number;
  failedPayments: number;
}

interface FeedbackStats {
  totalFeedbacks: number;
  pendingReplies: number;
  resolved: number;
}

interface Plan {
  id: number;
  name: string;
  description: string | null;
  price: number;
  gpuLimit: number;
  storageLimit: number;
  durationDays: number;
  isActive: boolean;
  activeUserCount: number;
}

interface PlanStats {
  totalPlans: number;
  plansWithActiveUsers: Plan[];
  bestSellingPlan: {
    name: string;
    activeUserCount: number;
  };
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  isLoading = false,
  bgColor = "bg-blue-100",
  textColor = "text-blue-600",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number | string | React.ReactNode;
  isLoading?: boolean;
  bgColor?: string;
  textColor?: string;
}) => (
  <div
    className={`${bgColor} rounded-lg p-4 shadow-md flex items-center space-x-4 hover:scale-105 transition-transform min-h-[90px]`}
  >
    <div className={`${textColor} p-3 rounded-full bg-white`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-dashed border-gray-400 animate-spin rounded-full" />
      ) : (
        <p className="text-xl font-bold">{value}</p>
      )}
    </div>
  </div>
);

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null);
  const [couponLoading, setCouponLoading] = useState(true);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (user.id) {
      console.log("✅ redux dashboard user", user);
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async <T,>(
      type: string,
      setData: React.Dispatch<React.SetStateAction<T>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/stats?type=${type}`,
          { withCredentials: true }
        );
        setData(response.data as T);
      } catch (error) {
        console.error(`Error fetching ${type} stats:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats('users', setUsers, setUserLoading);
    fetchStats('video-stats', setVideoStats, setVideoLoading);
    fetchStats('subscription-stats', setSubscriptionStats, setSubscriptionLoading);
    fetchStats('coupon-stats', setCouponStats, setCouponLoading);
    fetchStats('billing-stats', setBillingStats, setBillingLoading);
    fetchStats('feedback-stats', setFeedbackStats, setFeedbackLoading);
    fetchStats('plan-stats', setPlanStats, setPlanLoading);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-8">
        <UserCheck className="w-10 h-10 mr-4 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">
          Redaxify Admin Dashboard
        </h1>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Users"
            value={users.length}
            isLoading={userLoading}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard
            icon={UserCheck}
            title="Active Users"
            value={
              users.filter((user) => user.userAuth && user.permission).length
            }
            isLoading={userLoading}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            icon={UserX}
            title="Not Active Users"
            value={users.filter((user) => !user.userAuth).length}
            isLoading={userLoading}
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
          <StatCard
            icon={UserX}
            title="Deactive Users"
            value={users.filter((user) => !user.permission).length}
            isLoading={userLoading}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Video Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Video}
            title="Total Videos Uploaded"
            value={videoStats?.totalVideoUploaded ?? 0}
            isLoading={videoLoading}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
          />
          <StatCard
            icon={Clock}
            title="Total Duration (Minutes)"
            value={videoStats?.totalDurationMinutes ?? 0}
            isLoading={videoLoading}
            bgColor="bg-indigo-100"
            textColor="text-indigo-600"
          />
          <StatCard
            icon={FileClock}
            title="Total Duration (Seconds)"
            value={videoStats?.totalDurationSeconds ?? 0}
            isLoading={videoLoading}
            bgColor="bg-teal-100"
            textColor="text-teal-600"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Subscription Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={UserCheck}
            title="Active Subscriptions"
            value={subscriptionStats?.totalActive ?? 0}
            isLoading={subscriptionLoading}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            icon={Clock}
            title="Trial Users"
            value={subscriptionStats?.totalTrial ?? 0}
            isLoading={subscriptionLoading}
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
          <StatCard
            icon={UserX}
            title="Canceled Subscriptions"
            value={subscriptionStats?.totalCanceled ?? 0}
            isLoading={subscriptionLoading}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
          <StatCard
            icon={UserX}
            title="Expired Subscriptions"
            value={subscriptionStats?.totalExpired ?? 0}
            isLoading={subscriptionLoading}
            bgColor="bg-gray-100"
            textColor="text-gray-600"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Coupon Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            title="Total Coupons"
            value={couponStats?.totalCoupons ?? 0}
            isLoading={couponLoading}
            bgColor="bg-indigo-100"
            textColor="text-indigo-700"
          />
          <StatCard
            icon={UserCheck}
            title="Active Coupons"
            value={couponStats?.activeCoupons ?? 0}
            isLoading={couponLoading}
            bgColor="bg-green-100"
            textColor="text-green-700"
          />
          <StatCard
            icon={FileClock}
            title="Total Coupon Uses"
            value={couponStats?.totalUsages ?? 0}
            isLoading={couponLoading}
            bgColor="bg-blue-100"
            textColor="text-blue-700"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Feedback Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            title="Total Feedbacks"
            value={feedbackStats?.totalFeedbacks ?? 0}
            isLoading={feedbackLoading}
            bgColor="bg-sky-100"
            textColor="text-sky-700"
          />
          <StatCard
            icon={Clock}
            title="Pending Replies"
            value={feedbackStats?.pendingReplies ?? 0}
            isLoading={feedbackLoading}
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
          <StatCard
            icon={UserCheck}
            title="Resolved Feedbacks"
            value={feedbackStats?.resolved ?? 0}
            isLoading={feedbackLoading}
            bgColor="bg-green-100"
            textColor="text-green-700"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Billing Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            title="Total Revenue ($)"
            value={billingStats?.totalRevenue ?? 0}
            isLoading={billingLoading}
            bgColor="bg-green-100"
            textColor="text-green-700"
          />
          <StatCard
            icon={Clock}
            title="Pending Payments"
            value={billingStats?.pendingPayments ?? 0}
            isLoading={billingLoading}
            bgColor="bg-yellow-100"
            textColor="text-yellow-700"
          />
          <StatCard
            icon={UserX}
            title="Failed Payments"
            value={billingStats?.failedPayments ?? 0}
            isLoading={billingLoading}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Plan Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            icon={Users}
            title="Total Plans"
            value={planStats?.totalPlans ?? 0}
            isLoading={planLoading}
            bgColor="bg-indigo-100"
            textColor="text-indigo-700"
          />
          <StatCard
            icon={UserCheck}
            title="Active Plans"
            value={planStats?.plansWithActiveUsers.filter(plan => plan.isActive).length ?? 0}
            isLoading={planLoading}
            bgColor="bg-green-100"
            textColor="text-green-700"
          />
          <StatCard
            icon={UserCheck}
            title="Best Selling Plan"
            value={`${planStats?.bestSellingPlan.name} (${planStats?.bestSellingPlan.activeUserCount} users)`}
            isLoading={planLoading}
            bgColor="bg-teal-100"
            textColor="text-teal-700"
          />
          <StatCard
            icon={Users}
            title="Other Plans with Users"
            value={
              planStats?.plansWithActiveUsers.length > 0 ? (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {planStats.plansWithActiveUsers.map((plan) => (
                    <li key={plan.id} className="text-gray-600">
                      {plan.name}: {plan.activeUserCount} users
                    </li>
                  ))}
                </ul>
              ) : "No plans"
            }
            isLoading={planLoading}
            bgColor="bg-purple-100"
            textColor="text-purple-700"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Access Restricted Users
        </h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => !user.permission)
                .map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{user.id}</td>
                    <td className="p-4">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}