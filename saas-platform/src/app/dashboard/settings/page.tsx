"use client";

import { useState, useEffect } from "react";
import { Storefront, Bank, Receipt, CheckCircle, Warning, Spinner } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCurrentRestaurant } from "@/lib/firebase/hooks";

export default function SettingsPage() {
  const { restaurantId } = useCurrentRestaurant();
  const [activeTab, setActiveTab] = useState<"general" | "payouts" | "taxes">("general");

  // ── Payouts tab state ─────────────────────────────────────────────────
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [existingKeyId, setExistingKeyId] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);

  useEffect(() => {
    if (activeTab !== "payouts" || !restaurantId) return;
    setLoadingKeys(true);
    fetch(`/api/razorpay/save-keys?restaurantId=${restaurantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.configured) setExistingKeyId(data.keyId);
      })
      .finally(() => setLoadingKeys(false));
  }, [activeTab]);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim() || !keySecret.trim()) return;
    setSaving(true);
    setSaveStatus("idle");
    setSaveError("");

    try {
      const res = await fetch("/api/razorpay/save-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, keyId, keySecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save keys.");
      setSaveStatus("success");
      setExistingKeyId(keyId);
      setKeyId("");
      setKeySecret("");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch (err: any) {
      setSaveStatus("error");
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Settings</h1>
        <p className="text-sm text-[#74777d] mt-1">
          Manage your restaurant details, payouts, and preferences.
        </p>
      </div>

      <div className="px-8 flex gap-8">
        {/* Sidebar Nav */}
        <aside className="w-48 shrink-0">
          <nav className="flex flex-col gap-1">
            {[
              { id: "general", label: "General", icon: Storefront },
              { id: "payouts", label: "Payments (Razorpay)", icon: Bank },
              { id: "taxes", label: "Taxes & Fees", icon: Receipt },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                    isActive ? "bg-[#0d1b2a] text-white" : "text-[#44474c] hover:bg-[#f1f3ff]"
                  )}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-[#e2e8f0] p-6 min-h-[400px]">
          {/* ── General Tab ─────────────────────────────────────────── */}
          {activeTab === "general" && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-semibold text-[#0d1b2a] border-b border-[#f1f3ff] pb-3">
                General Information
              </h2>
              <div>
                <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">Restaurant Name</label>
                <input
                  type="text"
                  defaultValue=""
                  placeholder="e.g. The Spice Garden"
                  className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">Public Menu URL (Slug)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#c4c6cc] bg-[#f9f9ff] text-[#74777d] text-sm">
                    savorsystem.com/r/
                  </span>
                  <input
                    type="text"
                    defaultValue=""
                    placeholder="the-spice-garden"
                    className="flex-1 px-4 py-2.5 rounded-r-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] outline-none text-sm"
                  />
                </div>
              </div>
              <button className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {/* ── Payments Tab ─────────────────────────────────────────── */}
          {activeTab === "payouts" && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-semibold text-[#0d1b2a] border-b border-[#f1f3ff] pb-3">
                Razorpay Integration
              </h2>

              <p className="text-sm text-[#74777d]">
                Connect your Razorpay account so customers can pay directly from their table. Payments go
                directly into your Razorpay account — we never touch the funds.
              </p>

              {/* Current status */}
              {loadingKeys ? (
                <div className="flex items-center gap-2 text-sm text-[#74777d]">
                  <Spinner size={16} className="animate-spin" />
                  Checking status...
                </div>
              ) : existingKeyId ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Razorpay Connected</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Key ID: <span className="font-mono">{existingKeyId}</span>
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Customers can pay online. To update, enter new keys below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Warning size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Not Connected</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Without Razorpay keys, customers can only order with "Pay at Table". Connect below to enable online payments.
                    </p>
                  </div>
                </div>
              )}

              {/* Key entry form */}
              <form onSubmit={handleSaveKeys} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                    Key ID
                  </label>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="rzp_live_..."
                    className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] outline-none text-sm font-mono"
                  />
                  <p className="text-xs text-[#74777d] mt-1">
                    Found in Razorpay Dashboard → Settings → API Keys
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                    Key Secret
                  </label>
                  <input
                    type="password"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] outline-none text-sm font-mono"
                  />
                  <p className="text-xs text-[#74777d] mt-1">
                    Your secret is encrypted and never exposed to the browser after saving.
                  </p>
                </div>

                {saveStatus === "error" && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {saveError}
                  </div>
                )}
                {saveStatus === "success" && (
                  <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    ✓ Razorpay keys saved successfully.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !keyId || !keySecret}
                  className="flex items-center gap-2 h-10 px-5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {saving && <Spinner size={14} className="animate-spin" />}
                  {existingKeyId ? "Update API Keys" : "Save API Keys"}
                </button>
              </form>
            </div>
          )}

          {/* ── Taxes Tab ─────────────────────────────────────────────── */}
          {activeTab === "taxes" && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-semibold text-[#0d1b2a] border-b border-[#f1f3ff] pb-3">
                Taxes & Fees
              </h2>
              <div>
                <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">GST Rate (%)</label>
                <input
                  type="number"
                  defaultValue={5}
                  min={0}
                  max={28}
                  className="w-36 px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] outline-none text-sm"
                />
                <p className="text-xs text-[#74777d] mt-1">
                  Applied to all order totals. Common rates: 5% (restaurants), 18% (bars).
                </p>
              </div>
              <button className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors">
                Save Tax Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
