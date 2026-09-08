import { NextRequest, NextResponse } from "next/server";
import { sendmail } from "@/utils/mailer";
import prismadb from "@/configs/db.config";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email } = reqBody;
    // console.log("Received Request Body:", reqBody);

    // Check if user already exists
    const existingUser = await prismadb.users.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not exists" }, { status: 400 });
    }

    await sendmail({ email, emailType: "RESET", userID: existingUser.id });
    return NextResponse.json({
      message: "Reset OTP SEND",
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
