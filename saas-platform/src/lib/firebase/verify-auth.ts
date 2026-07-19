import { NextRequest } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";

export async function verifyRestaurantOwner(
  req: NextRequest,
  restaurantId: string
): Promise<{ uid: string } | { error: string; status: number }> {
  if (!isAdminConfigured()) {
    return { error: "Server not configured.", status: 503 };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized.", status: 401 };
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const restDoc = await adminDb.collection("restaurants").doc(restaurantId).get();
    if (!restDoc.exists) {
      return { error: "Restaurant not found.", status: 404 };
    }
    if (restDoc.data()?.ownerId !== decoded.uid) {
      return { error: "Forbidden.", status: 403 };
    }
    return { uid: decoded.uid };
  } catch {
    return { error: "Invalid token.", status: 401 };
  }
}
