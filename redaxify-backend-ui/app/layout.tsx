import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "./provider/providers";
import AuthInitializer from "@/components/AuthInitializer";
// import Navbar from "@/components/Navbar";
// import SideNav from "@/components/SideNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", 
  fallback: ["ui-monospace", "monospace"],
});

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Navbar /> */}
        {/* <SideNav /> */}
        <ReduxProvider>
          <AuthInitializer />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
