"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MenuItem, MenuVariant, MenuAddOn } from "@/lib/types/menu";

interface ItemModalProps {
  mode: "add" | "edit";
  categoryId: string;
  item?: MenuItem;
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}

const TAX_OPTIONS = [0, 5, 12, 18, 28];

export default function ItemModal({
  mode,
  categoryId,
  item,
  onSave,
  onClose,
}: ItemModalProps) {
  const blank: MenuItem = {
    id: `item-${Date.now()}`,
    categoryId,
    name: "",
    description: "",
    price: 0,
    isVeg: true,
    isAvailable: true,
    taxPercentage: 5,
    order: 0,
    variants: [],
    addOns: [],
  };

  const [form, setForm] = useState<MenuItem>(item ?? blank);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [activeTab, setActiveTab] = useState<"basic" | "variants" | "addons">("basic");

  // Keep id stable on edit
  useEffect(() => {
    if (item) setForm(item);
  }, [item]);

  const validate = () => {
    const e: { name?: string; price?: string } = {};
    if (!form.name.trim()) e.name = "Item name is required";
    if (form.price <= 0) e.price = "Price must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const addVariant = () => {
    const v: MenuVariant = { id: `v-${Date.now()}`, name: "", price: form.price };
    setForm((p) => ({ ...p, variants: [...p.variants, v] }));
  };

  const updateVariant = (id: string, key: keyof MenuVariant, value: string | number) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.id === id ? { ...v, [key]: value } : v)),
    }));
  };

  const removeVariant = (id: string) => {
    setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.id !== id) }));
  };

  const addAddon = () => {
    const a: MenuAddOn = { id: `a-${Date.now()}`, name: "", price: 0 };
    setForm((p) => ({ ...p, addOns: [...p.addOns, a] }));
  };

  const updateAddon = (id: string, key: keyof MenuAddOn, value: string | number) => {
    setForm((p) => ({
      ...p,
      addOns: p.addOns.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    }));
  };

  const removeAddon = (id: string) => {
    setForm((p) => ({ ...p, addOns: p.addOns.filter((a) => a.id !== id) }));
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "add" ? "Add menu item" : "Edit menu item"}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-base font-semibold text-[#0d1b2a]">
            {mode === "add" ? "Add Menu Item" : "Edit Menu Item"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#74777d] hover:bg-[#f1f3ff] hover:text-[#0d1b2a] transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] px-6">
          {(["basic", "variants", "addons"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize",
                activeTab === tab
                  ? "border-[#0d1b2a] text-[#0d1b2a]"
                  : "border-transparent text-[#74777d] hover:text-[#44474c]"
              )}
            >
              {tab === "addons" ? "Add-ons" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "variants" && form.variants.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#e8edff] text-[#415a77] rounded-full px-1.5 py-0.5 font-medium">
                  {form.variants.length}
                </span>
              )}
              {tab === "addons" && form.addOns.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#e8edff] text-[#415a77] rounded-full px-1.5 py-0.5 font-medium">
                  {form.addOns.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {activeTab === "basic" && (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Paneer Tikka"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border-[1.5px] bg-white text-sm text-[#0d1b2a] placeholder-[#74777d]",
                    "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/10 transition",
                    errors.name ? "border-red-500" : "border-[#c4c6cc] focus:border-[#0d1b2a]"
                  )}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                  Description <span className="text-[#74777d] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description shown to customers"
                  className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] placeholder-[#74777d] focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/10 transition resize-none"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border-[1.5px] bg-white text-sm text-[#0d1b2a]",
                      "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/10 transition",
                      errors.price ? "border-red-500" : "border-[#c4c6cc] focus:border-[#0d1b2a]"
                    )}
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
                    Tax %
                  </label>
                  <select
                    value={form.taxPercentage}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, taxPercentage: Number(e.target.value) }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] focus:outline-none transition"
                  >
                    {TAX_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t === 0 ? "No tax" : `${t}% GST`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Veg / Non-veg + Availability */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0d1b2a] mb-2">Type</p>
                  <div className="flex rounded-lg border border-[#e2e8f0] overflow-hidden">
                    {[
                      { label: "Veg", value: true },
                      { label: "Non-veg", value: false },
                    ].map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, isVeg: value }))}
                        className={cn(
                          "flex-1 py-2 text-xs font-semibold transition-colors",
                          form.isVeg === value
                            ? value
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                            : "text-[#74777d] hover:bg-[#f1f3ff]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#0d1b2a] mb-2">Availability</p>
                  <div className="flex rounded-lg border border-[#e2e8f0] overflow-hidden">
                    {[
                      { label: "Available", value: true },
                      { label: "Off", value: false },
                    ].map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, isAvailable: value }))}
                        className={cn(
                          "flex-1 py-2 text-xs font-semibold transition-colors",
                          form.isAvailable === value
                            ? value
                              ? "bg-[#0d1b2a] text-white"
                              : "bg-amber-500 text-white"
                            : "text-[#74777d] hover:bg-[#f1f3ff]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "variants" && (
            <div className="space-y-3">
              <p className="text-xs text-[#74777d]">
                e.g. Small / Large, Half / Full — each with its own price.
              </p>
              {form.variants.map((v) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                    placeholder="Variant name"
                    className="flex-1 px-3 py-2 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] placeholder-[#74777d] focus:outline-none transition"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#74777d]">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={v.price || ""}
                      onChange={(e) => updateVariant(v.id, "price", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] focus:outline-none transition"
                    />
                  </div>
                  <button
                    onClick={() => removeVariant(v.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#74777d] hover:bg-red-50 hover:text-red-500 transition"
                    aria-label="Remove variant"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addVariant}
                className="flex items-center gap-2 text-sm font-semibold text-[#10b981] hover:text-[#059669] transition"
              >
                <Plus size={14} weight="bold" />
                Add variant
              </button>
            </div>
          )}

          {activeTab === "addons" && (
            <div className="space-y-3">
              <p className="text-xs text-[#74777d]">
                Optional extras customers can add to the item.
              </p>
              {form.addOns.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => updateAddon(a.id, "name", e.target.value)}
                    placeholder="Add-on name"
                    className="flex-1 px-3 py-2 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] placeholder-[#74777d] focus:outline-none transition"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#74777d]">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={a.price || ""}
                      onChange={(e) => updateAddon(a.id, "price", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border-[1.5px] border-[#c4c6cc] focus:border-[#0d1b2a] bg-white text-sm text-[#0d1b2a] focus:outline-none transition"
                    />
                  </div>
                  <button
                    onClick={() => removeAddon(a.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#74777d] hover:bg-red-50 hover:text-red-500 transition"
                    aria-label="Remove add-on"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addAddon}
                className="flex items-center gap-2 text-sm font-semibold text-[#10b981] hover:text-[#059669] transition"
              >
                <Plus size={14} weight="bold" />
                Add add-on
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#44474c] hover:bg-[#f1f3ff] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-10 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            {mode === "add" ? "Add Item" : "Save Changes"}
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
