"use client";

import { useCurrentRestaurant, useRestaurantTables, useRestaurantOrders } from "@/lib/firebase/hooks";
import { QrCode, ClipboardText, CurrencyInr, Fire } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const { restaurant, loading: authLoading } = useCurrentRestaurant();
  const { tables, loading: tablesLoading } = useRestaurantTables(restaurant?.id || null);
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurant?.id || null);

  if (authLoading || tablesLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#74777d]">Loading your dashboard...</p>
      </div>
    );
  }

  const activeTables = tables.filter(t => t.isActive).length;
  
  // Basic stats based on orders
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  
  const activeOrders = orders.filter(o => o.status === "received" || o.status === "preparing").length;
  const revenueToday = todayOrders.reduce((sum, o) => sum + ((o.totalPaise || 0) / 100), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0d1b2a] mb-1">
          Welcome back, {restaurant?.name || "Partner"}!
        </h1>
        <p className="text-[#44474c]">Here is what's happening at your restaurant today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Orders */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Fire size={20} weight="fill" />
            </div>
            <p className="text-sm font-semibold text-[#415a77]">Active Orders</p>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">{activeOrders}</p>
        </div>

        {/* Orders Today */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#f1f3ff] text-blue-600 flex items-center justify-center">
              <ClipboardText size={20} weight="fill" />
            </div>
            <p className="text-sm font-semibold text-[#415a77]">Orders Today</p>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">{todayOrders.length}</p>
        </div>

        {/* Revenue Today */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CurrencyInr size={20} weight="fill" />
            </div>
            <p className="text-sm font-semibold text-[#415a77]">Revenue Today</p>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">₹{revenueToday.toLocaleString()}</p>
        </div>

        {/* Active Tables */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#f9f9ff] text-[#0d1b2a] flex items-center justify-center border border-[#e2e8f0]">
              <QrCode size={20} weight="fill" />
            </div>
            <p className="text-sm font-semibold text-[#415a77]">Active Tables</p>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">
            {activeTables} <span className="text-lg text-[#74777d] font-normal">/ {tables.length}</span>
          </p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0d1b2a] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/orders" className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f3ff] hover:border-blue-200 transition-colors group">
            <span className="font-semibold text-[#0d1b2a] group-hover:text-blue-700">Go to Kitchen Display (KDS)</span>
            <ClipboardText size={20} className="text-[#74777d] group-hover:text-blue-600" />
          </Link>
          <Link href="/dashboard/menu" className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f3ff] hover:border-blue-200 transition-colors group">
            <span className="font-semibold text-[#0d1b2a] group-hover:text-blue-700">Edit Menu</span>
            <QrCode size={20} className="text-[#74777d] group-hover:text-blue-600" />
          </Link>
          <Link href="/dashboard/tables" className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f3ff] hover:border-blue-200 transition-colors group">
            <span className="font-semibold text-[#0d1b2a] group-hover:text-blue-700">Manage QR Codes</span>
            <QrCode size={20} className="text-[#74777d] group-hover:text-blue-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
