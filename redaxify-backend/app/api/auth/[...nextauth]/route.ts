import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma"; // Import your custom adapter
import { CustomPrismaAdapter } from "@/lib/custom-adapter";
// import { use } from "react";
import axios from "axios";

// Define NextAuth options
export const authOptions: AuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Use JWT instead of database sessions since we don't have a proper sessions table
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Add user information to the JWT token
    async signIn({ user }) {
      const apiUrl = process.env.DOMAIN || "http://localhost:4000";
      try {
        console.log("google user", user);
        await axios.post(`${apiUrl}/api/users/activity`, {
          activityType: "Sign In",
          description: "User Sign In",
          status: 200,
          user: user,
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
      return true; // Allow sign-in
    },
    async jwt({ token, user }) {
      if (user) {
        console.log("user,", user);
        token.userId = user.id;
      }
      return token;
    },
    // Add user information to the session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

// Define API handlers correctly for Next.js 13+
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
