import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { token } = reqBody;
    // console.log("otp verify" + token);

    if (!token) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const user = await prisma.users.findFirst({
      where: {
        otp: token,
        otpExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    console.log(user);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        userAuth: true,
        otp: null,
        otpExpires: null,
        mailVerifytoken: null,
        mailVerifytokenExpires: null,
      },
    });

    return NextResponse.json(
      {
        message: "User Verified successfully",
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// export async function OPTIONS() {
//   const response = new NextResponse(null, { status: 204 });
//   setCorsHeaders(response);
//   return response;
// }

// // Add this CORS utility function if not already present
// function setCorsHeaders(response: NextResponse) {
//   response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
//   response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
//   response.headers.set("Access-Control-Allow-Headers", "Content-Type");
//   response.headers.set("Access-Control-Allow-Credentials", "true");
// }