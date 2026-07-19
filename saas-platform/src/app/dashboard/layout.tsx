"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV_ITEMS = [
  { href: "/dashboard", icon: House, label: "Dashboard" },
  { href: "/dashboard/menu", icon: ForkKnife, label: "Menu Builder" },
  { href: "/dashboard/tables", icon: QrCode, label: "Tables & QR" },
  { href: "/dashboard/orders", icon: ClipboardText, label: "Orders" },
  { href: "/dashboard/staff", icon: Users, label: "Staff" },
  { href: "/dashboard/settings", icon: Gear, label: "Settings" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
          {/* Restaurant name */}
          <p className="text-[#415a77] text-xs mt-3 font-medium truncate">
            The Spice Garden
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors w-full"
            aria-label="Sign out"
          >
            <SignOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
