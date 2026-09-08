import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { stripe } from "@/lib/stripe";

// GET all active subscription plans
export async function GET() {
  try {
    const plans = await prismadb.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        gpuLimit: true,
        storageLimit: true,
        durationDays: true
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('[GET_SUBSCRIPTIONS_ERROR]', error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}

// POST create checkout session
export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    
    // Validate request data directly in the route
    if (!requestData.userId || isNaN(Number(requestData.userId))) {
      return NextResponse.json(
        { error: "Valid user ID is required" },
        { status: 400 }
      );
    }

    if (!requestData.planId || isNaN(Number(requestData.planId))) {
      return NextResponse.json(
        { error: "Valid plan ID is required" },
        { status: 400 }
      );
    }

    const { userId, planId, couponCode } = requestData;

    // Get user and plan in parallel
    const [user, plan] = await Promise.all([
      prismadb.users.findUnique({ 
        where: { id: Number(userId) },
        select: {
          id: true,
          email: true,
          name: true,
          stripeCustomerId: true,
          userType: true
        }
      }),
      prismadb.subscriptionPlan.findUnique({ 
        where: { id: Number(planId) },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          gpuLimit: true,
          storageLimit: true,
          durationDays: true
        }
      })
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Handle coupon validation and pricing
    let finalPrice = plan.price;
    let couponId = null;

    if (couponCode) {
      const coupon = await prismadb.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          OR: [
            { userId: null },
            { userId: user.id }
          ]
        },
        include: {
          usages: {
            where: {
              userId: user.id
            }
          }
        }
      });

      if (coupon) {
        // Check usage limit
        const usageCount = coupon.usages?.[0]?.timesUsed || 0;
        if (usageCount < coupon.usageLimit) {
          finalPrice = coupon.discountType === "percentage" 
            ? plan.price * (1 - coupon.discountValue / 100)
            : Math.max(0, plan.price - coupon.discountValue);
          couponId = coupon.id;
        }
      }
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id.toString() }
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await prismadb.users.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
            metadata: {
              planId: plan.id.toString()
            }
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id.toString(),
        planId: plan.id.toString(),
        planName: plan.name,
        couponId: couponId?.toString() || '',
        originalPrice: plan.price.toString(),
        discountedPrice: finalPrice.toString()
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes expiration
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error: unknown) {
    console.error('[SUBSCRIPTION_ERROR]', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Error && 'type' in error && error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
          { error: error.message || "Payment processing error" },
          { status: 400 }
      );
  }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}