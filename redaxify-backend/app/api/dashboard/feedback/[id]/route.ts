import prismadb from "@/configs/db.config";
import { sendFeedbackMail } from "@/utils/feedback-mail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const feedback = await prismadb.feedback.findUnique({
      where: { id: Number(id) },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error(`Error fetching feedback with ID ${id}:`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();

  //   console.log("Feedback ID:", id);
  const { replyMessage, replySubject } = body;

  if (!replyMessage || !replySubject) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const updatedFeedback = await prismadb.feedback.update({
      where: { id: Number(id) },
      data: {
        replyStatus: "REPLIED",
        replyMessage,
        replySubject,
        replyTime: new Date(),
      },
    });
    const { email } = updatedFeedback || {}; // 👈 Access the email field
    // console.log("mail feedback:", email); // 👈 Log the updated feedback
    // Send email logic here using the email field
    await sendFeedbackMail(email, replyMessage, replySubject);
    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error(`Error updating feedback with ID ${id}:`, error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const deletedFeedback = await prismadb.feedback.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(deletedFeedback);
  } catch (error) {
    console.error(`Error deleting feedback with ID ${id}:`, error);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
