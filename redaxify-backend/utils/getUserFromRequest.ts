import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getDataFromToken } from "./getDataFromToken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getUserFromRequest(request: NextRequest) {
  let userId: number | undefined = undefined;
  let user = null;

  // Try to get user ID from JWT
  try {
    userId = await getDataFromToken(request);
  } catch (error) {
    console.log("No valid JWT token found", error);
  }

  if (userId) {
    user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
      },
    });
  }

  // If no user from JWT, check NextAuth session
  if (!user) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      user = await prisma.users.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
        },
      });
    }
  }
  //   console.log("user here", user);
  return user;
}
