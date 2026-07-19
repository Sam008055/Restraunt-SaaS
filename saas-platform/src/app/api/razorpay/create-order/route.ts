import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Razorpay from "razorpay";

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order using the RESTAURANT's own API keys.
 * This means payment goes directly into the restaurant's Razorpay account.
 *
 * Body: {
 *   restaurantId: string,
 *   tableId: string,
 *   cartItems: CartItem[],
 *   amountPaise: number   // Amount in paise (₹1 = 100 paise)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, tableId, cartItems, amountPaise } = await req.json();

    if (!restaurantId || !tableId || !cartItems || !amountPaise) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Fetch the restaurant's Razorpay keys from Firestore
    const keysDoc = await adminDb.collection("razorpayKeys").doc(restaurantId).get();
    if (!keysDoc.exists) {
      return NextResponse.json(
        { error: "This restaurant has not configured online payments. Please pay at the counter." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = keysDoc.data() as { keyId: string; keySecret: string };

    // 2. Server-side price validation — recompute from Firestore menu to prevent tampering
    // Fetch menu items for each cart item and verify prices
    const itemIds = cartItems.map((i: any) => i.menuItemId);
    const menuItemDocs = await Promise.all(
      itemIds.map((id: string) => adminDb.collection("menuItems").doc(id).get())
    );

    let computedTotal = 0;
    for (let i = 0; i < cartItems.length; i++) {
      const doc = menuItemDocs[i];
      if (!doc.exists) {
        return NextResponse.json({ error: `Item not found: ${cartItems[i].name}` }, { status: 400 });
      }
      const data = doc.data()!;
      // Use server-side price, not the client's claimed price
      let price = data.price as number;
      if (cartItems[i].variantName) {
        const variant = (data.variants || []).find((v: any) => v.name === cartItems[i].variantName);
        if (variant) price = variant.price;
      }
      computedTotal += price * cartItems[i].quantity;
    }

    // Add tax (5%)
    const tax = Math.round(computedTotal * 0.05);
    const expectedAmount = (computedTotal + tax) * 100; // Convert to paise

    // Allow ±1 paise tolerance for rounding
    if (Math.abs(expectedAmount - amountPaise) > 1) {
      return NextResponse.json({ error: "Price mismatch. Please refresh the menu and try again." }, { status: 400 });
    }

    // 3. Create Razorpay order with the restaurant's own keys
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: expectedAmount,
      currency: "INR",
      receipt: `${tableId}-${Date.now()}`,
      notes: {
        restaurantId,
        tableId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // The restaurant's public Key ID (safe to send to client)
    });
  } catch (error: any) {
    console.error("[create-order] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment order." }, { status: 500 });
  }
}
