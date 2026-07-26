"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  House,
  ForkKnife,
  QrCode,
  ClipboardText,
  Users,
  Gear,
  CreditCard,
  SignOut,
  Headset,
  WhatsappLogo,
  Sparkle,
  List,
  X,
  WarningCircle,
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
  { href: "/dashboard/support", icon: Headset, label: "Support & Services" },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(true);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
  } else if (isStarter || isGrowth) {
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
  
  const expiresAt = restaurant?.subscription?.expiresAt;
  let daysRemaining = null;
  if (expiresAt && currentPlan !== "starter") {
    const expiryDate = new Date(expiresAt);
    const diffTime = expiryDate.getTime() - Date.now();
    daysRemaining = Math.ceil(diffTime / msPerDay);
  }
  const showExpiryAlert = showExpiryWarning && daysRemaining !== null && daysRemaining <= 5 && daysRemaining >= 0;
  
  const isBillingPage = pathname === "/dashboard/billing";

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-[#f9f9ff]">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-[#0d1b2a] text-white p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="SaaS Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-sm tracking-tight truncate max-w-[180px]">
            {restaurant?.name || "Loading..."}
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <List size={24} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "w-[260px] md:w-[220px] shrink-0 bg-[#0d1b2a] flex flex-col fixed md:sticky top-0 h-dvh z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Close Button & Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden hidden md:flex">
              <img src="/logo.png" alt="SaaS Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight truncate hidden md:block" title={restaurant?.name || "Loading..."}>
              {restaurant?.name || "Loading..."}
            </span>
            <span className="font-semibold text-white text-lg md:hidden">Menu</span>
          </div>
          <button 
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Dashboard navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors relative",
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
                  size={20}
                  weight={isActive ? "fill" : "regular"}
                  className="relative z-10 shrink-0 md:w-[17px] md:h-[17px]"
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Promotion Card */}
        {role !== "cook" && role !== "waiter" && (
          <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Sparkle size={64} weight="fill" color="white" />
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Sparkle size={14} weight="fill" className="text-indigo-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Premium Setup</span>
            </div>
            <p className="text-[11px] text-white/70 mb-3 leading-relaxed relative z-10">
              No time to add menu items? Let us digitize your menu for just <strong className="text-white">₹499</strong>.
            </p>
            <a 
              href="https://wa.me/918050280065?text=Hi,%20I%20would%20like%20to%20get%20my%20menu%20set%20up%20for%20%E2%82%B9499."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative z-10"
            >
              <WhatsappLogo size={14} weight="fill" />
              WhatsApp Us
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors w-full"
            aria-label="Sign out"
          >
            <SignOut size={20} className="md:w-[17px] md:h-[17px]" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {isBlocked && !isBillingPage ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e2e8f0]">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} weight="fill" />
              </div>
              <h2 className="text-2xl font-bold text-[#0d1b2a] mb-2">Trial Expired</h2>
              <p className="text-[#44474c] mb-6">
                Your 14-day free trial has expired. Please choose a subscription plan to continue using Nosh.
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
        
        <div className={cn(isBlocked && !isBillingPage && "pointer-events-none blur-sm select-none", "h-full w-full max-w-[100vw] overflow-x-hidden flex flex-col")}>
          {showExpiryAlert && !isBlocked && (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-amber-800">
                <WarningCircle size={20} weight="fill" className="shrink-0" />
                <p className="text-sm font-medium">
                  Your subscription expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. 
                  <Link href="/dashboard/billing" className="underline ml-1 font-semibold hover:text-amber-900">Renew now</Link> to avoid service interruption.
                </p>
              </div>
              <button 
                onClick={() => setShowExpiryWarning(false)}
                className="text-amber-700 hover:text-amber-900 transition-colors p-1"
                aria-label="Dismiss warning"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
        
        {/* Floating WhatsApp Button */}
        {role !== "cook" && role !== "waiter" && (
          <a
            href="https://wa.me/918050280065?text=Hi,%20I%20need%20help%20with%20my%20Nosh%20Dashboard."
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
            aria-label="Contact Support on WhatsApp"
          >
            <WhatsappLogo size={28} weight="fill" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 group-hover:mr-1 transition-all duration-300 ease-in-out font-medium">
              Need Help?
            </span>
          </a>
        )}
      </main>
    </div>
  );
}

