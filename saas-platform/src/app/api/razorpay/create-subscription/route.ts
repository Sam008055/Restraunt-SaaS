import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import Razorpay from "razorpay";

/**
 * POST /api/razorpay/create-subscription
 * Creates a Razorpay subscription for the SaaS plan using PLATFORM keys.
 * This is for restaurant owners subscribing to SavorSystem — NOT for customer payments.
 *
 * Body: { restaurantId: string, planId: string }
 *
 * NOTE: You must create the plan in the Razorpay dashboard and put its ID in env.
 * e.g. RAZORPAY_SAAS_PLAN_ID=plan_xxxx
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, email, name } = await req.json();

    if (!restaurantId || !email) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const PLATFORM_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const PLATFORM_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const PLAN_ID = process.env.RAZORPAY_SAAS_PLAN_ID;

    // ── Dev mode bypass ────────────────────────────────────────────────────
    // If neither Firebase nor Razorpay are configured (local dev without .env.local),
    // return a special signal so the client can skip straight to the dashboard.
    if (!isAdminConfigured() || !PLATFORM_KEY_ID || !PLATFORM_KEY_SECRET) {
      console.warn(
        "[create-subscription] Running in dev bypass mode — Firebase/Razorpay not configured."
      );
      return NextResponse.json({ devBypass: true }, { status: 200 });
    }

    const razorpay = new Razorpay({
      key_id: PLATFORM_KEY_ID,
      key_secret: PLATFORM_KEY_SECRET,
    });

    // ── Testing Fallback ───────────────────────────────────────────────────
    // If the user hasn't set up a SaaS Plan ID in Razorpay, but has provided API keys,
    // we create a standard one-time order so they can still test the checkout UI.
    if (!PLAN_ID) {
      console.warn("[create-subscription] RAZORPAY_SAAS_PLAN_ID is missing. Falling back to a standard order for testing.");
      const order = await razorpay.orders.create({
        amount: 399900, // ₹3,999
        currency: "INR",
        receipt: `test_saas_${Date.now()}`,
        notes: { restaurantId, email, testMode: "true" },
      });
      return NextResponse.json({
        orderId: order.id, // Return orderId instead of subscriptionId
        keyId: PLATFORM_KEY_ID,
      });
    }

    // Create or fetch a Razorpay customer
    let customerId: string | undefined;
    try {
      const customers = await razorpay.customers.all({ email });
      if (customers.items && customers.items.length > 0) {
        customerId = customers.items[0].id;
      }
    } catch {
      // Customer not found, we'll create inline via subscription
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_ID,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles, then auto-renews
      addons: [],
      notes: {
        restaurantId,
        email,
        name: name || "",
      },
    });

    // Persist the subscription ID against the restaurant so we can manage it
    await adminDb.collection("restaurants").doc(restaurantId).set(
      {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planId: PLAN_ID,
          createdAt: new Date().toISOString(),
        },
      },
      { merge: true }
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: PLATFORM_KEY_ID,
    });
  } catch (error: any) {
    console.error("[create-subscription] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create subscription." }, { status: 500 });
  }
}
