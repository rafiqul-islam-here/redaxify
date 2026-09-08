import prismadb from "@/configs/db.config";
import { NextResponse } from "next/server";

// GET single coupon with user info
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    const couponId = Number(id);
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const coupon = await prismadb.coupon.findUnique({
      where: { id: couponId },
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

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Format response
    const formattedCoupon = {
      ...coupon,
      assignedTo: coupon.userId 
        ? coupon.user?.name || `User #${coupon.userId}`
        : "All Users",
      totalUses: coupon.usages.reduce((sum, usage) => sum + usage.timesUsed, 0)
    };

    return NextResponse.json(formattedCoupon, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

interface CouponData {
  code?: string;
  discountValue?: number;
  discountType?: "percentage" | "fixed";
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  userId?: number | null; // Now accepts null to reset to all users
  usageLimit?: number;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const couponId = Number(id);
    
    if (isNaN(couponId)) {
      return NextResponse.json(
        { error: "Invalid coupon ID" }, 
        { status: 400 }
      );
    }

    const requestData: CouponData = await req.json();

    // Validate user exists if assigning to specific user
    if (requestData.userId !== undefined && requestData.userId !== null) {
      const user = await prismadb.users.findUnique({
        where: { id: requestData.userId }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Specified user not found" }, 
          { status: 404 }
        );
      }
    }

    // Update coupon
    const updatedCoupon = await prismadb.coupon.update({
      where: { id: couponId },
      data: {
        code: requestData.code,
        discountValue: requestData.discountValue,
        discountType: requestData.discountType,
        startDate: requestData.startDate ? new Date(requestData.startDate) : undefined,
        endDate: requestData.endDate ? new Date(requestData.endDate) : undefined,
        isActive: requestData.isActive,
        userId: requestData.userId, // Can be null to make available to all
        usageLimit: requestData.usageLimit,
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        usages: true
      }
    });

    // Format response
    const formattedCoupon = {
      ...updatedCoupon,
      assignedTo: updatedCoupon.userId 
        ? updatedCoupon.user?.name || `User #${updatedCoupon.userId}`
        : "All Users",
      totalUses: updatedCoupon.usages.reduce((sum, usage) => sum + usage.timesUsed, 0)
    };

    return NextResponse.json(formattedCoupon, { status: 200 });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Error updating coupon" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const couponId = Number(id);
    
    if (isNaN(couponId)) {
      return NextResponse.json(
        { error: 'Invalid ID' }, 
        { status: 400 }
      );
    }

    // Verify coupon exists
    const coupon = await prismadb.coupon.findUnique({
      where: { id: couponId }
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' }, 
        { status: 404 }
      );
    }

    // first delete all related CouponUsage records
    await prismadb.couponUsage.deleteMany({
      where: { couponId }
    });


    await prismadb.coupon.delete({
      where: { id: couponId }
    });

    return NextResponse.json(
      { message: "Coupon deleted successfully" }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Error deleting coupon" }, 
      { status: 500 }
    );
  }
}