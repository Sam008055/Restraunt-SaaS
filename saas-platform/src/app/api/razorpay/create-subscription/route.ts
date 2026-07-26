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

    // If completely missing credentials, do the instant demo mode
    if (!PLATFORM_KEY_ID || !PLATFORM_KEY_SECRET) {
      console.warn("[create-subscription] Missing Razorpay credentials. Activating in Demo Mode.");
      
      const isAnnual = planId.includes("annual");
      const expiresAt = new Date();
      if (isAnnual) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await adminDb.collection("restaurants").doc(restaurantId).set({
        subscription: {
          id: `demo_${Date.now()}`,
          status: "active",
          plan: planId,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        pendingSubscription: null
      }, { merge: true });

      return NextResponse.json({ demoSuccess: true });
    }

    const razorpay = new Razorpay({
      key_id: PLATFORM_KEY_ID,
      key_secret: PLATFORM_KEY_SECRET,
    });

    // If we have API keys but no PLAN_ID, fallback to one-time order for demo/testing
    if (!PLAN_ID) {
      console.warn("[create-subscription] Missing Razorpay Plan IDs. Falling back to one-time order for testing.");
      
      const order = await razorpay.orders.create({
        amount: planAmount,
        currency: "INR",
        receipt: `receipt_${restaurantId}_${Date.now()}`.slice(0, 40),
        notes: {
          restaurantId,
          email,
          name: name || "",
          plan: planId,
          isMockSubscription: "true"
        },
      });

      // Persist the pending order
      await adminDb.collection("restaurants").doc(restaurantId).set(
        {
          pendingSubscription: {
            id: order.id,
            status: order.status,
            plan: planId,
            planId: "mock_order",
            createdAt: new Date().toISOString(),
            isMockOrder: true
          },
        },
        { merge: true }
      );

      return NextResponse.json({
        orderId: order.id,
        keyId: PLATFORM_KEY_ID,
      });
    }

    // Normal Subscription Flow
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

    await adminDb.collection("restaurants").doc(restaurantId).set(
      {
        pendingSubscription: {
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
