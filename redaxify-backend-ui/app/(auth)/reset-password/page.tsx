import GridBackground from "@/components/GridBackground";
import ResetPassword from "@/components/ResetPassword";
import Image from "next/image";
import { Suspense } from "react";

const page = () => {
  return (
    <section className="w-full overflow-hidden bg-[rgb(15,15,15)] bg-gradient-to-t from-[rgba(15,15,15,0.93)] to-[rgba(1,9,46,0.69)]">
      {/* On the Right Side of the screen */}
      <div className="absolute top-0 right-0 hidden md:block">
        <Image
          src="/assets/SideLighting.png"
          alt="Star Icon"
          width={750} // Default size for large screens
          height={350}
          className="opacity-[1]"
        />
      </div>

      {/* On the Left Side of the screen (Flipped Horizontally) */}
      <div className="absolute top-0 left-0 hidden md:block">
        <Image
          src="/assets/SideLighting.png"
          alt="Star Icon"
          width={750} // Default size for large screens
          height={350}
          className="opacity-[1] transform scale-x-[-1] "
        />
      </div>
      <GridBackground />

      <Suspense fallback={<div>Loading...</div>}>
        <div className="relative z-10">
          <ResetPassword />
        </div>
      </Suspense>
    </section>
  );
};

export default page;
