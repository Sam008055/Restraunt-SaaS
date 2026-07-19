"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CookingPot, Lock } from "@phosphor-icons/react";
import { auth } from "@/lib/firebase/client";
import { signInWithCustomToken } from "firebase/auth";

function StaffLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantIdFromUrl = searchParams.get("r") || "";

  const [restaurantId, setRestaurantId] = useState(restaurantIdFromUrl);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || pin.length !== 4) {
      setError("Enter a valid Restaurant ID and 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      }

      // Store staff session in sessionStorage
      sessionStorage.setItem("staffSession", JSON.stringify(data.staff));
      // Redirect to KDS
      router.push(`/dashboard/orders?staffId=${data.staff.id}&staffName=${encodeURIComponent(data.staff.name)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f9f9ff] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#0d1b2a] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CookingPot size={28} className="text-white" weight="fill" />
          </div>
          <h1 className="text-xl font-bold text-[#0d1b2a]">Staff Login</h1>
          <p className="text-sm text-[#74777d] mt-1">Enter your 4-digit PIN to access the KDS</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Restaurant ID — prefilled if ?r= param is set */}
            {!restaurantIdFromUrl && (
              <div>
                <label className="block text-xs font-semibold text-[#415a77] uppercase tracking-wider mb-1.5">
                  Restaurant ID
                </label>
                <input
                  type="text"
                  placeholder="Ask your manager for this"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value.trim())}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#0d1b2a] transition-colors"
                  required
                />
              </div>
            )}

            {/* PIN input */}
            <div>
              <label className="block text-xs font-semibold text-[#415a77] uppercase tracking-wider mb-1.5">
                Your PIN
              </label>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[i] || ""}
                    id={`pin-${i}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (!val) {
                        setPin((prev) => prev.slice(0, i) + "" + prev.slice(i + 1));
                        return;
                      }
                      const newPin = pin.slice(0, i) + val + pin.slice(i + 1);
                      setPin(newPin.slice(0, 4));
                      // Auto-advance
                      if (i < 3) {
                        (document.getElementById(`pin-${i + 1}`) as HTMLInputElement)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !pin[i] && i > 0) {
                        (document.getElementById(`pin-${i - 1}`) as HTMLInputElement)?.focus();
                      }
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-[#e2e8f0] rounded-xl focus:border-[#0d1b2a] focus:outline-none transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full h-11 rounded-xl bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock size={16} weight="bold" />
              {loading ? "Checking..." : "Login to KDS"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#74777d] mt-4">
          Restaurant owners can manage staff at{" "}
          <a href="/dashboard/staff" className="underline text-[#415a77]">
            Dashboard → Staff
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
      </div>
    }>
      <StaffLoginForm />
    </Suspense>
  );
}
