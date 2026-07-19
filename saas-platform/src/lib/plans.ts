export type BasePlanId = "starter" | "growth" | "pro";
export type PlanId = BasePlanId | "growth-annual" | "pro-annual";

export const PLAN_TABLE_LIMITS: Record<BasePlanId, number> = {
  starter: 2,
  growth: 15,
  pro: 50,
};

export const ONBOARDING_PLANS = [
  {
    id: "starter" as const,
    name: "Starter (Free)",
    price: "₹0",
    period: "/mo",
    description: "Perfect for testing the waters",
    features: [
      "Up to 2 tables",
      "Digital QR menu",
      "Order management dashboard",
      "Standard analytics",
      "Community support",
    ],
    tableLimit: 2,
    isRecommended: false,
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "₹499",
    period: "/mo",
    description: "For growing cafes and local spots",
    features: [
      "Up to 15 tables",
      "Everything in Starter",
      "Basic POS integrations",
      "Email support",
    ],
    tableLimit: 15,
    isRecommended: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹1,499",
    period: "/mo",
    description: "For established restaurants & multi-outlet chains",
    features: [
      "Up to 50 tables",
      "Everything in Growth",
      "Online pre-pay (Razorpay)",
      "Staff management (KDS & Waiter)",
      "Advanced CRM & analytics",
      "Priority support",
    ],
    tableLimit: 50,
    isRecommended: true,
  },
];

export function normalizePlan(plan: string | undefined | null): BasePlanId {
  if (!plan) return "starter";
  if (plan.startsWith("pro")) return "pro";
  if (plan.startsWith("growth")) return "growth";
  return "starter";
}

export function getTableLimit(plan: string | undefined | null): number {
  return PLAN_TABLE_LIMITS[normalizePlan(plan)];
}

export function isPaidPlan(plan: string | undefined | null): boolean {
  return normalizePlan(plan) !== "starter";
}

export function isProPlan(plan: string | undefined | null): boolean {
  return normalizePlan(plan) === "pro";
}

export function isGrowthPlan(plan: string | undefined | null): boolean {
  return normalizePlan(plan) === "growth";
}

export function isStarterPlan(plan: string | undefined | null): boolean {
  return normalizePlan(plan) === "starter";
}

export function getRestaurantPlan(restaurant: {
  plan?: string;
  subscription?: { plan?: string; status?: string };
} | null | undefined): PlanId | "starter" {
  const sub = restaurant?.subscription;
  if (sub?.status === "active" && sub.plan) {
    return sub.plan as PlanId;
  }
  if (restaurant?.plan === "starter") return "starter";
  return "starter";
}

export function hasActivePaidSubscription(restaurant: {
  subscription?: { plan?: string; status?: string };
} | null | undefined): boolean {
  const sub = restaurant?.subscription;
  return Boolean(
    sub?.status === "active" && sub.plan && isPaidPlan(sub.plan)
  );
}

export function isExplicitFreeTier(restaurant: {
  plan?: string;
  subscription?: { plan?: string; status?: string };
} | null | undefined): boolean {
  if (restaurant?.plan === "starter") return true;
  const sub = restaurant?.subscription;
  return sub?.plan === "starter" && sub?.status === "active";
}
