"use client";
import { Button } from "@/components/ui/button";
// import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowLeft, AlertTriangle } from "lucide-react";

const Page = () => {
  const router = useRouter();
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const referrer = document.referrer;
    const lastPath = sessionStorage.getItem("lastPath");
    if (lastPath) setLastPath(lastPath);
    else if (referrer) setLastPath(referrer);
  }, []);

  const handleGoBack = () => {
    router.push(lastPath || "/");
  };

  // Floating animation variants
  const floatingVariants = {
    float: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="flex flex-col md:flex-row justify-evenly items-center min-h-screen bg-gradient-to-br from-[#0A0D1F] to-[#1a1a3a] p-4 overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
        className="fixed inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#335FFF] blur-[80px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-[#8A2BE2] blur-[90px]"></div>
      </motion.div>

      {/* Left Section */}
      <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center mb-10 md:mb-0 relative z-10">
        {/* Logo and Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-6 mb-8 text-center"
        >
          <motion.div
            variants={floatingVariants}
            animate="float"
            className="relative"
          >
            <div className="absolute -inset-4 bg-[#335FFF] rounded-full opacity-20 blur-md"></div>
            <div className="relative flex items-center justify-center p-6 bg-gradient-to-br from-[#242648] to-[#1C1C3A] rounded-full border border-[#335FFF]/30 shadow-lg">
              <Lock className="w-12 h-12 text-[#335FFF]" />
            </div>
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#335FFF] to-[#8A2BE2]"
            >
              Access Denied
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-300 max-w-lg"
            >
              You don&apos;t have permission to view this page. Please
              authenticate to continue.
            </motion.p>
          </div>
        </motion.div>

        {/* Animated decorative elements */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="mt-12 grid grid-cols-3 gap-4 opacity-80"
        >
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              animate={{
                y: [0, -15, 0],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3 + item,
                repeat: Infinity,
                ease: "easeInOut",
                delay: item * 0.3,
              }}
              className="flex flex-col items-center"
            >
              <AlertTriangle className="w-6 h-6 text-yellow-400 mb-2" />
              <div className="w-0.5 h-12 bg-gradient-to-b from-[#335FFF] to-transparent"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/3 max-w-md space-y-6 relative z-10">
        <AnimatePresence>
          {/* Sign In Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-8 rounded-2xl shadow-xl border border-[#335FFF]/30 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#335FFF] opacity-10 blur-md"></div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Sign In
            </h2>
            <p className="text-gray-400 mb-6">
              Unlock full access to Redaxify&apos;s powerful media processing
              tools.
            </p>
            <Link href="/sign-in" className="w-full block">
              <Button
                className="w-full bg-[#335FFF] hover:bg-[#1A4BFF] transition-all duration-300 group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <AnimatePresence mode="wait">
                  {isHovering ? (
                    <motion.span
                      key="hover"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2"
                    >
                      Authenticate Now{" "}
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </Link>
          </motion.div>

          {/* Go Back Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-l from-[#242648] to-[#1C1C3A] p-8 rounded-2xl shadow-xl border border-[#515152]/30 relative overflow-hidden"
          >
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-[#8A2BE2] opacity-10 blur-md"></div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> Go Back
            </h2>
            <p className="text-gray-400 mb-6">
              Return to where you came from and continue browsing.
            </p>
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full bg-transparent text-white border-[#515152] hover:bg-[#515152]/20 hover:border-[#515152]/50 transition-all duration-300 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous Page
              </span>
            </Button>
          </motion.div>
        </AnimatePresence>

        {/* Contact Support */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-400 text-sm mt-8"
        >
          Need assistance?{" "}
          <Link
            href="/contact"
            className="text-[#8A2BE2] hover:text-[#335FFF] underline underline-offset-4 transition-colors duration-300"
          >
            Contact our support team
          </Link>
        </motion.div> */}
      </div>
    </div>
  );
};

export default Page;
