import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAuthUser } from "@/lib/getAuthUser";
import { logActivity } from "@/lib/logActivity";

export async function POST(req: Request) {

  try {
    const { packageName, amount } = await req.json();
    const user = await getAuthUser(req);

    if (!packageName || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/failed`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageName,
            },
            unit_amount: amount * 100, // Convert amount to cents
          },
          quantity: 1,
        },
      ],
    });

    if (user?.customerNumber) {
      logActivity({
        activityType: "checkout_session_created",
        description: `Checkout session created for package '${packageName}'`,
        status: 200,
        customerNumber: Number(user.customerNumber),
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      });
    }

    else {
      console.warn("User not found for activity log");
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
