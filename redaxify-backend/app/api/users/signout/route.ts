import { getUserFromRequest } from "@/utils/getUserFromRequest";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { setCorsHeaders } from "@/lib/cors"; // Add this if you want CORS

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    console.log("user,", user);

    const apiUrl = process.env.DOMAIN || "http://localhost:4000";
    try {
      axios.post(`${apiUrl}/api/users/activity`, {
        activityType: "Sign OUT",
        description: "User Signout",
        user: user,
        status: 200,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }

    const response = NextResponse.json({
      message: "Logout successful",
      success: true,
    });

    // Properly clear your JWT cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    setCorsHeaders(response); // if needed
    return response;
  } catch (error) {
    console.error("Logout Error:", error);
    const res = NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
    setCorsHeaders(res); // if needed
    return res;
  }
}
