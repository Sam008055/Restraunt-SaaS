"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellSlash,
  Clock,
  CheckCircle,
  Fire,
  ClipboardText,
  CookingPot,
  UserCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useRestaurantOrders, useCurrentRestaurant, useRestaurantStaff } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

type OrderStatus = "received" | "preparing" | "served";

interface KDSItem {
  name: string;
  qty: number;
  variant?: string;
  variantName?: string;
  price?: number;
}

interface KDSOrder {
  id: string;
  tableNumber: string;
  customerName?: string;
  items: KDSItem[];
  totalPaise?: number;
  status: OrderStatus;
  createdAt: Date;
  assignedCookId?: string;
  assignedCookName?: string;
}

const COLUMNS: { status: OrderStatus; label: string; accent: string; bg: string; icon: typeof ClipboardText }[] = [
  { status: "received", label: "Received", accent: "#0d1b2a", bg: "#e8edff", icon: ClipboardText },
  { status: "preparing", label: "Preparing", accent: "#d97706", bg: "#fff7ed", icon: Fire },
  { status: "served", label: "Served", accent: "#10b981", bg: "#f0fdf4", icon: CheckCircle },
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
  staff,
  isPro,
}: {
  order: KDSOrder;
  onAdvance: (id: string) => void;
  staff: any[];
  isPro: boolean;
}) {
  const elapsed = useElapsed(order.createdAt);
  const nextStatus = NEXT_STATUS[order.status];
  const isUrgent = order.status === "received" && Date.now() - order.createdAt.getTime() > 5 * 60 * 1000;
  const [assigning, setAssigning] = useState(false);

  const handleAssignCook = async (cookId: string) => {
    const cook = staff.find((s) => s.id === cookId);
    setAssigning(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        assignedCookId: cookId || null,
        assignedCookName: cook?.name || null,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("[assignCook] Error:", err);
    } finally {
      setAssigning(false);
    }
  };

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
          "flex items-center justify-between px-4 py-3 border-b border-[#f9f9ff]",
          order.status === "received" && "bg-[#f1f3ff]",
          order.status === "preparing" && "bg-amber-50",
          order.status === "served" && "bg-emerald-50"
        )}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#0d1b2a]">
              Table {order.tableNumber}
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
          {order.customerName && (
            <span className="text-xs text-[#415a77] font-medium flex items-center gap-1 mt-0.5">
              <UserCircle size={12} weight="fill" />
              {order.customerName}
            </span>
          )}
          <span className="text-sm font-bold text-emerald-600 mt-0.5">
            ₹{order.totalPaise ? order.totalPaise / 100 : 0}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#74777d] bg-white px-2 py-1 rounded-md shadow-sm border border-[#e2e8f0]">
          <Clock size={12} weight="bold" className={cn(isUrgent && "text-red-500")} />
          <span className={cn("font-medium font-mono", isUrgent && "text-red-500 font-bold")}>{elapsed}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="font-bold text-[#0d1b2a] bg-[#f1f3ff] w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">
              {item.qty}×
            </span>
            <p className="text-sm text-[#44474c] leading-snug pt-0.5">
              <span className="font-medium text-[#0d1b2a]">{item.name}</span>
              {(item.variant || item.variantName) && (
                <span className="text-[#74777d] text-xs block mt-0.5">
                  Variant: {item.variant || item.variantName}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Cook Assignment — Pro only */}
      {isPro && order.status !== "served" && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <CookingPot size={13} className="text-[#74777d] shrink-0" />
            <select
              value={order.assignedCookId || ""}
              onChange={(e) => handleAssignCook(e.target.value)}
              disabled={assigning}
              className="flex-1 h-8 px-2 rounded-lg border border-[#e2e8f0] text-xs text-[#44474c] bg-white focus:outline-none focus:border-[#0d1b2a] transition-colors disabled:opacity-60"
            >
              <option value="">— Assign Cook —</option>
              {staff
                .filter((s) => s.role === "cook" || s.role === "waiter")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>
          {order.assignedCookName && (
            <p className="text-[10px] text-[#415a77] mt-1 pl-5 font-medium">
              Assigned to {order.assignedCookName}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-3 flex flex-col pt-2 border-t border-[#f1f3ff]">
        {nextStatus ? (
          <button
            onClick={() => onAdvance(order.id)}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-semibold text-white transition active:scale-95 shadow-sm",
              order.status === "received" && "bg-[#0d1b2a] hover:bg-[#1a2b3d]",
              order.status === "preparing" && "bg-[#10b981] hover:bg-[#059669]"
            )}
            aria-label={ACTION_LABEL[order.status]}
          >
            {ACTION_LABEL[order.status]}
            {order.status === "received" ? <Fire size={14} weight="bold" /> : <CheckCircle size={14} weight="bold" />}
          </button>
        ) : (
          <div className="w-full flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
              <CheckCircle size={14} weight="fill" />
              Order Completed
            </div>
            <button
              onClick={() => {
                const win = window.open("", "_blank");
                if (win) {
                  win.document.write(`
                    <html>
                    <head><title>Bill - Table ${order.tableNumber}</title></head>
                    <body style="font-family: monospace; padding: 20px; max-width: 300px; margin: auto;">
                      <h2 style="text-align: center; margin-bottom: 5px;">Restaurant Bill</h2>
                      <p style="text-align: center; margin-top: 0;">Table: ${order.tableNumber}</p>
                      ${order.customerName ? `<p style="text-align: center; margin-top: 0; font-size: 0.9em;">Customer: ${order.customerName}</p>` : ""}
                      <hr style="border: 1px dashed #ccc;" />
                      ${order.items.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                          <span>${item.qty}x ${item.name}</span>
                          <span>${item.price ? "₹" + (item.price * item.qty) : ""}</span>
                        </div>
                      `).join("")}
                      <hr style="border: 1px dashed #ccc;" />
                      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                        <span>Total:</span>
                        <span>₹${order.totalPaise ? order.totalPaise / 100 : 0}</span>
                      </div>
                      <p style="text-align: center; margin-top: 20px;">Thank You!</p>
                      <script>
                        window.onload = () => { window.print(); window.close(); }
                      </script>
                    </body>
                    </html>
                  `);
                  win.document.close();
                }
              }}
              className="px-3 h-10 bg-white border border-[#c4c6cc] rounded-lg hover:bg-gray-50 flex items-center justify-center text-[#44474c]"
              title="Print Bill"
            >
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                <path d="M216,72H192V40a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8V72H40a16,16,0,0,0-16,16V168a16,16,0,0,0,16,16H64v32a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8V184h24a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM80,48h96V72H80ZM176,208H80V160h96Zm40-40H192V152a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v16H40V88H216V168ZM172,112a12,12,0,1,1-12-12A12,12,0,0,1,172,112Z" />
              </svg>
            </button>
          </div>
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
  const { restaurant, restaurantId, loading: authLoading } = useCurrentRestaurant();
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurantId);
  const { staff } = useRestaurantStaff(restaurantId);
  const loading = authLoading || ordersLoading;

  const isPro = restaurant?.subscription?.plan === "pro";
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    if (!soundOn || loading || orders.length === 0) return;
    const hasNew = orders.some(
      (o) => o.status === "received" && Date.now() - o.createdAt.getTime() < 5000
    );
    if (hasNew) {
      console.log("DING! New order received.");
    }
  }, [orders, soundOn, loading]);

  const advanceOrder = async (id: string, currentStatus: OrderStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await updateDoc(doc(db, "orders", id), { status: next, updatedAt: new Date() });
    } catch (err) {
      console.error("[advanceOrder] Error:", err);
      alert("Failed to update order status. Please refresh and try again.");
    }
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
            {isPro && staff.length > 0 && ` · ${staff.length} staff`}
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
        ) : (
          COLUMNS.map((col) => {
            const colOrders = orders
              .filter((o) => o.status === col.status)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const Icon = col.icon;

            return (
              <div key={col.status} className="flex flex-col border-r border-[#e2e8f0] last:border-0">
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] sticky top-0 z-10"
                  style={{ backgroundColor: col.bg }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} weight="fill" style={{ color: col.accent }} />
                    <span className="text-sm font-semibold" style={{ color: col.accent }}>
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
                        staff={staff}
                        isPro={isPro}
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
          })
        )}
      </div>
    </div>
  );
}
