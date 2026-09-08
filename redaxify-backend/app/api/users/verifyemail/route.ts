import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { token, email } = reqBody;
    console.log(token);

    const user = await prisma.users.findFirst({
      where: {
        email,
        mailVerifytoken: token,
        mailVerifytokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
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

    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    });
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
