"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  DotsSixVertical,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  CaretDown,
  CaretRight,
  X,
  Check,
  Warning,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { MenuCategory, MenuItem } from "@/lib/types/menu";
import { useRestaurantMenu, useCurrentRestaurant } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/client";
import { collection, doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import MenuPreview from "./MenuPreview";
import ItemModal from "./ItemModal";

export default function MenuBuilder() {
  const { restaurantId, restaurant, loading: authLoading } = useCurrentRestaurant();
  const { categories, loading: menuLoading } = useRestaurantMenu(restaurantId);
  const loading = authLoading || menuLoading;
  
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [itemModal, setItemModal] = useState<{
    mode: "add" | "edit";
    categoryId: string;
    item?: MenuItem;
  } | null>(null);
  const [dragItem, setDragItem] = useState<{
    catId: string;
    itemId: string;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    catId: string;
    itemId: string;
  } | null>(null);
  const newCatRef = useRef<HTMLInputElement>(null);

  // ── Category helpers ──────────────────────────────────
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const catRef = doc(collection(db, "categories"));
    const newCat = {
      restaurantId: restaurantId!,
      ownerId: restaurant?.ownerId || "",
      name: newCatName.trim(),
      order: categories.length,
      isActive: true,
    };
    await setDoc(catRef, newCat);
    setNewCatName("");
    setAddingCat(false);
  };

  const updateCategoryName = async (catId: string, name: string) => {
    await updateDoc(doc(db, "categories", catId), { name });
    setEditingCatId(null);
  };

  const toggleCategoryActive = async (catId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "categories", catId), { isActive: !currentStatus });
  };

  const deleteCategory = async (catId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "categories", catId));
    // Delete all items in category
    const cat = categories.find((c) => c.id === catId);
    cat?.items.forEach((item) => {
      batch.delete(doc(db, "menuItems", item.id));
    });
    await batch.commit();
  };

  // ── Item helpers ──────────────────────────────────────
  const toggleItemAvailability = async (itemId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "menuItems", itemId), { isAvailable: !currentStatus });
  };

  const deleteItem = async (itemId: string) => {
    await deleteDoc(doc(db, "menuItems", itemId));
  };

  const saveItem = async (item: MenuItem) => {
    // If it's a new item, it won't have a proper Firestore ID yet (handled by ItemModal)
    // The ItemModal should return the item. If it's new, we create a new doc.
    const itemRef = item.id.startsWith("new-") ? doc(collection(db, "menuItems")) : doc(db, "menuItems", item.id);
    
    // For new items, set order to end of list
    let order = item.order;
    if (item.id.startsWith("new-")) {
      const cat = categories.find((c) => c.id === item.categoryId);
      order = cat ? cat.items.length : 0;
    }

    const { id, ...itemWithoutId } = item;

    const itemData = {
      ...itemWithoutId,
      restaurantId: restaurantId!,
      ownerId: restaurant?.ownerId || "",
      order,
    };

    await setDoc(itemRef, itemData, { merge: true });
    setItemModal(null);
  };

  // ── Drag & drop (item reorder within category) ────────
  const handleDragStart = (catId: string, itemId: string) => {
    setDragItem({ catId, itemId });
  };

  const handleDragOver = (e: React.DragEvent, catId: string, itemId: string) => {
    e.preventDefault();
    setDragOverItem({ catId, itemId });
  };

  const handleDrop = async (targetCatId: string, targetItemId: string) => {
    if (!dragItem || dragItem.catId !== targetCatId) return;
    const c = categories.find(cat => cat.id === targetCatId);
    if (!c) return;
    
    const items = [...c.items];
    const fromIdx = items.findIndex((i) => i.id === dragItem.itemId);
    const toIdx = items.findIndex((i) => i.id === targetItemId);
    
    if (fromIdx === -1 || toIdx === -1) return;
    
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    
    // Update order in Firestore using a batch
    const batch = writeBatch(db);
    items.forEach((item, idx) => {
      batch.update(doc(db, "menuItems", item.id), { order: idx });
    });
    await batch.commit();

    setDragItem(null);
    setDragOverItem(null);
  };


  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left column: Menu Builder */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-[#e2e8f0]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h1 className="text-xl font-semibold text-[#0d1b2a] tracking-tight">Menu Builder</h1>
              <p className="text-sm text-[#74777d] mt-0.5">
                {categories.length} categories, {totalItems} items
              </p>
            </div>
            <div className="flex items-center gap-2">

              <button
                onClick={() => {
                  setAddingCat(true);
                  setTimeout(() => newCatRef.current?.focus(), 50);
                }}
                className="flex items-center gap-2 h-9 px-4 bg-[#0d1b2a] hover:bg-[#1b263b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus size={16} weight="bold" />
                Add Category
              </button>
            </div>
          </div>

          {/* Builder area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-[#74777d]">Loading menu from Firebase...</div>
            ) : categories.map((cat) => {
              const isCollapsed = collapsed[cat.id];
              return (
                <div key={cat.id} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                  {/* Category Header */}
                  <div className="group flex items-center gap-3 bg-[#f9f9ff] p-3 border-b border-[#e2e8f0]">
                    <div className="text-[#c4c6cc] hover:text-[#0d1b2a] cursor-grab active:cursor-grabbing px-1">
                      <DotsSixVertical size={20} weight="bold" />
                    </div>
                    
                    <button
                      onClick={() => setCollapsed((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                      className="text-[#415a77] hover:text-[#0d1b2a] transition"
                    >
                      {isCollapsed ? <CaretRight size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                    </button>

                    <div className="flex-1">
                      {editingCatId === cat.id ? (
                        <input
                          autoFocus
                          defaultValue={cat.name}
                          onBlur={(e) => updateCategoryName(cat.id, e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && updateCategoryName(cat.id, e.currentTarget.value)}
                          className="bg-white px-2 py-1 border border-[#0d1b2a] rounded text-sm font-semibold outline-none w-48"
                        />
                      ) : (
                        <h2 className="text-sm font-semibold text-[#0d1b2a]">{cat.name}</h2>
                      )}
                    </div>

                    {/* Category Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => setEditingCatId(cat.id)}
                        className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-[#e2e8f0] rounded transition"
                        title="Edit name"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => toggleCategoryActive(cat.id, cat.isActive)}
                        className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-[#e2e8f0] rounded transition"
                        title={cat.isActive ? "Hide category" : "Show category"}
                      >
                        {cat.isActive ? <Eye size={16} /> : <EyeSlash size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}" and all its items?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete category"
                      >
                        <Trash size={16} />
                      </button>
                    </div>

                    <button
                      onClick={() => setItemModal({ mode: "add", categoryId: cat.id })}
                      className="ml-2 flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-[#0d1b2a] bg-white border border-[#e2e8f0] rounded-lg hover:border-[#c4c6cc] hover:bg-[#f9f9ff] transition"
                    >
                      <Plus size={12} weight="bold" />
                      Add Item
                    </button>
                  </div>

                  {/* Items list */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {cat.items.length === 0 ? (
                            <div className="py-8 text-center text-xs text-[#74777d] bg-[#f9f9ff] rounded border border-dashed border-[#e2e8f0] m-2">
                              No items yet. Click "Add Item" to start building this category.
                            </div>
                          ) : (
                            cat.items.map((item) => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(cat.id, item.id)}
                                onDragOver={(e) => handleDragOver(e, cat.id, item.id)}
                                onDrop={() => handleDrop(cat.id, item.id)}
                                className={cn(
                                  "group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
                                  dragOverItem?.itemId === item.id
                                    ? "border-[#0d1b2a] bg-[#f1f3ff] -translate-y-0.5 shadow-sm"
                                    : "border-transparent hover:border-[#e2e8f0] hover:bg-[#f9f9ff]"
                                )}
                              >
                                <div className="text-[#e2e8f0] group-hover:text-[#c4c6cc]">
                                  <DotsSixVertical size={16} weight="bold" />
                                </div>
                                
                                {/* Veg/Non-veg indicator */}
                                <div className={cn(
                                  "w-3.5 h-3.5 border flex items-center justify-center shrink-0",
                                  item.isVeg ? "border-green-600" : "border-red-600"
                                )}>
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    item.isVeg ? "bg-green-600" : "bg-red-600"
                                  )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn(
                                      "text-sm font-semibold truncate",
                                      item.isAvailable ? "text-[#0d1b2a]" : "text-[#74777d] line-through decoration-[#c4c6cc]"
                                    )}>
                                      {item.name}
                                    </p>
                                    {item.variants.length > 0 && (
                                      <span className="text-[10px] font-semibold text-[#415a77] bg-[#e8edff] px-1.5 py-0.5 rounded-full">
                                        {item.variants.length} vars
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#74777d] truncate">
                                    ₹{item.price} • {item.taxPercentage}% GST
                                  </p>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleItemAvailability(item.id, item.isAvailable); }}
                                    className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-white border border-transparent hover:border-[#e2e8f0] rounded transition shadow-sm"
                                    title={item.isAvailable ? "Mark out of stock" : "Mark in stock"}
                                  >
                                    {item.isAvailable ? <Check size={14} className="text-[#10b981]" weight="bold" /> : <Warning size={14} className="text-amber-500" weight="bold" />}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setItemModal({ mode: "edit", categoryId: cat.id, item }); }}
                                    className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-white border border-transparent hover:border-[#e2e8f0] rounded transition shadow-sm"
                                  >
                                    <PencilSimple size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete "${item.name}"?`)) deleteItem(item.id);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded transition shadow-sm"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Add Category inline form */}
            <AnimatePresence>
              {addingCat && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border-2 border-[#0d1b2a] p-4 flex gap-2 shadow-lg"
                >
                  <input
                    ref={newCatRef}
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCategory();
                      if (e.key === "Escape") setAddingCat(false);
                    }}
                    placeholder="e.g. Starters, Main Course, Desserts"
                    className="flex-1 text-sm font-semibold outline-none placeholder:text-[#c4c6cc]"
                  />
                  <button
                    onClick={addCategory}
                    className="h-8 px-4 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setAddingCat(false)}
                    className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-[#f1f3ff] rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: Mobile Preview */}
        <div className="w-[400px] shrink-0 bg-[#f9f9ff] p-6 hidden lg:flex flex-col items-center border-l border-[#e2e8f0]">
          <h2 className="text-xs font-semibold text-[#415a77] uppercase tracking-widest w-full text-center mb-6">
            Live Preview
          </h2>
          <div className="flex-1 w-full flex justify-center">
            <MenuPreview categories={categories} restaurantName={restaurant?.name} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {itemModal && (
          <ItemModal
            mode={itemModal.mode}
            item={itemModal.item}
            categoryId={itemModal.categoryId}
            onClose={() => setItemModal(null)}
            onSave={saveItem}
          />
        )}
      </AnimatePresence>
    </>
  );
}
