import type { Metadata } from "next";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";
import DashboardSideNav from "@/components/dashboard/DashboardSideNav";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata: Metadata = {
  title: "Redaxify User Panel",
  description: "Welcome! to redaxify user panel. Get your service as you want.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen">
      <AuthInitializer />
      <DashboardSideNav />
      <div className="flex flex-col flex-1 ml-60">
        <DashboardTopNav />
        <div className="bg-slate-200 flex-1 p-4 mt-12 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
