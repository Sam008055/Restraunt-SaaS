"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

/* ─── Theme templates ─── */
const THEMES = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean lines, generous whitespace, modern sans-serif",
    palette: ["#ffffff", "#f9f9f9", "#0d1b2a", "#10b981"],
    previewBg: "#f9f9f9",
    previewAccent: "#0d1b2a",
  },
  {
    id: "playful",
    label: "Playful",
    description: "Rounded shapes, vibrant accents, friendly vibe",
    palette: ["#fef9f0", "#fff0dc", "#e85d04", "#ffba08"],
    previewBg: "#fef9f0",
    previewAccent: "#e85d04",
  },
  {
    id: "elegant",
    label: "Elegant",
    description: "Rich tones, refined spacing, premium feel",
    palette: ["#faf7f2", "#f0ebe3", "#1a1208", "#c9a84c"],
    previewBg: "#faf7f2",
    previewAccent: "#c9a84c",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Dark mode, high contrast, bold neon accents",
    palette: ["#0a0f1a", "#131927", "#00e5cc", "#6c63ff"],
    previewBg: "#0a0f1a",
    previewAccent: "#00e5cc",
  },
];

/* ─── Subscription plans ─── */
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "₹1,499",
    period: "/mo",
    description: "Perfect for a single-outlet restaurant",
    features: [
      "Up to 10 tables",
      "Digital QR menu",
      "Order management dashboard",
      "Standard analytics",
      "Email support",
    ],
    tableLimit: 10,
    isRecommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹3,999",
    period: "/mo",
    description: "For growing restaurants & multi-outlet chains",
    features: [
      "Up to 50 tables",
      "Everything in Basic",
      "Online pre-pay (Razorpay)",
      "Custom domain support",
      "Advanced CRM & analytics",
      "Priority support",
    ],
    tableLimit: 50,
    isRecommended: true,
  },
];

const FONT_OPTIONS = [
  { label: "Geist (Default)", value: "geist" },
  { label: "Inter", value: "inter" },
  { label: "Outfit", value: "outfit" },
  { label: "Satoshi", value: "satoshi" },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("id");

  const [selectedTheme, setSelectedTheme] = useState("minimal");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [primaryColor, setPrimaryColor] = useState("#0d1b2a");
  const [fontFamily, setFontFamily] = useState("geist");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      alert("Restaurant ID is missing. Please restart onboarding.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        theme: {
          template: selectedTheme,
          primaryColor,
          fontFamily,
        },
        plan: selectedPlan,
        status: "onboarding_step_3",
      });
      router.push(`/onboarding/step-3?id=${restaurantId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save theme and plan.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl md:text-[32px] font-semibold text-[#0d1b2a] tracking-tight leading-tight mb-2">
        Choose your menu style
      </h1>
      <p className="text-[#44474c] text-base leading-relaxed mb-10">
        This is how your customers will see your menu when they scan the QR
        code. You can change it any time.
      </p>

      {/* ── Theme cards ── */}
      <section aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="text-xs font-semibold tracking-widest text-[#415a77] uppercase mb-5">
          Menu Template
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-10">
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <motion.button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme.id)}
                whileTap={{ scale: 0.97 }}
                aria-pressed={isSelected}
                className={cn(
                  "relative text-left rounded-xl border-2 p-4 transition-all duration-150",
                  isSelected
                    ? "border-[#0d1b2a] shadow-[0_0_0_3px_rgba(13,27,42,0.08)]"
                    : "border-[#e2e8f0] hover:border-[#c4c6cc]"
                )}
              >
                {/* Mini preview */}
                <div
                  className="w-full h-16 rounded-lg mb-3 flex flex-col gap-1.5 p-2.5 overflow-hidden"
                  style={{ backgroundColor: theme.previewBg }}
                >
                  <div
                    className="h-2 rounded-full w-2/3"
                    style={{ backgroundColor: theme.previewAccent, opacity: 0.9 }}
                  />
                  <div className="h-1.5 rounded-full w-1/2 bg-black/10" />
                  <div className="flex gap-1.5 mt-auto">
                    {theme.palette.slice(2).map((c, i) => (
                      <div
                        key={i}
                        className="h-4 w-10 rounded"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Labels */}
                <p className="text-sm font-semibold text-[#0d1b2a]">{theme.label}</p>
                <p className="text-xs text-[#74777d] mt-0.5 leading-snug">{theme.description}</p>

                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 bg-[#0d1b2a] rounded-full flex items-center justify-center"
                  >
                    <Check size={10} weight="bold" className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── Brand identity ── */}
      <section aria-labelledby="brand-heading" className="mb-10">
        <h2 id="brand-heading" className="text-xs font-semibold tracking-widest text-[#415a77] uppercase mb-5">
          Brand Identity
        </h2>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 space-y-5">
          {/* Color picker */}
          <div>
            <label
              htmlFor="primaryColor"
              className="block text-sm font-semibold text-[#0d1b2a] mb-2"
            >
              Primary Accent Color
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[#e2e8f0] cursor-pointer p-1 bg-white"
                  aria-label="Choose primary color"
                />
              </div>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                    setPrimaryColor(e.target.value);
                }}
                maxLength={7}
                className="w-32 px-3 py-2 rounded-lg border-[1.5px] border-[#c4c6cc] font-mono text-sm text-[#0d1b2a] focus:outline-none focus:border-[#0d1b2a] transition"
                aria-label="Hex color value"
              />
              <span className="text-xs text-[#74777d]">Used for buttons & accents</span>
            </div>
          </div>

          {/* Font picker */}
          <div>
            <label
              htmlFor="fontFamily"
              className="block text-sm font-semibold text-[#0d1b2a] mb-2"
            >
              Menu Font
            </label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full md:w-64 px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] bg-white text-sm text-[#0d1b2a] focus:outline-none focus:border-[#0d1b2a] transition"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Subscription plans ── */}
      <section aria-labelledby="plan-heading" className="mb-10">
        <h2 id="plan-heading" className="text-xs font-semibold tracking-widest text-[#415a77] uppercase mb-5">
          Subscription Plan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <motion.button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isSelected}
                className={cn(
                  "relative text-left rounded-xl border-2 p-5 transition-all duration-150",
                  isSelected
                    ? "border-[#0d1b2a] bg-white shadow-[0_0_0_3px_rgba(13,27,42,0.08)]"
                    : "border-[#e2e8f0] bg-white hover:border-[#c4c6cc]"
                )}
              >
                {plan.isRecommended && (
                  <span className="absolute -top-2.5 left-4 bg-[#10b981] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Recommended
                  </span>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[#0d1b2a] text-sm">{plan.name}</p>
                    <p className="text-xs text-[#74777d] mt-0.5">{plan.description}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-5 h-5 bg-[#0d1b2a] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <Check size={10} weight="bold" className="text-white" />
                    </motion.div>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-[#0d1b2a]">{plan.price}</span>
                  <span className="text-sm text-[#74777d]">{plan.period}</span>
                </div>

                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#44474c]">
                      <Check size={12} weight="bold" className="text-[#10b981] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-[#74777d] mt-3">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </section>

      {/* CTA */}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={isSubmitting}
        className="w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        aria-label="Proceed to payment"
      >
        {isSubmitting ? (
          <span>Saving...</span>
        ) : (
          <>
            Proceed to Payment
            <ArrowRight size={16} weight="bold" />
          </>
        )}
      </motion.button>
    </form>
  );
}
