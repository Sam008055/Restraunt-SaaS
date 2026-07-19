import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

/**
 * POST /api/staff/login
 * Validates a staff member's PIN and returns their info.
 * Body: { restaurantId: string, pin: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, pin } = await req.json();

    if (!restaurantId || !pin) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("staff")
      .where("restaurantId", "==", restaurantId)
      .where("pin", "==", pin)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    const customToken = await adminAuth.createCustomToken(doc.id, {
      role: data.role,
      restaurantId: data.restaurantId,
    });

    return NextResponse.json({
      success: true,
      customToken,
      staff: {
        id: doc.id,
        name: data.name,
        role: data.role,
        restaurantId: data.restaurantId,
      },
    });
  } catch (error: any) {
    console.error("[staff/login] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
