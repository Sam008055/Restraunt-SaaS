import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const { restaurantId, email, name, planId } = await req.json();

    if (!restaurantId || !email || !planId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const PLATFORM_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const PLATFORM_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    
    let PLAN_ID: string | undefined;
    let planAmount: number = 0;

    if (planId === "pro") {
      PLAN_ID = process.env.RAZORPAY_PLAN_PRO;
      planAmount = 149900;
    } else if (planId === "pro-annual") {
      PLAN_ID = process.env.RAZORPAY_PLAN_PRO_ANNUAL;
      planAmount = 1499000;
    } else if (planId === "growth") {
      PLAN_ID = process.env.RAZORPAY_PLAN_GROWTH;
      planAmount = 49900;
    } else if (planId === "growth-annual") {
      PLAN_ID = process.env.RAZORPAY_PLAN_GROWTH_ANNUAL;
      planAmount = 499000;
    }

    // ── Dev mode bypass ────────────────────────────────────────────────────
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
    if (!PLAN_ID) {
      console.warn(`[create-subscription] RAZORPAY_PLAN_${planId.toUpperCase()} is missing. Falling back to standard order.`);
      const order = await razorpay.orders.create({
        amount: planAmount,
        currency: "INR",
        receipt: `test_saas_${planId}_${Date.now()}`,
        notes: { restaurantId, email, testMode: "true", plan: planId },
      });
      
      // Update restaurant plan in testing fallback
      await adminDb.collection("restaurants").doc(restaurantId).set(
        {
          subscription: {
            id: order.id,
            status: "active", // Simulate active status for testing
            plan: planId,
            createdAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );
      
      return NextResponse.json({
        orderId: order.id, 
        keyId: PLATFORM_KEY_ID,
      });
    }

    // Create or fetch a Razorpay customer
    let customerId: string | undefined;
    try {
      const customers = await razorpay.customers.all({ email } as any);
      if (customers.items && customers.items.length > 0) {
        customerId = customers.items[0].id;
      }
    } catch {
      // Customer not found
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_ID,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,
      addons: [],
      notes: {
        restaurantId,
        email,
        name: name || "",
        plan: planId,
      },
    });

    // Persist the subscription ID against the restaurant
    await adminDb.collection("restaurants").doc(restaurantId).set(
      {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: planId,
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
