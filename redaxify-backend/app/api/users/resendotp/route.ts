import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendmail } from "@/utils/mailer";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { source, email } = reqBody;
    console.log("Received Request Body:", reqBody);
    //source : "VERIFY" | "RESET"

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not exists" }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json({ error: "Source not exists" }, { status: 400 });
    }
    await sendmail({ email, emailType: source, userID: existingUser.id });
    return NextResponse.json({
      message: "Resed OTP SEND",
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
