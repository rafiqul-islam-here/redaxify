import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

// GET: Fetch all coupons with user names if assigned to specific user
export async function GET() {
  try {
    const coupons = await prismadb.coupon.findMany({
      include: {
        user: {
          select: {
            name: true,
            customerNumber: true
          }
        },
        usages: true
      }
    });

    // Format the response
    const formattedCoupons = coupons.map(coupon => ({
      ...coupon,
      assignedTo: coupon.userId 
        ? coupon.user?.name || `User #${coupon.userId}`
        : "All Users",
      totalUses: coupon.usages.reduce((sum, usage) => sum + usage.timesUsed, 0)
    }));

    return NextResponse.json(formattedCoupons, { status: 200 });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Error fetching coupons" },
      { status: 500 }
    );
  }
}

// POST: Create a new coupon
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      code,
      discountValue,
      discountType,
      startDate,
      endDate,
      isActive = true,
      userId = null, // NULL means available to all
      usageLimit = 2, // Default to 2 uses per user
    } = body;

    // Validate required fields
    if (!code || discountValue === undefined || !discountType || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate discount type
    const validDiscountTypes = ["percentage", "fixed"];
    if (!validDiscountTypes.includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type. Must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate user exists if assigning to specific user
    if (userId) {
      const userExists = await prismadb.users.findUnique({
        where: { id: userId }
      });
      if (!userExists) {
        return NextResponse.json(
          { error: "Specified user not found" },
          { status: 404 }
        );
      }
    }

    // Create coupon
    const newCoupon = await prismadb.coupon.create({
      data: {
        code,
        discountValue: parseFloat(discountValue),
        discountType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        userId: userId ? Number(userId) : null,
        usageLimit: parseInt(usageLimit, 10),
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      ...newCoupon,
      assignedTo: newCoupon.userId ? newCoupon.user?.name || `User #${newCoupon.userId}` : "All Users"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Error creating coupon" },
      { status: 500 }
    );
  }
}