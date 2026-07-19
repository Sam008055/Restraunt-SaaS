import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * POST /api/razorpay/verify-payment
 * Verifies the Razorpay payment signature and records the order in Firestore.
 *
 * Body: {
 *   restaurantId: string,
 *   tableId: string,
 *   tableNumber: string,
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string,
 *   cartItems: CartItem[],
 *   totalPaise: number,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      tableId,
      tableNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      cartItems,
      totalPaise,
    } = body;

    // 1. Fetch restaurant's keys to verify signature
    const keysDoc = await adminDb.collection("razorpayKeys").doc(restaurantId).get();
    if (!keysDoc.exists) {
      return NextResponse.json({ error: "Restaurant payment config not found." }, { status: 400 });
    }
    const { keySecret } = keysDoc.data() as { keyId: string; keySecret: string };

    // 2. Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSig !== razorpaySignature) {
      return NextResponse.json({ error: "Payment verification failed. Invalid signature." }, { status: 400 });
    }

    // 3. Write confirmed order to Firestore
    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      restaurantId,
      tableId,
      tableNumber,
      items: cartItems.map((item: any) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        variantName: item.variantName ?? null,
        isVeg: item.isVeg,
      })),
      totalPaise,
      status: "received",
      paymentMethod: "razorpay",
      razorpayOrderId,
      razorpayPaymentId,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (error: any) {
    console.error("[verify-payment] Error:", error);
    return NextResponse.json({ error: error.message || "Internal error." }, { status: 500 });
  }
}
