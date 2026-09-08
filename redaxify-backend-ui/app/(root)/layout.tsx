import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";

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
      <SideNav />
      <div className="flex flex-col flex-1 ml-60">
        <Navbar />
        <div className="bg-[#090E30] flex-1 px-0 py-0 mt-12 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
