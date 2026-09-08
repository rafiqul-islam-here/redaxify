import prismadb from "@/configs/db.config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const feedbacks = await prismadb.feedback.findMany();
    return NextResponse.json(feedbacks, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, firstName, lastName, number, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Email, subject and message are required" },
        { status: 400 }
      );
    }

    const newFeedback = await prismadb.feedback.create({
      data: {
        email,
        firstName,
        lastName,
        number,
        subject,
        message,
        replyStatus: "PENDING",
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
