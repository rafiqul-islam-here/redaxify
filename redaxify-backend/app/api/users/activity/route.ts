import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { use } from "react";

export async function GET() {
  try {
    const response = await prisma.activity.findMany();
    return NextResponse.json({ message: "All activity", data: response });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "User found" }); //, data: user });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityType, description, user, status } = body;

    console.log(
      "Received Activity Data:",
      activityType,
      description,
      user,
      status
    );

    // Log the activity in your database
    await prisma.activity.create({
      data: {
        email: user.email,
        userName: user.name,
        activityType: activityType,
        description: description,
        timeStamp: new Date(),
        status: status,
      },
    });

    // Return a success response to the client
    return NextResponse.json({ message: "User activity logged successfully" });
  } catch (error) {
    console.error("Error updating user activity:", error);
    return NextResponse.json(
      { message: "Failed to update user activity" },
      { status: 500 }
    );
  }
}
