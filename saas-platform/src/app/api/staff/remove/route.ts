import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

/**
 * DELETE /api/staff/remove
 * Soft-deletes a staff member (sets isActive = false).
 * Body: { staffId: string, restaurantId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { staffId, restaurantId } = await req.json();

    if (!staffId || !restaurantId) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const staffRef = adminDb.collection("staff").doc(staffId);
    const staffDoc = await staffRef.get();

    if (!staffDoc.exists || staffDoc.data()?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    await staffRef.update({ isActive: false });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[staff/remove] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
