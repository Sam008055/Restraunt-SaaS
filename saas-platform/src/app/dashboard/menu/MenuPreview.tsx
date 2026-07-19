"use client";

import { MenuCategory } from "@/lib/types/menu";
import { cn } from "@/lib/utils";

export default function MenuPreview({ 
  categories, 
  restaurantName 
}: { 
  categories: MenuCategory[];
  restaurantName?: string;
}) {
  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <div className="mx-auto max-w-[280px]">
      {/* Phone frame */}
      <div className="relative bg-white rounded-[28px] border-[3px] border-[#0d1b2a] shadow-xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-[#0d1b2a] px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] text-white/70 font-medium">9:41</div>
            <div className="flex gap-1 items-center">
              <div className="w-3 h-1.5 bg-white/70 rounded-[1px]" />
            </div>
          </div>
          {/* Restaurant header */}
          <div className="pb-3">
            <p className="text-white text-[11px] font-semibold">{restaurantName || "Menu Preview"}</p>
            <p className="text-white/60 text-[9px]">Table 4 · Scan to order</p>
          </div>
        </div>

        {/* Menu content */}
        <div className="max-h-[480px] overflow-y-auto">
          {/* Category tabs */}
          {activeCategories.length > 0 && (
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-[#f1f3ff]">
              {activeCategories.map((cat, i) => (
                <span
                  key={cat.id}
                  className={cn(
                    "shrink-0 text-[9px] font-semibold px-2.5 py-1 rounded-full",
                    i === 0
                      ? "bg-[#0d1b2a] text-white"
                      : "bg-[#f1f3ff] text-[#44474c]"
                  )}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="px-3 pb-4">
            {activeCategories.map((cat) => (
              <div key={cat.id} className="mt-4">
                <p className="text-[10px] font-semibold text-[#0d1b2a] mb-2 uppercase tracking-widest">
                  {cat.name}
                </p>
                <div className="space-y-2">
                  {cat.items
                    .filter((i) => i.isAvailable)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 py-2 border-b border-[#f9f9ff] last:border-0"
                      >
                        {/* Veg indicator */}
                        <div
                          className={cn(
                            "w-3 h-3 rounded-[2px] border flex items-center justify-center shrink-0 mt-0.5",
                            item.isVeg ? "border-green-600" : "border-red-600"
                          )}
                        >
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.isVeg ? "bg-green-600" : "bg-red-600"
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-[#0d1b2a] truncate">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-[8px] text-[#74777d] mt-0.5 leading-tight line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-[10px] font-semibold text-[#0d1b2a] mt-1">
                            ₹{item.price}
                          </p>
                        </div>

                        {/* Add button */}
                        <button className="w-6 h-6 rounded-lg bg-[#10b981] flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                          +
                        </button>
                      </div>
                    ))}

                  {cat.items.filter((i) => i.isAvailable).length === 0 && (
                    <p className="text-[9px] text-[#74777d] italic py-2">
                      No available items
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activeCategories.length === 0 && (
              <p className="text-[10px] text-[#74777d] text-center py-8">
                Add categories to see your menu preview
              </p>
            )}
          </div>
        </div>

        {/* Cart bar */}
        <div className="bg-[#0d1b2a] px-3 py-2.5 flex items-center justify-between">
          <p className="text-white text-[9px] font-semibold">0 items · ₹0</p>
          <button className="bg-[#10b981] text-white text-[9px] font-semibold px-3 py-1.5 rounded-full">
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}
