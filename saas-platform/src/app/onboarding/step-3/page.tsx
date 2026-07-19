"use client";

import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Lock } from "@phosphor-icons/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

import { Suspense } from "react";

import { useEffect } from "react";
import { getDoc } from "firebase/firestore";

function Step3Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("id");

  const [paymentMode, setPaymentMode] = useState<"online-prepay" | "pay-at-table" | "both">("both");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState<string>("pro");
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      if (!restaurantId) return;
      try {
        const snap = await getDoc(doc(db, "restaurants", restaurantId));
        if (snap.exists()) {
          setPlanId(snap.data().plan || "pro");
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      } finally {
        setIsLoadingPlan(false);
      }
    }
    fetchPlan();
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      alert("Restaurant ID is missing. Please restart onboarding.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const activateRestaurant = async () => {
        await updateDoc(doc(db, "restaurants", restaurantId), {
          status: "active",
          paymentMode,
        });
        router.push("/dashboard/orders");
      };

      // 1. If Starter (Free) plan, skip Razorpay
      if (planId === "starter") {
        await activateRestaurant();
        return;
      }

      // 2. Otherwise, paid plan - Create Razorpay subscription server-side
      const user = auth.currentUser;
      const email = user?.email || "owner@restaurant.com";
      const name = user?.displayName || "Restaurant Owner";

      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          email,
          name,
          planId, // Send the selected plan to the API
        }),
      });

      const data = await res.json();

      // Dev bypass: Firebase/Razorpay not configured yet — skip to dashboard
      if (!res.ok || data.devBypass) {
        await activateRestaurant();
        return;
      }

      const { subscriptionId, orderId, keyId } = data;

      // 3. Open Razorpay checkout
      const win = window as any;
      if (!win.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.head.appendChild(script);
        });
      }

      const options: any = {
        key: keyId,
        name: "Nosh",
        description: `${PLAN_SUMMARY.name} — 14 days free`,
        theme: { color: "#eaff00" },
        handler: async () => {
          await activateRestaurant();
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      };

      if (subscriptionId) {
        options.subscription_id = subscriptionId;
      } else if (orderId) {
        options.order_id = orderId;
      }

      const rzp = new win.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getPlanSummary = () => {
    switch (planId) {
      case "starter":
        return {
          name: "Starter Plan",
          price: "₹0/mo",
          trial: "Free forever for small setups",
          tables: "Up to 2 tables",
        };
      case "growth":
        return {
          name: "Growth Plan",
          price: "₹499/mo",
          trial: "14 days free, then billed monthly",
          tables: "Up to 15 tables",
        };
      case "pro":
      default:
        return {
          name: "Pro Plan",
          price: "₹1,499/mo",
          trial: "14 days free, then billed monthly",
          tables: "Up to 50 tables",
        };
    }
  };

  const PLAN_SUMMARY = getPlanSummary();

  const PAYMENT_MODES = [
    {
      id: "online-prepay" as const,
      label: "Online Pre-pay",
      description: "Customers pay via Razorpay before order goes to kitchen",
    },
    {
      id: "pay-at-table" as const,
      label: "Pay at Table",
      description: "Order goes to kitchen immediately, staff collects payment",
    },
    {
      id: "both" as const,
      label: "Both",
      description: "Customer or staff can choose at the time of ordering",
    },
  ];

  if (isLoadingPlan) {
    return <div className="py-20 text-center text-[#74777d]">Loading plan details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl md:text-[32px] font-semibold text-[#0d1b2a] tracking-tight leading-tight mb-2">
        {planId === "starter" ? "Complete Setup" : "Start your free trial"}
      </h1>
      <p className="text-[#44474c] text-base leading-relaxed mb-10">
        {planId === "starter" 
          ? "You've selected the Free Starter plan. Ready to dive in?"
          : "14 days free. Cancel any time before trial ends — no charges."}
      </p>

      {/* Order summary */}
      <section aria-labelledby="summary-heading" className="mb-8">
        <h2 id="summary-heading" className="text-xs font-semibold tracking-widest text-[#415a77] uppercase mb-4">
          Order Summary
        </h2>
        <div className="bg-white rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f3ff]">
          <div className="flex justify-between items-center px-5 py-4">
            <div>
              <p className="font-semibold text-sm text-[#0d1b2a]">{PLAN_SUMMARY.name}</p>
              <p className="text-xs text-[#74777d]">{PLAN_SUMMARY.tables}</p>
            </div>
            <p className="text-sm font-semibold text-[#0d1b2a]">{PLAN_SUMMARY.price}</p>
          </div>
          {planId !== "starter" && (
            <div className="flex justify-between items-center px-5 py-4">
              <p className="text-sm text-[#44474c]">Free trial</p>
              <p className="text-sm font-semibold text-[#10b981]">14 days</p>
            </div>
          )}
          <div className="px-5 py-4 bg-[#f9f9ff] rounded-b-xl">
            <p className="text-xs text-[#74777d]">
              {PLAN_SUMMARY.trial}. {planId !== "starter" && "We'll remind you 3 days before the first charge."}
            </p>
          </div>
        </div>
      </section>

      {/* Payment mode preference */}
      <section aria-labelledby="payment-mode-heading" className="mb-8">
        <h2 id="payment-mode-heading" className="text-xs font-semibold tracking-widest text-[#415a77] uppercase mb-4">
          How should customers pay for orders?
        </h2>
        <div className="space-y-3">
          {PAYMENT_MODES.map((mode) => {
            const isSelected = paymentMode === mode.id;
            return (
              <label
                key={mode.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border-2 px-4 py-4 cursor-pointer transition-all duration-150",
                  isSelected
                    ? "border-[#0d1b2a] bg-white shadow-[0_0_0_3px_rgba(13,27,42,0.06)]"
                    : "border-[#e2e8f0] bg-white hover:border-[#c4c6cc]"
                )}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={mode.id}
                  checked={isSelected}
                  onChange={() => setPaymentMode(mode.id)}
                  className="mt-0.5 accent-[#0d1b2a]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0d1b2a]">{mode.label}</p>
                  <p className="text-xs text-[#74777d] mt-0.5">{mode.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-[#74777d] mt-3">
          You can change this setting any time from your restaurant settings.
        </p>
      </section>

      {/* Trust signals */}
      {planId !== "starter" && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {[
            { icon: ShieldCheck, text: "Razorpay secured — PCI-DSS compliant" },
            { icon: Lock, text: "Your card is never stored on our servers" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-[#74777d]">
              <Icon size={14} className="text-[#10b981] shrink-0" />
              {text}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* CTA */}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={isSubmitting}
        className="w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        aria-label={planId === "starter" ? "Complete setup" : "Start free trial and proceed to payment"}
      >
        {isSubmitting ? (
          <span>{planId === "starter" ? "Activating..." : "Opening Razorpay..."}</span>
        ) : (
          <>
            {planId === "starter" ? "Complete Setup" : "Start Free Trial"}
            <ArrowRight size={16} weight="bold" />
          </>
        )}
      </motion.button>


      <p className="text-xs text-center text-[#74777d] mt-4">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-2 hover:text-[#0d1b2a]">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-[#0d1b2a]">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

export default function OnboardingStep3() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#74777d]">Loading...</div>}>
      <Step3Form />
    </Suspense>
  );
}
