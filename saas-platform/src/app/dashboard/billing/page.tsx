"use client";

import { useCurrentRestaurant, useRestaurantTables, useRestaurantOrders } from "@/lib/firebase/hooks";
import { cn } from "@/lib/utils";
import { CreditCard, ChartBar, Table, Receipt } from "@phosphor-icons/react";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import toast from "react-hot-toast";

export default function BillingPage() {
  const { restaurant, loading: authLoading } = useCurrentRestaurant();
  const { tables, loading: tablesLoading } = useRestaurantTables(restaurant?.id || null);
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurant?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  if (authLoading || tablesLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
      </div>
    );
  }

  const subscription = restaurant?.subscription;
  const currentPlan = subscription?.plan || "starter"; // "starter", "growth", "pro", "growth-annual", "pro-annual"
  const isStarter = currentPlan === "starter";
  const baseCurrentPlan = currentPlan.replace("-annual", "");
  const isCurrentlyAnnual = currentPlan.includes("-annual");

  // Real usage stats — no mock data
  const tableCount = tables.length;
  const tableLimit = baseCurrentPlan === "pro" ? 50 : baseCurrentPlan === "growth" ? 15 : 2; // Starter=2, Growth=15, Pro=50
  const tablePercent = Math.min(100, Math.round((tableCount / tableLimit) * 100));

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status !== "served").length;

  // Revenue: sum totalPaise / 100 for rupees
  const totalRevenue = orders.reduce((sum, o) => sum + ((o.totalPaise || 0) / 100), 0);

  const now = new Date();
  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonthOrders.reduce((sum, o) => sum + ((o.totalPaise || 0) / 100), 0);

  const getPlanButton = (planBase: "growth" | "pro") => {
    const planId = billingCycle === "annually" ? `${planBase}-annual` : planBase;
    
    if (currentPlan === planId) {
       return <button disabled className="mt-6 h-9 w-full bg-[#0d1b2a] text-white text-sm font-semibold rounded-lg opacity-50 cursor-default">Current Plan</button>;
    }
    
    const isDowngrade = 
       (baseCurrentPlan === "pro" && planBase === "growth") ||
       (baseCurrentPlan === planBase && isCurrentlyAnnual && billingCycle === "monthly");
       
    if (isDowngrade) {
       return <button disabled className="mt-6 h-9 w-full bg-[#0d1b2a] text-white text-sm font-semibold rounded-lg opacity-50 cursor-default">Contact Support to Downgrade</button>;
    }

    return (
      <button 
        onClick={() => handleManagePlan(planBase)} 
        disabled={isSubmitting} 
        className="mt-6 h-9 w-full bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Loading..." : `Upgrade to ${planBase.charAt(0).toUpperCase() + planBase.slice(1)}`}
      </button>
    );
  };

  const handleManagePlan = async (basePlanToBuy: "starter" | "growth" | "pro") => {
    if (basePlanToBuy === "starter") {
      toast("Please contact support to downgrade to Starter.", { icon: "ℹ️" });
      return;
    }

    const planToBuy = billingCycle === "annually" ? `${basePlanToBuy}-annual` : basePlanToBuy;

    if (currentPlan === planToBuy) {
      toast("Customer portal coming soon. For now, contact support to cancel.", { icon: "ℹ️" });
      return;
    }

    if (!restaurant?.id) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading("Opening Razorpay...");

    try {
      const user = auth.currentUser;
      const email = user?.email || "owner@restaurant.com";
      const name = user?.displayName || "Restaurant Owner";

      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, email, name, planId: planToBuy }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || "Failed to create subscription");
        setIsSubmitting(false);
        return;
      }

      if (data.demoSuccess) {
        toast.dismiss(loadingToast);
        toast.success("Demo Mode: Subscription activated!");
        window.location.reload();
        return;
      }

      const { subscriptionId, orderId, keyId } = data;

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
        description: basePlanToBuy === "pro" ? "Pro Plan" : "Growth Plan",
        theme: { color: "#0d1b2a" },
        handler: async (response: any) => {
          const verifyToast = toast.loading("Verifying payment...");
          try {
            const verifyRes = await fetch("/api/razorpay/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                restaurantId: restaurant.id,
                planId: planToBuy,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            toast.dismiss(verifyToast);
            if (verifyRes.ok) {
              toast.success("Subscription successful!");
              window.location.reload();
            } else {
              const err = await verifyRes.json();
              toast.error(err.error || "Verification failed");
            }
          } catch (e) {
            toast.dismiss(verifyToast);
            toast.error("Verification error");
          }
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

      toast.dismiss(loadingToast);
      const rzp = new win.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  const isGrowthCardCurrent = currentPlan === (billingCycle === "annually" ? "growth-annual" : "growth");
  const isProCardCurrent = currentPlan === (billingCycle === "annually" ? "pro-annual" : "pro");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 bg-white border-b border-[#e2e8f0] flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Billing & Plan</h1>
          <p className="text-sm text-[#74777d] mt-1">
            Manage your subscription and track your usage.
            {subscription?.expiresAt && (
              <span className="block mt-1 text-emerald-600 font-medium">
                Next billing date: {new Date(subscription.expiresAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        
        {/* Billing Toggle */}
        <div className="flex items-center gap-3 bg-[#f1f3ff] p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition",
              billingCycle === "monthly" ? "bg-white text-[#0d1b2a] shadow-sm" : "text-[#74777d] hover:text-[#0d1b2a]"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annually")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition",
              billingCycle === "annually" ? "bg-white text-[#0d1b2a] shadow-sm" : "text-[#74777d] hover:text-[#0d1b2a]"
            )}
          >
            Annually <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1">SAVE</span>
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-5xl">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter Plan */}
          <div className={cn(
            "bg-white rounded-xl border-2 p-6 flex flex-col",
            isStarter ? "border-indigo-600 shadow-sm" : "border-[#e2e8f0]"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0d1b2a]">Starter Plan</h2>
                <p className="text-2xl font-bold text-[#0d1b2a] mt-1">₹0<span className="text-sm text-[#74777d] font-normal"> / month</span></p>
              </div>
              {isStarter && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ 2 Tables</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ Digital QR Menu</li>
              <li className="text-sm text-[#74777d] flex items-center gap-2">✗ No Staff Management</li>
              <li className="text-sm text-[#74777d] flex items-center gap-2">✗ No Priority Support</li>
            </ul>
            <button
              className="mt-6 h-9 w-full bg-[#0d1b2a] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-default"
              disabled
            >
              {isStarter ? "Current Plan" : "Contact Support to Downgrade"}
            </button>
          </div>

          {/* Growth Plan */}
          <div className={cn(
            "bg-white rounded-xl border-2 p-6 flex flex-col relative",
            isGrowthCardCurrent ? "border-indigo-600 shadow-sm" : "border-[#e2e8f0]"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0d1b2a]">Growth Plan</h2>
                <p className="text-2xl font-bold text-[#0d1b2a] mt-1">
                  {billingCycle === "annually" ? "₹4,990" : "₹499"}
                  <span className="text-sm text-[#74777d] font-normal"> / {billingCycle === "annually" ? "year" : "month"}</span>
                </p>
              </div>
              {isGrowthCardCurrent && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ 15 Tables</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ Unlimited Orders</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2 font-semibold">✓ Basic POS Integration</li>
              {billingCycle === "annually" && (
                <li className="text-sm text-emerald-600 flex items-center gap-2 font-semibold">
                  ✓ Free Premium Menu Setup
                </li>
              )}
              <li className="text-sm text-[#74777d] flex items-center gap-2">✗ No Staff Management</li>
            </ul>
            {getPlanButton("growth")}
          </div>

          {/* Pro Plan */}
          <div className={cn(
            "bg-white rounded-xl border-2 p-6 flex flex-col relative overflow-hidden",
            isProCardCurrent ? "border-emerald-600 shadow-sm" : "border-[#e2e8f0]"
          )}>
            {!isProCardCurrent && (
              <div className="absolute top-3 right-[-30px] rotate-45 bg-[#eaff00] text-[#0d1b2a] text-[10px] font-bold py-1 px-8">
                POPULAR
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0d1b2a]">Pro Plan</h2>
                <p className="text-2xl font-bold text-[#0d1b2a] mt-1">
                  {billingCycle === "annually" ? "₹14,990" : "₹1,499"}
                  <span className="text-sm text-[#74777d] font-normal"> / {billingCycle === "annually" ? "year" : "month"}</span>
                </p>
              </div>
              {isProCardCurrent && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ 50 Tables</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2">✓ Online Pre-pay (Razorpay)</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2 font-semibold">✓ Staff Management</li>
              <li className="text-sm text-[#44474c] flex items-center gap-2 font-semibold">✓ KDS Order Assignment</li>
              {billingCycle === "annually" && (
                <li className="text-sm text-emerald-600 flex items-center gap-2 font-semibold">
                  ✓ Free Premium Menu Setup
                </li>
              )}
            </ul>
            {getPlanButton("pro")}
          </div>
        </div>

        {/* Usage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tables Usage */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Table size={16} className="text-[#415a77]" weight="fill" />
              <p className="text-xs font-semibold text-[#415a77] uppercase tracking-widest">
                Tables
              </p>
            </div>
            <p className="text-2xl font-bold text-[#0d1b2a]">
              {tableCount}
              <span className="text-base text-[#74777d] font-normal"> / {tableLimit}</span>
            </p>
            <div className="w-full h-1.5 bg-[#f1f3ff] rounded-full mt-3 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", tablePercent > 90 ? "bg-red-500" : tablePercent > 60 ? "bg-amber-500" : "bg-[#10b981]")}
                style={{ width: `${tablePercent}%` }}
              />
            </div>
            <p className="text-xs text-[#74777d] mt-2">{tablePercent}% of limit used</p>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-[#415a77]" weight="fill" />
              <p className="text-xs font-semibold text-[#415a77] uppercase tracking-widest">
                Orders (All Time)
              </p>
            </div>
            <p className="text-2xl font-bold text-[#0d1b2a]">{totalOrders}</p>
            <p className="text-xs text-[#74777d] mt-2">
              {activeOrders} currently active · Unlimited orders included
            </p>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-[#415a77]" weight="fill" />
            <h2 className="text-sm font-semibold text-[#0d1b2a]">Revenue Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#74777d] mb-1">This Month</p>
              <p className="text-2xl font-bold text-[#10b981]">₹{monthRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-[#74777d] mt-1">{thisMonthOrders.length} orders</p>
            </div>
            <div>
              <p className="text-xs text-[#74777d] mb-1">All Time</p>
              <p className="text-2xl font-bold text-[#0d1b2a]">₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-[#74777d] mt-1">{totalOrders} total orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
