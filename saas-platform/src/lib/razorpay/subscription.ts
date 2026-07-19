import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function activateRestaurantSubscription(
  restaurantId: string,
  params: {
    id: string;
    plan: string;
    planId?: string;
    status?: string;
  }
) {
  await adminDb.collection("restaurants").doc(restaurantId).set(
    {
      subscription: {
        id: params.id,
        plan: params.plan,
        planId: params.planId ?? null,
        status: "active",
        activatedAt: new Date().toISOString(),
      },
      pendingSubscription: FieldValue.delete(),
    },
    { merge: true }
  );
}

export async function setPendingSubscription(
  restaurantId: string,
  params: {
    id: string;
    planId: string;
    status: string;
    type: "subscription" | "order";
  }
) {
  await adminDb.collection("restaurants").doc(restaurantId).set(
    {
      pendingSubscription: {
        id: params.id,
        planId: params.planId,
        status: params.status,
        type: params.type,
        createdAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );
}

export async function markSubscriptionPastDue(restaurantId: string) {
  await adminDb.collection("restaurants").doc(restaurantId).set(
    {
      subscription: {
        status: "past_due",
      },
      pendingSubscription: FieldValue.delete(),
    },
    { merge: true }
  );
}
