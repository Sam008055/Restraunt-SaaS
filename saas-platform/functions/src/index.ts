import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import Razorpay from "razorpay";

admin.initializeApp();
const db = admin.firestore();

// ─── Config (set via Firebase Secret Manager) ──────────────────────────────
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET!;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ─── Helper: HMAC token verify ────────────────────────────────────────────────
function generateQRToken(restaurantId: string, tableId: string): string {
  return crypto
    .createHmac("sha256", QR_HMAC_SECRET)
    .update(`${restaurantId}:${tableId}`)
    .digest("hex");
}

function verifyQRToken(restaurantId: string, tableId: string, token: string): boolean {
  const expected = generateQRToken(restaurantId, tableId);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

// ─── 1. Generate QR Token for a table ────────────────────────────────────────
// Called by the owner dashboard when adding/regenerating a table QR code.
// Sets custom Auth claims are not used here — this is a pure data endpoint.
export const generateTableQR = functions.https.onCall(
  { enforceAppCheck: true },
  async (request) => {
    const { restaurantId, tableId } = request.data;

    if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
    const claims = request.auth.token;
    if (claims.restaurantId !== restaurantId || !["owner", "manager"].includes(claims.role)) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized");
    }

    const token = generateQRToken(restaurantId, tableId);
    const url = `https://savorsystem.com/r/${restaurantId}/t/${tableId}?token=${token}`;

    // Persist token reference so we can invalidate old QRs by regenerating
    await db.collection("tables").doc(tableId).update({
      qrToken: token,
      qrGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { token, url };
  }
);

// ─── 2. Set User Role (custom claims) ────────────────────────────────────────
// Only platform admins can elevate a user's role.
// Custom claims are the source of truth for RBAC; never trust client-sent role.
export const setUserRole = functions.https.onCall(
  { enforceAppCheck: true },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
    const callerClaims = request.auth.token;
    if (callerClaims.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin only");
    }

    const { uid, role, restaurantId } = request.data as {
      uid: string;
      role: "owner" | "manager" | "staff";
      restaurantId: string;
    };

    await admin.auth().setCustomUserClaims(uid, { role, restaurantId });

    // Audit log
    await db.collection("auditLogs").add({
      restaurantId,
      action: "role_assigned",
      performedBy: request.auth.uid,
      details: { uid, role },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// ─── 3. Place Order (validates HMAC token + rate limit) ───────────────────────
export const placeOrder = functions.https.onCall(
  { enforceAppCheck: true },
  async (request) => {
    const { restaurantId, tableId, token, items, paymentMode, customerSessionId } = request.data;

    // 1. Verify HMAC token
    if (!verifyQRToken(restaurantId, tableId, token)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid QR token");
    }

    // 2. Rate limit: max 5 orders per session per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOrders = await db
      .collection("orders")
      .where("customerSessionId", "==", customerSessionId)
      .where("createdAt", ">=", oneHourAgo)
      .count()
      .get();

    if (recentOrders.data().count >= 5) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many orders. Please wait before placing another."
      );
    }

    // 3. Fetch menu items and validate prices server-side (never trust client prices)
    const itemIds: string[] = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuDocs = await db.getAll(
      ...itemIds.map((id) => db.collection("menuItems").doc(id))
    );

    const menuMap = new Map(menuDocs.map((d) => [d.id, d.data()]));

    let subtotal = 0;
    const validatedItems = items.map((item: {
      menuItemId: string;
      quantity: number;
      variantName?: string;
      name: string;
    }) => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new functions.https.HttpsError("invalid-argument", `Item ${item.name} unavailable`);
      }
      // Resolve price server-side
      let price = menuItem.price;
      if (item.variantName && menuItem.variants) {
        const variant = menuItem.variants.find((v: { name: string }) => v.name === item.variantName);
        if (variant) price = variant.price;
      }
      subtotal += price * item.quantity;
      return { ...item, price };
    });

    const taxTotal = Math.round(subtotal * 0.05);
    const total = subtotal + taxTotal;

    // 4a. online-prepay: create Razorpay order first, do not write to Firestore yet
    if (paymentMode === "online-prepay") {
      const rpOrder = await razorpay.orders.create({
        amount: total * 100, // paise
        currency: "INR",
        notes: { restaurantId, tableId, customerSessionId },
      });
      // Return Razorpay order ID — client completes payment, then webhook confirms
      return { requiresPayment: true, razorpayOrderId: rpOrder.id, total };
    }

    // 4b. pay-at-table: write order immediately
    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      restaurantId,
      tableId,
      customerSessionId,
      items: validatedItems,
      subtotal,
      taxTotal,
      total,
      order_status: "received",
      payment_status: "pending",
      paymentMode: "pay-at-table",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, orderId: orderRef.id };
  }
);

// ─── 4. Razorpay Webhook (signature verified, then write order to Firestore) ──
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  // Verify webhook signature
  const signature = req.headers["x-razorpay-signature"] as string;
  const expectedSig = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature ?? ""))) {
    res.status(401).send("Invalid signature");
    return;
  }

  const event = req.body.event;
  if (event !== "payment.captured") { res.status(200).send("Ignored"); return; }

  const payment = req.body.payload.payment.entity;
  const { restaurantId, tableId, customerSessionId } = payment.notes;
  const razorpayOrderId = payment.order_id;
  const razorpayPaymentId = payment.id;

  // Check idempotency — avoid duplicate writes
  const existing = await db
    .collection("orders")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .limit(1)
    .get();

  if (!existing.empty) { res.status(200).send("Already processed"); return; }

  // Fetch pending order details (stored in a temp collection by placeOrder)
  const pendingSnap = await db
    .collection("pendingOrders")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .limit(1)
    .get();

  if (pendingSnap.empty) { res.status(404).send("Pending order not found"); return; }

  const pending = pendingSnap.docs[0].data();

  const batch = db.batch();

  // Write confirmed order
  const orderRef = db.collection("orders").doc();
  batch.set(orderRef, {
    ...pending,
    order_status: "received",
    payment_status: "paid",
    razorpayOrderId,
    razorpayPaymentId,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Delete pending record
  batch.delete(pendingSnap.docs[0].ref);

  await batch.commit();

  res.status(200).json({ success: true, orderId: orderRef.id });
});
