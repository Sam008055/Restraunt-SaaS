import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { 
      restaurantId, 
      planId, 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = await req.json();

    if (!restaurantId || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const PLATFORM_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!PLATFORM_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay not configured." }, { status: 500 });
    }

    // Verify signature
    let expectedSig = "";
    if (razorpay_subscription_id) {
      expectedSig = crypto
        .createHmac("sha256", PLATFORM_KEY_SECRET)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");
    } else if (razorpay_order_id) {
      expectedSig = crypto
        .createHmac("sha256", PLATFORM_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
    }

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Calculate expiration date based on plan
    const isAnnual = planId.includes("annual");
    const expiresAt = new Date();
    if (isAnnual) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Activate the subscription in the restaurant document
    await adminDb.collection("restaurants").doc(restaurantId).set({
      subscription: {
        id: razorpay_subscription_id || razorpay_order_id,
        status: "active",
        plan: planId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      pendingSubscription: null
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[verify-subscription] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify subscription." }, { status: 500 });
  }
}
