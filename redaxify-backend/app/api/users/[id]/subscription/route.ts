import prismadb from "@/configs/db.config";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const subscription = await prismadb.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endDate: { gte: new Date() }
      },
      include: {
        plan: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      isSubscribed: !!subscription,
      subscription
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}