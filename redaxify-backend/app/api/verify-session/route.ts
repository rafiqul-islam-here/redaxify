import { NextResponse } from "next/server";
import prismadb from "@/configs/db.config";
import { stripe } from "@/lib/stripe";

import { logActivity } from "@/lib/logActivity";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // console.log('[VERIFICATION_REQUEST]', request.url);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // console.log('[VERIFICATION_SESSION] Session', session);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 402 }
      );
    }

    const userId = Number(session.metadata?.userId);
    const planId = Number(session.metadata?.planId);
    const planName = session.metadata?.planName || '';
    const couponId = session.metadata?.couponId
      ? Number(session.metadata.couponId)
      : null;

    // Get user with customerNumber
    const user = await prismadb.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        customerNumber: true,
        email: true
      }
    });
    // console.log('[VERIFICATION_USER] User', user);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get subscription plan
    const plan = await prismadb.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    // console.log('[VERIFICATION_PLAN] Plan', plan);

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // Process in transaction
    const [subscription] = await prismadb.$transaction([
      // Update user
      prismadb.users.update({
        where: { id: userId },
        data: {
          userType: planName,
          userAuth: true,
          currentSubscriptionId: planId,
          stripeCustomerId: session.customer?.toString()
        }
      }),

      // Create subscription
      prismadb.subscription.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          stripeSubId: session.id,
          isTrial: false
        }
      }),

      // Create bill
      prismadb.bill.create({
        data: {
          customerNumber: user.customerNumber,
          subscriptionId: planId,
          totalBill: parseFloat(session.metadata?.discountedPrice || plan.price.toString()),
          gpuUsed: plan.gpuLimit,
          storageUsed: plan.storageLimit,
          paymentStatus: 'SUCCESS',
          startDate,
          endDate,
          stripePaymentIntentId: session.payment_intent?.toString(),
          stripeCustomerId: session.customer?.toString(),
          stripeInvoiceUrl: session.invoice_url || null
        }
      }),

      // Update coupon usage if applicable
      ...(couponId ? [prismadb.couponUsage.upsert({
        where: { couponId_userId: { couponId, userId } },
        create: { couponId, userId, timesUsed: 1 },
        update: { timesUsed: { increment: 1 } }
      })] : [])
    ]);

    const price = parseFloat(session.metadata?.discountedPrice || plan.price.toString());

    const couponInfo = couponId
      ? `Coupon applied (ID: ${couponId}), discounted price: $${price}`
      : "No coupon applied";

    logActivity({
      activityType: "SUBSCRIPTION_PURCHASE",
      description: `User (ID: ${user.id}, Email: ${user.email}) successfully subscribed to plan "${plan.name}" for $${price}. ${couponInfo}`,
      customerNumber: user.customerNumber,
      status: 200,
      userAgent: request.headers.get("user-agent") || "",
      ipAddress: request.headers.get("x-forwarded-for") || "",
    });

    return NextResponse.json({
      success: true,
      user: {
        userType: planName,
        userAuth: true
      },
      subscription: {
        planId: planId,
        stripeSubId: session.id
      }
    });

  } catch (error: any) {
    console.error('[VERIFICATION_ERROR]', error);

    let errorMessage = "Internal server error";
    if (error.code === 'P2002') errorMessage = "Duplicate subscription";
    if (error.code === 'P2003') errorMessage = "Invalid user reference";
    if (error.type?.startsWith('Stripe')) errorMessage = error.message;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}