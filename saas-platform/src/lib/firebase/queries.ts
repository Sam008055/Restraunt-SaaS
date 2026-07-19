/**
 * Firestore data access helpers.
 * These run on the server (Server Components, API Routes).
 * They use the Admin SDK so they bypass Firestore Security Rules.
 * All security is enforced by checking custom claims before calling these.
 */

import { adminDb } from "./admin";
import { MenuCategory, MenuItem } from "@/lib/types/menu";

// ─── Restaurant ───────────────────────────────────────────────────────────────
export async function getRestaurantBySlug(slug: string) {
  const snap = await adminDb
    .collection("restaurants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getRestaurantById(restaurantId: string) {
  const doc = await adminDb.collection("restaurants").doc(restaurantId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export async function getMenuForRestaurant(restaurantId: string): Promise<MenuCategory[]> {
  const [catsSnap, itemsSnap] = await Promise.all([
    adminDb
      .collection("categories")
      .where("restaurantId", "==", restaurantId)
      .where("isActive", "==", true)
      .orderBy("order")
      .get(),
    adminDb
      .collection("menuItems")
      .where("restaurantId", "==", restaurantId)
      .where("isAvailable", "==", true)
      .orderBy("order")
      .get(),
  ]);

  const itemsByCategory = new Map<string, MenuItem[]>();
  itemsSnap.docs.forEach((doc) => {
    const item = { id: doc.id, ...doc.data() } as MenuItem;
    const bucket = itemsByCategory.get(item.categoryId) ?? [];
    bucket.push(item);
    itemsByCategory.set(item.categoryId, bucket);
  });

  return catsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<MenuCategory, "id" | "items">),
    items: itemsByCategory.get(doc.id) ?? [],
  }));
}

// ─── Tables ───────────────────────────────────────────────────────────────────
export async function getTableById(tableId: string) {
  const doc = await adminDb.collection("tables").doc(tableId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function getTablesForRestaurant(restaurantId: string) {
  const snap = await adminDb
    .collection("tables")
    .where("restaurantId", "==", restaurantId)
    .orderBy("tableNumber")
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrdersForRestaurant(restaurantId: string, limitN = 50) {
  const snap = await adminDb
    .collection("orders")
    .where("restaurantId", "==", restaurantId)
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
