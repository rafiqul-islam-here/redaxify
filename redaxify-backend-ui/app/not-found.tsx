"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Satellite, Rocket, Database, FileSearch } from "lucide-react";

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--nav-background)] p-6 relative overflow-hidden">
      {/* Animated Vector Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating planets */}
        <motion.div
          animate={{
            x: ["-5%", "5%", "-5%"],
            y: ["-5%", "5%", "-5%"],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-2 border-[var(--nav-btn-border-two)] opacity-20"
        />

        {/* Data network lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d="M10,10 Q50,100 90,10 T170,100 T250,10"
            stroke="var(--nav-btn-border-three)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="5,5"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            d="M90,90 Q150,20 210,90 T330,20"
            stroke="var(--nav-btn-border-three)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="5,5"
          />
        </svg>

        {/* Floating database icons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: Math.random() * 100 - 50,
              x: Math.random() * 100 - 50,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              y: [0, Math.random() * 40 - 20],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute text-[var(--nav-btn-border-one)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Database className="w-8 h-8" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mb-10 relative"
        >
          <div className="relative inline-block">
            {/* Main circle */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-48 h-48 rounded-full border-4 border-[var(--nav-btn-border-two)] flex items-center justify-center mx-auto"
            >
              {/* Inner circle */}
              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1, 0.95, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-40 h-40 rounded-full border-2 border-[var(--nav-btn-border-three)] flex items-center justify-center"
              >
                <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--btn-gradient-left)] to-[var(--btn-gradient-right)]">
                  404
                </span>
              </motion.div>
            </motion.div>

            {/* Floating icons around the circle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-full"
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FileSearch className="w-8 h-8 text-[var(--btn-gradient-left)]" />
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <Satellite className="w-8 h-8 text-[var(--btn-gradient-right)]" />
              </div>
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <Rocket className="w-8 h-8 text-[var(--nav-btn-text-color)]" />
              </div>
              <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2">
                <Database className="w-8 h-8 text-[var(--nav-btn-border-two)]" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-semibold text-white mb-3">
            Lost in Data Space
          </h2>
          <p className="text-[var(--nav-btn-text-color)] text-lg">
            The page you&apos;re looking for isn&apos;t in our index.
            <br />
            Let&apos;s get you back to familiar territory.
          </p>
        </motion.div>

        {/* Animated Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link href="/">
            <Button className="bg-gradient-to-r from-[var(--btn-gradient-left)] to-[var(--btn-gradient-right)] hover:from-[var(--btn-gradient-left)/90] hover:to-[var(--btn-gradient-right)/90] px-8 py-6 text-lg shadow-lg hover:shadow-[var(--btn-gradient-left)/30] transition-all">
              <Home className="w-5 h-5 mr-2" />
              Beam Me Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Page;
