import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

/**
 * POST /api/staff/create
 * Creates a staff member (cook) in Firestore for Pro-plan restaurants.
 * Staff log in with a PIN at /staff-login.
 *
 * Body: { restaurantId: string, name: string, role: "cook" | "manager", pin: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, name, role, pin } = await req.json();

    if (!restaurantId || !name || !pin) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    // Check restaurant is on Pro plan
    const restDoc = await adminDb.collection("restaurants").doc(restaurantId).get();
    const restData = restDoc.data();
    if (!restData || restData.subscription?.plan !== "pro") {
      return NextResponse.json({ error: "Staff management requires the Pro plan." }, { status: 403 });
    }

    const staffRef = adminDb.collection("staff").doc();
    await staffRef.set({
      restaurantId,
      name,
      role: role || "cook",
      pin, // In production, hash this with bcrypt
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, staffId: staffRef.id });
  } catch (error: any) {
    console.error("[staff/create] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
