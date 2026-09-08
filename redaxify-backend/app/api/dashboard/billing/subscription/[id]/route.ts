import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { Prisma } from "@prisma/client";

interface SubscriptionPlanUpdateData {
  name?: string;
  description?: string | null;
  price?: number | string;
  gpuLimit?: number | string;
  storageLimit?: number | string;
  durationDays?: number | string;
  isActive?: boolean;
}

// Define a type for the update data
interface UpdateData {
  name?: string;
  description?: string | null;
  price?: number;
  gpuLimit?: number;
  storageLimit?: number;
  durationDays?: number;
  isActive?: boolean;
}


// GET subscription plan by id
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const planId = await Number(params.id);
    if (isNaN(planId) || planId <= 0) {
      return NextResponse.json(
        { error: "Invalid ID - must be a positive number" }, 
        { status: 400 }
      );
    }

    const subscriptionPlan = await prismadb.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        subscriptions: true,
      },
    });

    if (!subscriptionPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscriptionPlan, { status: 200 });
  } catch (error) {
    console.error("[SUBSCRIPTION_PLAN_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE subscription plan
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const planId = await Number(params.id);
    if (isNaN(planId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Check for existing subscriptions before deletion
    const activeSubscriptions = await prismadb.subscription.count({
      where: { 
        planId,
        status: { not: "CANCELED" } 
      },
    });

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete plan with active subscriptions",
          activeSubscriptionsCount: activeSubscriptions
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const deletedPlan = await prismadb.$transaction(async (prisma) => {
      // First check if plan exists
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!existingPlan) {
        throw new Error("Subscription plan not found");
      }

      return await prisma.subscriptionPlan.delete({
        where: { id: planId },
      });
    });

    return NextResponse.json(
      { 
        message: "Subscription plan deleted successfully",
        deletedPlan 
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[SUBSCRIPTION_PLAN_DELETE]", error);
    
    // Type-safe error handling
    if (error instanceof Error) {
      if (error.message === "Subscription plan not found") {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      // Handle Prisma errors specifically
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return NextResponse.json(
              { error: "Subscription plan not found" },
              { status: 404 }
            );
          // Add other Prisma error codes as needed
        }
      }
    }
    
    // Fallback for unknown error types
    return NextResponse.json(
      { error: "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}

// PATCH update subscription plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = await Number(params.id);
    if (isNaN(planId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const body: SubscriptionPlanUpdateData = await req.json();
    const {
      name,
      description,
      price,
      gpuLimit,
      storageLimit,
      durationDays,
      isActive,
    } = body;

    // Validate at least one field is provided
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 }
      );
    }

    // Validate numerical fields if provided
    const validationErrors: string[] = [];
    
    if (price !== undefined) {
      const priceValue = parseFloat(price.toString());
      if (isNaN(priceValue)) validationErrors.push("Price must be a valid number");
      if (priceValue < 0) validationErrors.push("Price cannot be negative");
    }

    if (gpuLimit !== undefined) {
      const gpuLimitValue = parseInt(gpuLimit.toString(), 10);
      if (isNaN(gpuLimitValue)) validationErrors.push("GPU limit must be a valid integer");
      if (gpuLimitValue < 0) validationErrors.push("GPU limit cannot be negative");
    }

    // Similar validation for storageLimit and durationDays...

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: UpdateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price.toString());
    if (gpuLimit !== undefined) updateData.gpuLimit = parseInt(gpuLimit.toString(), 10);
    if (storageLimit !== undefined) updateData.storageLimit = parseInt(storageLimit.toString(), 10);
    if (durationDays !== undefined) updateData.durationDays = parseInt(durationDays.toString(), 10);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPlan = await prismadb.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json(updatedPlan, { status: 200 });
  } catch (error: unknown) {
    console.error("[SUBSCRIPTION_PLAN_PATCH]", error);
    
    // Type-safe error handling
    if (error instanceof Error) {
        // Check for Prisma known errors
        if ('code' in error && typeof error.code === 'string') {
            switch (error.code) {
                case 'P2025':
                    return NextResponse.json(
                        { error: "Subscription plan not found" },
                        { status: 404 }
                    );
                case 'P2002':
                    return NextResponse.json(
                        { error: "A plan with this name already exists" },
                        { status: 409 }
                    );
            }
        }

        // Handle other Error types
        return NextResponse.json(
            { error: error.message || "Failed to update subscription plan" },
            { status: 500 }
        );
    }

    // Fallback for non-Error types
    return NextResponse.json(
        { error: "Failed to update subscription plan" },
        { status: 500 }
    );
}
}