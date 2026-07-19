"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BellRinging,
  CheckCircle,
  ClipboardText,
  Clock,
  Fire,
  UserCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useRestaurantOrders, useCurrentRestaurant, useWaiterCalls } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

type OrderStatus = "received" | "preparing" | "served";

function useElapsed(date: Date) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const compute = () => {
      const diff = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diff < 60) setElapsed(`${diff}s`);
      else setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`);
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [date]);
  return elapsed;
}

export default function WaiterDashboard() {
  const { restaurantId, loading: authLoading } = useCurrentRestaurant();
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurantId);
  const { calls, loading: callsLoading } = useWaiterCalls(restaurantId);
  
  const loading = authLoading || ordersLoading || callsLoading;

  const [soundOn, setSoundOn] = useState(true);

  // Play sound effect when a new waiter call comes in
  useEffect(() => {
    if (!soundOn || loading || calls.length === 0) return;
    const hasNew = calls.some(
      (c) => c.status === "pending" && Date.now() - c.createdAt.getTime() < 5000
    );
    if (hasNew) {
      console.log("DING! Waiter call received.");
    }
  }, [calls, soundOn, loading]);

  const resolveCall = async (id: string) => {
    try {
      await updateDoc(doc(db, "waiterCalls", id), { status: "resolved", resolvedAt: new Date() });
    } catch (err) {
      console.error("[resolveCall] Error:", err);
    }
  };

  const activeCalls = calls.filter((c) => c.status === "pending");
  const activeOrders = orders.filter((o) => o.status !== "served").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f9f9ff]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-xl font-semibold text-[#0d1b2a]">Waiter Dashboard</h1>
          <p className="text-sm text-[#74777d] mt-0.5">
            {activeCalls.length} pending calls · {activeOrders.length} active orders
          </p>
        </div>
        <button
          onClick={() => setSoundOn((p) => !p)}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border transition-colors",
            soundOn
              ? "border-[#e2e8f0] text-[#44474c] hover:bg-[#f1f3ff]"
              : "border-red-200 text-red-600 bg-red-50"
          )}
        >
          <BellRinging size={16} />
          {soundOn ? "Sound On" : "Muted"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Waiter Calls */}
        <div className="flex flex-col gap-4 col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <BellRinging size={20} className="text-red-500" weight="fill" />
            <h2 className="text-lg font-bold text-[#0d1b2a]">Table Calls</h2>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold ml-auto">
              {activeCalls.length}
            </span>
          </div>

          <AnimatePresence>
            {activeCalls.map((call) => (
              <CallCard key={call.id} call={call} onResolve={() => resolveCall(call.id)} />
            ))}
            {activeCalls.length === 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center text-[#74777d]">
                <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" weight="fill" />
                <p className="font-semibold text-[#0d1b2a]">All clear</p>
                <p className="text-sm mt-1">No pending table calls.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Columns: Active Orders */}
        <div className="flex flex-col gap-4 col-span-1 md:col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardText size={20} className="text-blue-600" weight="fill" />
            <h2 className="text-lg font-bold text-[#0d1b2a]">Active Orders</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {activeOrders.length === 0 && (
                <div className="col-span-full bg-white rounded-xl border border-[#e2e8f0] p-8 text-center text-[#74777d]">
                  <p className="font-semibold text-[#0d1b2a]">No active orders</p>
                  <p className="text-sm mt-1">The kitchen is caught up.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

function CallCard({ call, onResolve }: { call: any; onResolve: () => void }) {
  const elapsed = useElapsed(call.createdAt);
  const isUrgent = Date.now() - call.createdAt.getTime() > 2 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white rounded-xl border p-4 shadow-sm relative overflow-hidden",
        isUrgent ? "border-red-400 ring-1 ring-red-400" : "border-[#e2e8f0]"
      )}
    >
      {isUrgent && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0d1b2a]">Table {call.tableNumber}</h3>
          <p className="text-xs text-[#74777d] mt-1 flex items-center gap-1 font-medium">
            <Clock size={12} className={isUrgent ? "text-red-500" : ""} />
            <span className={isUrgent ? "text-red-500 font-bold" : ""}>{elapsed} ago</span>
          </p>
        </div>
        <BellRinging size={24} className={isUrgent ? "text-red-500 animate-pulse" : "text-[#415a77]"} />
      </div>
      <button
        onClick={onResolve}
        className="w-full h-10 bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white rounded-lg text-sm font-semibold transition-colors active:scale-[0.98]"
      >
        Mark Resolved
      </button>
    </motion.div>
  );
}

function OrderCard({ order }: { order: any }) {
  const elapsed = useElapsed(order.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden flex flex-col"
    >
      <div className={cn(
        "px-4 py-3 border-b flex justify-between items-center",
        order.status === "received" ? "bg-[#f1f3ff] border-[#e2e8f0]" : "bg-amber-50 border-amber-100"
      )}>
        <div>
          <h3 className="text-lg font-bold text-[#0d1b2a]">Table {order.tableNumber}</h3>
          {order.customerName && (
            <p className="text-xs text-[#415a77] font-medium flex items-center gap-1 mt-0.5">
              <UserCircle size={12} weight="fill" />
              {order.customerName}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
            order.status === "received" ? "bg-blue-100 text-blue-700" : "bg-amber-200 text-amber-800"
          )}>
            {order.status === "preparing" && <Fire size={10} weight="fill" />}
            {order.status}
          </span>
          <span className="text-[10px] font-mono text-[#74777d] font-semibold">{elapsed}</span>
        </div>
      </div>
      
      <div className="px-4 py-3 flex-1">
        <ul className="space-y-2">
          {order.items.map((item: any, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-[#44474c]">
              <span className="font-bold text-[#0d1b2a]">{item.qty}×</span>
              <div className="flex-1">
                <span className="font-medium text-[#0d1b2a]">{item.name}</span>
                {(item.variant || item.variantName) && (
                  <span className="text-xs text-[#74777d] block mt-0.5">
                    {item.variant || item.variantName}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
