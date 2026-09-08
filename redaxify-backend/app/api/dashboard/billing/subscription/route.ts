import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";

interface SubscriptionPlanData {
  name: string;
  description?: string;
  price: number | string;
  gpuLimit: number | string;
  storageLimit: number | string;
  durationDays: number | string;
  isActive?: boolean;
}

export async function GET() {
  try {
    const subscriptions = await prismadb.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(subscriptions, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      description,
      price,
      gpuLimit,
      storageLimit,
      durationDays,
      isActive = true,
    }: SubscriptionPlanData = body;

    // Validate required fields
    if (!name || !price || !gpuLimit || !storageLimit || !durationDays) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, gpuLimit, storageLimit, durationDays" },
        { status: 400 }
      );
    }

    // Convert and validate numerical fields
    const priceValue = parseFloat(price.toString());
    const gpuLimitValue = parseInt(gpuLimit.toString(), 10);
    const storageLimitValue = parseInt(storageLimit.toString(), 10);
    const durationDaysValue = parseInt(durationDays.toString(), 10);

    if (priceValue <= 0 || gpuLimitValue <= 0 || storageLimitValue <= 0 || durationDaysValue <= 0) {
      return NextResponse.json(
        { error: "Price, gpuLimit, storageLimit, and durationDays must be positive numbers" },
        { status: 400 }
      );
    }

    // Create subscription plan in the database
    const newSubscriptionPlan = await prismadb.subscriptionPlan.create({
      data: {
        name,
        description,
        price: priceValue,
        gpuLimit: gpuLimitValue,
        storageLimit: storageLimitValue,
        durationDays: durationDaysValue,
        isActive,
      },
    });

    return NextResponse.json(newSubscriptionPlan, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating SubscriptionPlan:", error);
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: "A subscription plan with this name already exists" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error while creating SubscriptionPlan" },
      { status: 500 }
    );
  }
}