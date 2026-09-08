import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
// import prismadb from "@/configs/db.config";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  console.log("Operation Started: -----------------")
  try {
    const body = await req.json();
    const token = await getToken({ req });
    console.log("Token:", token);
    console.log("Request Body:", body);

    if (!token || !token.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id;
    const { plan } = body;

    // Create Stripe customer (optional, only if not stored)
    const customer = await stripe.customers.create({
      email: token.email,
      name: token.name,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        planId: plan.id,
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/failed`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT_SESSION]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
