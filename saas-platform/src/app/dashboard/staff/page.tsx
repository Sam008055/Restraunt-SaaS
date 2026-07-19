"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  ShieldCheck,
  Trash,
  Eye,
  EyeSlash,
  CookingPot,
  Lock,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCurrentRestaurant } from "@/lib/firebase/hooks";
import { useRestaurantStaff } from "@/lib/firebase/hooks";
import toast from "react-hot-toast";
import Link from "next/link";

export default function StaffPage() {
  const { restaurant } = useCurrentRestaurant();
  const { staff, loading } = useRestaurantStaff(restaurant?.id || null);
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [form, setForm] = useState({ name: "", role: "cook", pin: "" });

  const isPro = restaurant?.subscription?.plan === "pro";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;
    if (!form.name.trim() || form.pin.length !== 4) {
      toast.error("Name and a 4-digit PIN are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${form.name} added!`);
      setForm({ name: "", role: "cook", pin: "" });
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (staffId: string, name: string) => {
    if (!restaurant?.id) return;
    if (!confirm(`Remove ${name}? They will lose access immediately.`)) return;
    try {
      const res = await fetch("/api/staff/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, restaurantId: restaurant.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${name} removed.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove.");
    }
  };

  if (!isPro) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="bg-white p-10 rounded-2xl border border-[#e2e8f0] shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-purple-600" weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-[#0d1b2a] mb-2">Pro Plan Required</h2>
          <p className="text-sm text-[#44474c] mb-6">
            Staff Management (Cooks &amp; KDS Assignment) is available on the Pro plan for ₹3,000/month.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex h-11 items-center justify-center px-6 bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white font-semibold rounded-lg transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Staff Management</h1>
          <p className="text-sm text-[#74777d] mt-1">
            Add cooks and staff who can log into the KDS screen.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#0d1b2a] hover:bg-[#1b263b] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <UserPlus size={16} weight="bold" />
          Add Staff
        </button>
      </div>

      <div className="px-8 py-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CookingPot size={40} className="text-[#c4c6cc] mb-3" />
            <p className="text-sm font-medium text-[#44474c]">No staff yet</p>
            <p className="text-xs text-[#74777d] mt-1">Add a cook so they can log into the KDS.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f9f9ff] border-b border-[#e2e8f0]">
                  <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">PIN</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3ff]">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-[#f9f9ff] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8edff] text-[#0d1b2a] flex items-center justify-center font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-[#0d1b2a]">{member.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck
                          size={16}
                          className={member.role === "manager" ? "text-purple-600" : "text-orange-500"}
                          weight="fill"
                        />
                        <span className="text-sm text-[#44474c] capitalize">{member.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-[#74777d]">••••</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#74777d] hover:text-red-500 hover:bg-red-50 transition ml-auto"
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff Login Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <ShieldCheck size={18} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Staff Login Details</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Staff can log in to the KDS dashboard using the link below and their 4-digit PIN.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-blue-100 p-3 mt-1 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Restaurant ID</span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <code className="text-xs font-mono font-bold text-blue-900 bg-blue-50/50 px-2 py-1 rounded select-all">
                  {restaurant?.id}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(restaurant?.id || "");
                    toast.success("Restaurant ID copied!");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Copy ID
                </button>
              </div>
            </div>
            
            <div className="pt-2 border-t border-blue-50">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Direct Login Link</span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <Link
                  href={`/staff-login?r=${restaurant?.id}`}
                  className="text-xs underline font-semibold text-blue-700 hover:text-blue-900 truncate"
                  target="_blank"
                >
                  {typeof window !== "undefined" ? `${window.location.origin}/staff-login?r=${restaurant?.id}` : `/staff-login?r=${restaurant?.id}`}
                </Link>
                <button
                  onClick={() => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/staff-login?r=${restaurant?.id}` : `/staff-login?r=${restaurant?.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Direct link copied!");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setAddOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <h2 className="text-lg font-bold text-[#0d1b2a] mb-4">Add Staff Member</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#415a77] uppercase tracking-wider mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh (Cook)"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#0d1b2a] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#415a77] uppercase tracking-wider mb-1.5">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#0d1b2a] transition-colors bg-white"
                    >
                      <option value="cook">Cook</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#415a77] uppercase tracking-wider mb-1.5">4-Digit PIN</label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        placeholder="e.g. 1234"
                        maxLength={4}
                        value={form.pin}
                        onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full h-10 px-3 pr-10 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#0d1b2a] transition-colors font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777d]"
                      >
                        {showPin ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#74777d] mt-1">The staff member uses this PIN to log in.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-[#44474c] hover:bg-[#f1f3ff] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-10 rounded-lg bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Adding..." : "Add Staff"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
