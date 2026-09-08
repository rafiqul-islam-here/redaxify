import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function GET() {
  try {
    const bills = await prismadb.bill.findMany({
      select: {
        id: true,
        totalBill: true,
        paymentStatus: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        user: {
          select: {
            customerNumber: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest payments first
      },
    });

    // Format response
    const paymentHistory = bills.map((bill) => ({
      customerNumber: bill.user.customerNumber,
      customerName: bill.user.name,
      customerEmail: bill.user.email,
      amountPaid: bill.totalBill,
      paymentDate: bill.createdAt,
      subscriptionPlan: bill.subscription.name,
      billingPeriod: `${bill.startDate.toISOString().split('T')[0]} to ${bill.endDate.toISOString().split('T')[0]}`,
      paymentStatus: bill.paymentStatus,
    }));

    return NextResponse.json(paymentHistory, { status: 200 });

  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}