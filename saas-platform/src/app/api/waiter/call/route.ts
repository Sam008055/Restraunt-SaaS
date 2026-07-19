import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

/**
 * POST /api/waiter/call
 * Creates a waiter call request in Firestore.
 * Staff can see this on the dashboard and dismiss it.
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, tableId, tableNumber } = await req.json();

    if (!restaurantId || !tableId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await adminDb.collection("waiterCalls").add({
      restaurantId,
      tableId,
      tableNumber,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[waiter/call] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
