import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import prismadb from "@/configs/db.config";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email, password } = reqBody;
    // console.log("Received Request Body:", reqBody);

    // Check if user already exists
    const existingUser = await prismadb.users.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const response = await prismadb.users.update({
      where: { id: existingUser.id },
      data: {
        password: hashPassword,
      },
    });
    return NextResponse.json({
      message: "password updated",
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
