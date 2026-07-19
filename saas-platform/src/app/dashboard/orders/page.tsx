"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellSlash,
  Clock,
  ArrowRight,
  CheckCircle,
  Fire,
  ClipboardText,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type OrderStatus = "received" | "preparing" | "served";

interface KDSItem {
  name: string;
  qty: number;
  variant?: string;
}

interface KDSOrder {
  id: string;
  tableNumber: string;
  items: KDSItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

import { useRestaurantOrders, useCurrentRestaurant } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

const COLUMNS: { status: OrderStatus; label: string; accent: string; bg: string; icon: typeof ClipboardText }[] = [
  {
    status: "received",
    label: "Received",
    accent: "#0d1b2a",
    bg: "#e8edff",
    icon: ClipboardText,
  },
  {
    status: "preparing",
    label: "Preparing",
    accent: "#d97706",
    bg: "#fff7ed",
    icon: Fire,
  },
  {
    status: "served",
    label: "Served",
    accent: "#10b981",
    bg: "#f0fdf4",
    icon: CheckCircle,
  },
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  received: "preparing",
  preparing: "served",
  served: null,
};

const ACTION_LABEL: Record<OrderStatus, string> = {
  received: "Start Preparing",
  preparing: "Mark Served",
  served: "Done",
};

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

function OrderCard({
  order,
  onAdvance,
}: {
  order: KDSOrder;
  onAdvance: (id: string) => void;
}) {
  const elapsed = useElapsed(order.createdAt);
  const nextStatus = NEXT_STATUS[order.status];
  const isUrgent = order.status === "received" &&
    Date.now() - order.createdAt.getTime() > 5 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white rounded-xl border overflow-hidden",
        order.status === "received" && "border-[#c4c6cc]",
        order.status === "preparing" && "border-amber-200",
        order.status === "served" && "border-emerald-200",
        isUrgent && "ring-2 ring-red-400 ring-offset-1"
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5",
          order.status === "received" && "bg-[#f1f3ff]",
          order.status === "preparing" && "bg-amber-50",
          order.status === "served" && "bg-emerald-50"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#0d1b2a]">
            T{order.tableNumber}
          </span>
          {order.status === "received" && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full"
            >
              NEW
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#74777d]">
          <Clock size={11} />
          <span className={cn(isUrgent && "text-red-500 font-semibold")}>{elapsed}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-2">
            <p className="text-sm text-[#0d1b2a] leading-snug">
              <span className="font-semibold">{item.qty}×</span>{" "}
              {item.name}
              {item.variant && (
                <span className="text-[#74777d] text-xs"> ({item.variant})</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3 border-t border-[#f9f9ff] pt-2.5">
        <span className="text-sm font-semibold text-[#0d1b2a]">₹{order.total}</span>
        {nextStatus && (
          <button
            onClick={() => onAdvance(order.id)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white transition active:scale-95",
              order.status === "received" && "bg-[#0d1b2a]",
              order.status === "preparing" && "bg-amber-500"
            )}
            aria-label={ACTION_LABEL[order.status]}
          >
            {ACTION_LABEL[order.status]}
            <ArrowRight size={11} weight="bold" />
          </button>
        )}
        {!nextStatus && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle size={12} weight="fill" />
            Complete
          </span>
        )}
      </div>
    </motion.div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span suppressHydrationWarning className="font-mono text-sm text-[#44474c]">
      {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export default function KitchenDashboard() {
  const { restaurantId, loading: authLoading } = useCurrentRestaurant();
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurantId);
  const loading = authLoading || ordersLoading;
  
  const [soundOn, setSoundOn] = useState(true);

  // Play sound effect when a new order comes in
  useEffect(() => {
    if (!soundOn || loading || orders.length === 0) return;
    const hasNew = orders.some(
      (o) => o.status === "received" && Date.now() - o.createdAt.getTime() < 5000
    );
    if (hasNew) {
      // Audio stub
      console.log("DING! New order received.");
    }
  }, [orders, soundOn, loading]);

  const advanceOrder = async (id: string, currentStatus: OrderStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    await updateDoc(doc(db, "orders", id), {
      status: next,
    });
  };

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-lg font-semibold text-[#0d1b2a]">Kitchen Dashboard</h1>
          <p className="text-xs text-[#74777d] mt-0.5">
            {orders.filter((o) => o.status !== "served").length} active orders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <button
            onClick={() => setSoundOn((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition",
              soundOn
                ? "border-[#e2e8f0] text-[#44474c] hover:bg-[#f1f3ff]"
                : "border-red-200 text-red-500 bg-red-50"
            )}
            aria-label={soundOn ? "Mute alerts" : "Unmute alerts"}
          >
            {soundOn ? <Bell size={13} /> : <BellSlash size={13} />}
            {soundOn ? "Sound on" : "Muted"}
          </button>
        </div>
      </div>

      {/* KDS board */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center py-20 text-[#74777d]">
            Loading kitchen dashboard...
          </div>
        ) : COLUMNS.map((col) => {
          const colOrders = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          const Icon = col.icon;

          return (
            <div
              key={col.status}
              className="flex flex-col border-r border-[#e2e8f0] last:border-0"
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] sticky top-0 z-10"
                style={{ backgroundColor: col.bg }}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={16}
                    weight="fill"
                    style={{ color: col.accent }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: col.accent }}
                  >
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: col.accent }}
                >
                  {countByStatus(col.status)}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <AnimatePresence initial={false}>
                  {colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order as KDSOrder}
                      onAdvance={(id) => advanceOrder(id, order.status as OrderStatus)}
                    />
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-[#74777d]">No orders</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
