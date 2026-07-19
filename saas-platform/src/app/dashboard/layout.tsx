"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  House,
  ForkKnife,
  QrCode,
  ClipboardText,
  Users,
  Gear,
  CreditCard,
  SignOut,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCurrentRestaurant } from "@/lib/firebase/hooks";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

const NAV_ITEMS_BASE = [
  { href: "/dashboard", icon: House, label: "Dashboard" },
  { href: "/dashboard/menu", icon: ForkKnife, label: "Menu Builder" },
  { href: "/dashboard/tables", icon: QrCode, label: "Tables & QR" },
  { href: "/dashboard/orders", icon: ClipboardText, label: "Orders" },
  { href: "/dashboard/settings", icon: Gear, label: "Settings" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurant, role, loading } = useCurrentRestaurant();

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  // ── Plan & Role Logic (computed before hooks) ────────────────────
  const currentPlan = restaurant?.subscription?.plan || "starter";
  const isStarter = currentPlan === "starter";
  const isGrowth = currentPlan.startsWith("growth");
  const isPro = currentPlan.startsWith("pro");

  // Build nav items based on role + plan
  let NAV_ITEMS = NAV_ITEMS_BASE;
  if (role === "cook") {
    NAV_ITEMS = [{ href: "/dashboard/orders", icon: ClipboardText, label: "Kitchen (KDS)" }];
  } else if (role === "waiter") {
    NAV_ITEMS = [{ href: "/dashboard/waiter", icon: Users, label: "Waiter Dashboard" }];
  } else if (isStarter) {
    NAV_ITEMS = [
      { href: "/dashboard/menu", icon: ForkKnife, label: "Menu Builder" },
      { href: "/dashboard/settings", icon: Gear, label: "Settings" },
      { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
    ];
  } else if (isGrowth) {
    NAV_ITEMS = NAV_ITEMS_BASE;
  } else if (isPro) {
    NAV_ITEMS = [...NAV_ITEMS_BASE.slice(0, 4), { href: "/dashboard/staff", icon: Users, label: "Staff" }, ...NAV_ITEMS_BASE.slice(4)];
  }

  // Force-redirect staff to their correct pages
  useEffect(() => {
    if (loading || authChecking || !role) return;
    if (role === "cook" && pathname !== "/dashboard/orders") {
      router.replace("/dashboard/orders");
    } else if (role === "waiter" && pathname !== "/dashboard/waiter") {
      router.replace("/dashboard/waiter");
    }
  }, [role, pathname, loading, authChecking, router]);

  // Route protection for owners — redirect to first allowed page
  useEffect(() => {
    if (loading || authChecking || !role) return;
    if (role === "cook" || role === "waiter") return;
    const allowedPaths = NAV_ITEMS.map(n => n.href);
    const isAllowed = allowedPaths.some(p => pathname === p || (p !== "/dashboard" && pathname.startsWith(p)));
    if (!isAllowed) router.replace(NAV_ITEMS[0].href);
  }, [role, pathname, loading, authChecking, router, isStarter, isGrowth, isPro]);

  if (authChecking || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f9f9ff]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
      </div>
    );
  }


  // 14 days trial enforcement
  const trialDays = 14;
  const msPerDay = 24 * 60 * 60 * 1000;
  const createdAtMs = restaurant?.createdAt ? new Date(restaurant.createdAt).getTime() : Date.now();
  const isTrialExpired = Date.now() > createdAtMs + trialDays * msPerDay;
  const isBlocked = isTrialExpired && !restaurant?.subscription;
  
  const isBillingPage = pathname === "/dashboard/billing";

  return (
    <div className="flex min-h-dvh bg-[#f9f9ff]">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#0d1b2a] flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M8 3v10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">
              SavorSystem
            </span>
          </div>
          {/* Restaurant name — dynamic */}
          <p className="text-[#415a77] text-xs mt-3 font-medium truncate">
            {restaurant?.name || "Loading..."}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Dashboard navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  />
                )}
                <Icon
                  size={17}
                  weight={isActive ? "fill" : "regular"}
                  className="relative z-10 shrink-0"
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors w-full"
            aria-label="Sign out"
          >
            <SignOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {isBlocked && !isBillingPage ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e2e8f0]">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} weight="fill" />
              </div>
              <h2 className="text-2xl font-bold text-[#0d1b2a] mb-2">Trial Expired</h2>
              <p className="text-[#44474c] mb-6">
                Your 14-day free trial has expired. Please choose a subscription plan to continue using SavorSystem.
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-flex h-11 items-center justify-center px-6 bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white font-semibold rounded-lg transition-colors w-full"
              >
                View Plans
              </Link>
            </div>
          </div>
        ) : null}
        
        <div className={cn(isBlocked && !isBillingPage && "pointer-events-none blur-sm select-none", "h-full")}>
          {children}
        </div>
      </main>
    </div>
  );
}
