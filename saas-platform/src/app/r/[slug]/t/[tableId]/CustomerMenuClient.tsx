"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Minus,
  Plus,
  X,
  ShoppingCart,
  Bell,
  CheckCircle,
  Fire,
  Storefront,
  Lock,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { CartItem } from "@/lib/types/order";
import { MenuCategory, MenuItem } from "@/lib/types/menu";

interface CustomerMenuClientProps {
  restaurant: {
    id: string;
    name: string;
    plan: string;
    theme: {
      primaryColor: string;
      accentColor: string;
    };
  };
  tableNumber: string;
  tableId: string;
  categories: MenuCategory[];
}

type OrderStatus = "idle" | "placing" | "received" | "preparing" | "served";

export default function CustomerMenuClient({
  restaurant,
  tableNumber,
  tableId,
  categories,
}: CustomerMenuClientProps) {
  // View-only mode for Starter plan — no ordering, just a digital menu
  const isViewOnly = restaurant.plan === "starter";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("idle");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [flyingItem, setFlyingItem] = useState<string | null>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxTotal = Math.round(subtotal * 0.05);
  const total = subtotal + taxTotal;

  // ── Intro Effect ────────────────────────────────────
  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // ── Cart helpers ────────────────────────────────────
  const addToCart = useCallback((item: MenuItem, variantName?: string, variantPrice?: number) => {
    if (isViewOnly) return;
    const resolvedPrice = variantPrice ?? item.price;
    const cartId = `${item.id}-${variantName ?? "base"}`;

    setFlyingItem(cartId);
    setTimeout(() => setFlyingItem(null), 500);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) {
        return prev.map((c) =>
          c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          id: cartId,
          menuItemId: item.id,
          name: item.name,
          price: resolvedPrice,
          variantName,
          quantity: 1,
          isVeg: item.isVeg,
        },
      ];
    });
  }, [isViewOnly]);

  const updateQty = useCallback((cartId: string, delta: number) => {
    if (isViewOnly) return;
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.id === cartId ? { ...c, quantity: c.quantity + delta } : c
      );
      return updated.filter((c) => c.quantity > 0);
    });
  }, [isViewOnly]);

  const getItemQty = (itemId: string, variantName?: string) => {
    const cartId = `${itemId}-${variantName ?? "base"}`;
    return cart.find((c) => c.id === cartId)?.quantity ?? 0;
  };

  // ── Order placement ──────────────────────────────────
  const placeOrder = async (paymentMode: "online" | "pay-at-table") => {
    if (isViewOnly) return;
    setOrderStatus("placing");
    setCartOpen(false);

    if (paymentMode === "pay-at-table") {
      await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId,
          tableNumber,
          cartItems: cart,
          totalPaise: total * 100,
          paymentMethod: "pay-at-table",
          customerName,
        }),
      });
      setOrderStatus("received");
      return;
    }

    // ── Online payment via Razorpay ──────────────────
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId,
          cartItems: cart,
          amountPaise: total * 100,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        alert(error || "Could not create payment order.");
        setOrderStatus("idle");
        return;
      }

      const { orderId, amount, currency, keyId } = await res.json();

      const win = window as any;
      if (!win.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.head.appendChild(script);
        });
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new win.Razorpay({
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: restaurant.name,
          description: `Table ${tableNumber} — ${cart.length} item(s)`,
          theme: { color: restaurant.theme.primaryColor },
          handler: async (response: any) => {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                restaurantId: restaurant.id,
                tableId,
                tableNumber,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                cartItems: cart,
                totalPaise: total * 100,
                customerName,
              }),
            });

            if (verifyRes.ok) {
              setOrderStatus("received");
              resolve();
            } else {
              const { error } = await verifyRes.json();
              alert(error || "Payment verification failed.");
              setOrderStatus("idle");
              reject();
            }
          },
          modal: {
            ondismiss: () => {
              setOrderStatus("idle");
              resolve();
            },
          },
        });
        rzp.open();
      });
    } catch (err: any) {
      console.error("[placeOrder] Error:", err);
      setOrderStatus("idle");
    }
  };

  // ── Call waiter ──────────────────────────────────────
  const callWaiter = async () => {
    try {
      await fetch("/api/waiter/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, tableId, tableNumber }),
      });
      alert(`✓ Waiter called for Table ${tableNumber}. Someone will be with you shortly.`);
    } catch {
      alert(`Waiter call sent for Table ${tableNumber}`);
    }
  };

  const activeCategories = categories.filter((c) => c.isActive);

  const STATUS_CONFIG = {
    received: {
      icon: CheckCircle,
      label: "Order Received",
      sub: "Your order is confirmed",
      color: "text-[#10b981]",
      bg: "bg-emerald-50",
    },
    preparing: {
      icon: Fire,
      label: "Preparing",
      sub: "The kitchen is working on it",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    served: {
      icon: Storefront,
      label: "Served!",
      sub: "Enjoy your meal",
      color: "text-[#10b981]",
      bg: "bg-emerald-50",
    },
  };

  return (
    <div className="min-h-dvh bg-[#f9f9ff] flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* ── Intro Animation ── */}
      <AnimatePresence>
        {showIntro && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Left Curtain */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#0d1b2a]"
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            />
            {/* Right Curtain */}
            <motion.div
              className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#0d1b2a]"
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            />
            
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 relative z-10"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
                style={{ backgroundColor: restaurant.theme.primaryColor }}
              >
                {/* Assuming logoUrl exists, else fallback to Storefront icon */}
                <Storefront size={48} color="#fff" weight="duotone" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-xl font-medium text-white/80">
                  Welcome to
                </h2>
                <h1 className="text-3xl font-black mt-1 text-white tracking-tight">
                  {restaurant.name}
                </h1>
                <p className="text-white/60 mt-2 text-sm">Table {tableNumber}</p>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 px-4 pt-safe-top"
        style={{ backgroundColor: restaurant.theme.primaryColor }}
      >
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-white/60 text-xs mt-0.5">Table {tableNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {isViewOnly && (
              <span className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold">
                <Lock size={10} weight="fill" />
                View Only
              </span>
            )}
            <button
              onClick={callWaiter}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition active:scale-95"
              aria-label="Call waiter"
            >
              <Bell size={14} />
              Call waiter
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-3 scrollbar-none"
          role="tablist"
          aria-label="Menu categories"
        >
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document
                  .getElementById(`cat-${cat.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-all",
                activeCategory === cat.id
                  ? "bg-white text-[#0d1b2a]"
                  : "bg-white/15 text-white/80 hover:bg-white/25"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Order status banner ── */}
      <AnimatePresence>
        {orderStatus !== "idle" && orderStatus !== "placing" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const cfg = STATUS_CONFIG[orderStatus as keyof typeof STATUS_CONFIG];
              const Icon = cfg.icon;
              return (
                <div className={cn("flex items-center gap-3 px-4 py-3", cfg.bg)}>
                  <Icon size={20} weight="fill" className={cfg.color} />
                  <div>
                    <p className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</p>
                    <p className="text-xs text-[#44474c]">{cfg.sub}</p>
                  </div>
                  {orderStatus === "preparing" && (
                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-orange-400"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Placing order overlay ── */}
      <AnimatePresence>
        {orderStatus === "placing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 mx-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-[3px] border-[#10b981] border-t-transparent"
              />
              <p className="text-sm font-semibold text-[#0d1b2a]">Placing your order…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Menu items ── */}
      <main className="flex-1 px-4 pb-32 pt-2">
        {activeCategories.map((cat) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            className="mt-6 scroll-mt-36"
            aria-labelledby={`cat-label-${cat.id}`}
          >
            <h2
              id={`cat-label-${cat.id}`}
              className="text-xs font-semibold uppercase tracking-widest text-[#415a77] mb-3"
            >
              {cat.name}
            </h2>

            <div className="space-y-3">
              {cat.items
                .filter((i) => i.isAvailable)
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    flyingItem={flyingItem}
                    getItemQty={getItemQty}
                    onAdd={addToCart}
                    onUpdateQty={updateQty}
                    disabled={orderStatus !== "idle" || isViewOnly}
                    viewOnly={isViewOnly}
                    primaryColor={restaurant.theme.primaryColor}
                  />
                ))}
            </div>
          </section>
        ))}
      </main>

      {/* ── Sticky cart bar (hidden in view-only mode) ── */}
      <AnimatePresence>
        {!isViewOnly && cartCount > 0 && orderStatus === "idle" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto px-4 pb-safe-bottom pb-4"
          >
            <button
              ref={cartBtnRef}
              onClick={() => setCartOpen(true)}
              className="w-full h-14 rounded-2xl flex items-center px-5 gap-3 shadow-xl"
              style={{ backgroundColor: restaurant.theme.primaryColor }}
              aria-label={`View cart — ${cartCount} items, ₹${total}`}
            >
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {cartCount}
              </span>
              <span className="flex-1 text-left text-white font-semibold text-sm">
                View Cart
              </span>
              <span className="text-white font-semibold text-sm">₹{total}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cart sheet ── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setCartOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl max-h-[85dvh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Your cart"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#e2e8f0]" />
              </div>

              {/* Cart header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#f1f3ff]">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#0d1b2a]" weight="fill" />
                  <h2 className="font-semibold text-[#0d1b2a] text-base">
                    Your Order
                  </h2>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f3ff] text-[#44474c]"
                  aria-label="Close cart"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {cart.map((cartItem) => (
                  <motion.div
                    key={cartItem.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-3"
                  >
                    {/* Veg dot */}
                    <div
                      className={cn(
                        "w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0",
                        cartItem.isVeg ? "border-green-600" : "border-red-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          cartItem.isVeg ? "bg-green-600" : "bg-red-600"
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0d1b2a] truncate">
                        {cartItem.name}
                        {cartItem.variantName && (
                          <span className="text-[#74777d] font-normal">
                            {" "}· {cartItem.variantName}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#74777d]">₹{cartItem.price}</p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(cartItem.id, -1)}
                        className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#44474c] hover:bg-[#f1f3ff] active:scale-90 transition"
                        aria-label={`Decrease ${cartItem.name}`}
                      >
                        <Minus size={12} weight="bold" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-[#0d1b2a]">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(cartItem.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-90 transition"
                        style={{ backgroundColor: restaurant.theme.primaryColor }}
                        aria-label={`Increase ${cartItem.name}`}
                      >
                        <Plus size={12} weight="bold" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-[#0d1b2a] w-14 text-right shrink-0">
                      ₹{cartItem.price * cartItem.quantity}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Customer Name Input */}
              <div className="px-5 py-2">
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#0d1b2a] transition-colors"
                />
              </div>

              {/* Bill summary */}
              <div className="border-t border-[#f1f3ff] px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-[#44474c]">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-[#44474c]">
                  <span>GST (5%)</span>
                  <span>₹{taxTotal}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#0d1b2a] pt-1 border-t border-[#f1f3ff]">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                {/* Payment mode buttons */}
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    onClick={() => placeOrder("online")}
                    className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
                    style={{ backgroundColor: restaurant.theme.accentColor ?? "#10b981" }}
                    aria-label={`Pay online — ₹${total}`}
                  >
                    Pay Online · ₹{total}
                  </button>
                  <button
                    onClick={() => placeOrder("pay-at-table")}
                    className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition border-2 border-[#e2e8f0] text-[#0d1b2a] hover:border-[#c4c6cc]"
                    aria-label={`Pay at table — ₹${total}`}
                  >
                    Pay at Table · ₹{total}
                  </button>
                </div>
                <p className="text-[10px] text-center text-[#74777d] mt-1">
                  Online payments go directly to the restaurant. Pay at Table lets staff collect payment.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Menu Item Card ──────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  flyingItem,
  getItemQty,
  onAdd,
  onUpdateQty,
  disabled,
  viewOnly,
  primaryColor,
}: {
  item: MenuItem;
  flyingItem: string | null;
  getItemQty: (id: string, variant?: string) => number;
  onAdd: (item: MenuItem, variantName?: string, variantPrice?: number) => void;
  onUpdateQty: (cartId: string, delta: number) => void;
  disabled: boolean;
  viewOnly: boolean;
  primaryColor: string;
}) {
  const hasVariants = item.variants.length > 0;

  // For items without variants, show inline +/- controls
  const baseCartId = `${item.id}-base`;
  const baseQty = hasVariants ? 0 : getItemQty(item.id);
  const isFlying = flyingItem === baseCartId;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(13,27,42,0.06)]">
      {/* Food Image */}
      {item.imageUrl && (
        <div className="relative w-full h-36 bg-[#f1f3ff]">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 flex gap-3">
        {/* Veg/non-veg dot */}
        <div className="pt-0.5 shrink-0">
          <div
            className={cn(
              "w-4 h-4 rounded-sm border-2 flex items-center justify-center",
              item.isVeg ? "border-green-600" : "border-red-600"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                item.isVeg ? "bg-green-600" : "bg-red-600"
              )}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#0d1b2a] leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-[#74777d] mt-0.5 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-sm font-semibold text-[#0d1b2a] mt-2">
            ₹{hasVariants ? Math.min(item.price, ...item.variants.map((v) => v.price)) : item.price}
            {hasVariants && (
              <span className="text-xs font-normal text-[#74777d]"> onwards</span>
            )}
          </p>

          {/* Variant chips — hidden in view-only mode */}
          {!viewOnly && hasVariants && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.variants.map((v) => {
                const vCartId = `${item.id}-${v.name}`;
                const vQty = getItemQty(item.id, v.name);
                return (
                  <div key={v.id} className="flex items-center gap-1">
                    {vQty > 0 ? (
                      <div className="flex items-center gap-1 bg-[#f1f3ff] rounded-full px-2 py-1">
                        <button
                          onClick={() => onUpdateQty(vCartId, -1)}
                          disabled={disabled}
                          className="w-5 h-5 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#44474c] active:scale-90"
                          aria-label={`Remove ${v.name}`}
                        >
                          <Minus size={9} weight="bold" />
                        </button>
                        <span className="text-xs font-semibold text-[#0d1b2a] w-4 text-center">
                          {vQty}
                        </span>
                        <button
                          onClick={() => onAdd(item, v.name, v.price)}
                          disabled={disabled}
                          className="w-5 h-5 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white active:scale-90"
                          aria-label={`Add more ${v.name}`}
                        >
                          <Plus size={9} weight="bold" />
                        </button>
                        <span className="text-xs text-[#74777d] ml-0.5">{v.name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAdd(item, v.name, v.price)}
                        disabled={disabled}
                        className="h-7 px-3 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#44474c] hover:border-[#0d1b2a] hover:text-[#0d1b2a] active:scale-95 transition"
                        aria-label={`Add ${v.name} — ₹${v.price}`}
                      >
                        {v.name} · ₹{v.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Variant display in view-only mode */}
          {viewOnly && hasVariants && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.variants.map((v) => (
                <span
                  key={v.id}
                  className="h-7 px-3 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#74777d] flex items-center"
                >
                  {v.name} · ₹{v.price}
                </span>
              ))}
            </div>
          )}

          {/* Add-on chips — hidden in view-only mode */}
          {!viewOnly && item.addOns && item.addOns.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-[#f1f3ff]">
              {item.addOns.map((a) => {
                const aCartId = `${item.id}-+ ${a.name}`;
                const aQty = getItemQty(item.id, `+ ${a.name}`);
                return (
                  <div key={a.id} className="flex items-center gap-1">
                    {aQty > 0 ? (
                      <div className="flex items-center gap-1 bg-[#f1f3ff] rounded-full px-2 py-1">
                        <button
                          onClick={() => onUpdateQty(aCartId, -1)}
                          disabled={disabled}
                          className="w-5 h-5 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#44474c] active:scale-90"
                          aria-label={`Remove ${a.name}`}
                        >
                          <Minus size={9} weight="bold" />
                        </button>
                        <span className="text-xs font-semibold text-[#0d1b2a] w-4 text-center">
                          {aQty}
                        </span>
                        <button
                          onClick={() => onAdd(item, `+ ${a.name}`, a.price)}
                          disabled={disabled}
                          className="w-5 h-5 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white active:scale-90"
                          aria-label={`Add more ${a.name}`}
                        >
                          <Plus size={9} weight="bold" />
                        </button>
                        <span className="text-xs text-[#74777d] ml-0.5">+{a.name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAdd(item, `+ ${a.name}`, a.price)}
                        disabled={disabled}
                        className="h-7 px-3 rounded-full border border-dashed border-[#c4c6cc] text-xs font-medium text-[#44474c] hover:border-[#10b981] hover:text-[#10b981] active:scale-95 transition"
                        aria-label={`Add ${a.name} — ₹${a.price}`}
                      >
                        + {a.name} · ₹{a.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add button — hidden in view-only mode */}
        {!viewOnly && !hasVariants && (
          <div className="shrink-0 self-center">
            <AnimatePresence mode="wait">
              {baseQty > 0 ? (
                <motion.div
                  key="controls"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => onUpdateQty(baseCartId, -1)}
                    disabled={disabled}
                    className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#44474c] active:scale-90 transition"
                    aria-label={`Remove one ${item.name}`}
                  >
                    <Minus size={12} weight="bold" />
                  </button>
                  <span className="text-sm font-semibold text-[#0d1b2a] w-5 text-center">
                    {baseQty}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => onAdd(item)}
                    disabled={disabled}
                    className="w-8 h-8 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white active:scale-90 transition"
                    aria-label={`Add one more ${item.name}`}
                  >
                    <Plus size={12} weight="bold" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onAdd(item)}
                  disabled={disabled}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white transition",
                    isFlying ? "scale-110" : "scale-100",
                    disabled ? "opacity-40" : ""
                  )}
                  style={{ backgroundColor: "#10b981" }}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus size={16} weight="bold" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
