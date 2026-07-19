import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

/**
 * POST /api/orders/place
 * Creates a "pay-at-table" order in Firestore (no payment required upfront).
 * Order goes to kitchen immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, tableId, tableNumber, cartItems, totalPaise, paymentMethod, customerName } = await req.json();

    if (!restaurantId || !tableId || !cartItems?.length) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const restaurantDoc = await adminDb.collection("restaurants").doc(restaurantId).get();
    const ownerId = restaurantDoc.data()?.ownerId;

    if (!ownerId) {
      return NextResponse.json({ error: "Restaurant not found or invalid." }, { status: 404 });
    }

    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      restaurantId,
      ownerId,
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
      paymentMethod: paymentMethod || "pay-at-table",
      customerName: customerName || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (error: any) {
    console.error("[orders/place] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
