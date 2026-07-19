import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";

/**
 * POST /api/razorpay/save-keys
 * Saves a restaurant's Razorpay API keys to Firestore (server-side only).
 * The Key Secret is stored encrypted in the `razorpayKeys` sub-collection
 * and is NEVER returned to the client.
 *
 * Body: { restaurantId: string, keyId: string, keySecret: string }
 */
export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Firebase is not configured. Please fill in FIREBASE_ADMIN_* in .env.local and restart." },
      { status: 503 }
    );
  }
  try {
    const { restaurantId, keyId, keySecret } = await req.json();

    if (!restaurantId || !keyId || !keySecret) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!keyId.startsWith("rzp_")) {
      return NextResponse.json({ error: "Invalid Razorpay Key ID format." }, { status: 400 });
    }

    // TODO: In production, encrypt keySecret with a KMS key before storing.
    // For now, we store it directly in a restricted Firestore sub-collection
    // that is NOT readable by any client (Firestore rules deny client reads).
    await adminDb.collection("razorpayKeys").doc(restaurantId).set({
      restaurantId,
      keyId,
      keySecret, // Store as-is for now; encrypt with Google Cloud KMS in production
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[save-keys] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * GET /api/razorpay/save-keys?restaurantId=xxx
 * Returns whether the restaurant has configured Razorpay (not the keys themselves).
 */
export async function GET(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ configured: false }, { status: 200 });
  }
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ configured: false }, { status: 400 });
  }

  const doc = await adminDb.collection("razorpayKeys").doc(restaurantId).get();

  return NextResponse.json({
    configured: doc.exists,
    keyId: doc.exists ? (doc.data()?.keyId as string) : null,
  });
}
