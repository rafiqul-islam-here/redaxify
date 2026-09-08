import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendmail } from "@/utils/mailer";
import { generateCustomerNumber } from "@/lib/generate-customer-number";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { name, email, password } = reqBody;

    // console.log("Received Request Body:", reqBody);

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);
    const customerNumber = await generateCustomerNumber();

    // Create new user in the database
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        customerNumber,
        password: hashPassword,
      },
    });

    //console.log("New User Created:", newUser);

    // Send verification mail
    await sendmail({ email, emailType: "VERIFY", userID: newUser.id });

    // const response = 
    return NextResponse.json({
      message: "User registered successfully",
      success: true,
      user: newUser,
    });

    // // Set CORS headers
    // response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
    // response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    // response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    // response.headers.set("Access-Control-Allow-Credentials", "true");

    // return response;

  } catch (error) {
    console.error("Error in registration(sign up):", error);
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
//   response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
//   response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
//   response.headers.set("Access-Control-Allow-Headers", "Content-Type");
//   response.headers.set("Access-Control-Allow-Credentials", "true");
//   return response;
// }
