import { signIn } from "next-auth/react";
import React from "react";
import Image from "next/image";

const SocialLogin = () => {
  const handleGoogleLogin = () => {
    console.log("Google login triggered");
    signIn("google");
  };

  // const handleAppleLogin = () => {
  //   console.log("Apple login triggered");
  //   // Add Apple login logic here
  // };

  // const handleMetaLogin = () => {
  //   console.log("Meta login triggered");
  //   // Add Meta login logic here
  // };
  return (
    <div className="flex justify-center gap-2 mt-4">
      <button onClick={handleGoogleLogin} className="cursor-pointer">
        <Image src="/icons/google.png" alt="Google" height={30} width={30} />
        {""}
      </button>
      {/* <button onClick={handleAppleLogin} className="cursor-pointer">
        <Image src="/icons/apple.png" alt="Apple" height={30} width={30} />
        {""}
      </button>
      <button onClick={handleMetaLogin} className="cursor-pointer">
        <Image src="/icons/meta.png" alt="meta" height={30} width={30} />
        {""}
      </button> */}
    </div>
  );
};

export default SocialLogin;
