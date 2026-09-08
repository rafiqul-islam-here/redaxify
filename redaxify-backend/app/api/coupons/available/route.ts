import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const coupons = await prismadb.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { userId: null }, // available to all
          { userId: Number(userId) } // available to specific user
        ]
      },
      include: {
        usages: {
          where: {
            userId: Number(userId)
          }
        }
      }
    });

    // filter coupons that haven't reached usage limit
    const validCoupons = coupons.filter(coupon => {
      const usageCount = coupon.usages?.[0]?.timesUsed || 0;
      return usageCount < coupon.usageLimit;
    });

    return NextResponse.json(validCoupons);
  } catch (error) {
    console.error('[COUPONS_ERROR]', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}