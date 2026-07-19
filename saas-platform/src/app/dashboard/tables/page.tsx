"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  QrCode,
  Link as LinkIcon,
  ArrowClockwise,
  Trash,
  DownloadSimple,
  CheckCircle,
  Warning,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import QRCodeCanvas from "@/components/QRCodeCanvas";
import { useRestaurantTables, useCurrentRestaurant } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/client";
import { collection, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface Table {
  id: string;
  tableNumber: string;
  isActive: boolean;
  slug: string;
  qrToken: string;
}

export default function TablesPage() {
  const { restaurantId, restaurant, loading: authLoading } = useCurrentRestaurant();
  const { tables, loading: tablesLoading } = useRestaurantTables(restaurantId);
  const loading = authLoading || tablesLoading;
  const [addingTable, setAddingTable] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const addTable = async () => {
    const num = newTableNum.trim();
    if (!num) return;
    const exists = tables.find((t) => t.tableNumber === num);
    if (exists) return;
    
    const tableRef = doc(collection(db, "tables"));
    const newTable = {
      restaurantId: restaurantId!,
      ownerId: restaurant?.ownerId || "",
      tableNumber: num,
      isActive: true,
      slug: restaurant?.slug || "restaurant",
      qrToken: `hmac-${Math.random().toString(36).slice(2, 10)}`, // In production: call Cloud Function to securely generate
    };
    
    await setDoc(tableRef, newTable);
    setNewTableNum("");
    setAddingTable(false);
  };

  const regenerateQR = async (id: string) => {
    await updateDoc(doc(db, "tables", id), {
      qrToken: `hmac-${Math.random().toString(36).slice(2, 10)}`
    });
  };

  const deleteTable = async (id: string) => {
    await deleteDoc(doc(db, "tables", id));
    setDeleteConfirm(null);
  };

  const copyLink = (table: Table) => {
    const url = `${window.location.origin}/r/${table.slug}/t/${table.id}?token=${table.qrToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getQrUrl = (table: Table) =>
    `${typeof window !== "undefined" ? window.location.origin : "https://savorsystem.com"}/r/${table.slug}/t/${table.id}?token=${table.qrToken}`;

  const downloadSingleQR = async (table: Table) => {
    try {
      const url = getQrUrl(table);
      const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: "#0d1b2a", light: "#ffffff" } });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Table-${table.tableNumber}-QR.png`;
      a.click();
    } catch (e) {
      console.error("Failed to generate QR code PNG", e);
    }
  };

  const downloadAllPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      // Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const marginX = 20;
      const marginY = 20;
      const qrSize = 60; // 60x60mm QR codes
      const spacingX = (pageWidth - marginX * 2 - qrSize * 2) / 1; // 2 cols
      const spacingY = 25;
      
      let x = marginX;
      let y = marginY;
      
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(restaurant?.name || "Restaurant QR Codes", pageWidth / 2, 15, { align: "center" });

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        
        // Add new page if out of space
        if (y + qrSize + 10 > pageHeight - marginY) {
          pdf.addPage();
          x = marginX;
          y = marginY;
        }

        const url = getQrUrl(table);
        const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 1 });
        
        // Draw the QR
        pdf.addImage(dataUrl, "PNG", x, y, qrSize, qrSize);
        
        // Draw the text
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Table ${table.tableNumber}`, x + qrSize / 2, y + qrSize + 5, { align: "center" });
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text("Scan to order", x + qrSize / 2, y + qrSize + 9, { align: "center" });

        // Advance grid
        if (x === marginX) {
          x += qrSize + spacingX; // Move right
        } else {
          x = marginX; // Carriage return
          y += qrSize + spacingY; // Next row
        }
      }
      
      pdf.save(`${restaurant?.name || "Restaurant"}-QR-Codes.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
      alert("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0] sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-[#0d1b2a]">Tables & QR Codes</h1>
          <p className="text-xs text-[#74777d] mt-0.5">
            {tables.length} table{tables.length !== 1 ? "s" : ""} ·{" "}
            {tables.filter((t) => t.isActive).length} active
          </p>
        </div>
        <button
          onClick={() => setAddingTable(true)}
          className="flex items-center gap-2 h-9 px-4 bg-[#0d1b2a] hover:bg-[#1b263b] text-white text-sm font-semibold rounded-lg transition-colors"
          aria-label="Add a table"
        >
          <Plus size={14} weight="bold" />
          Add Table
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Add table inline form */}
        <AnimatePresence>
          {addingTable && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-white border-2 border-[#0d1b2a] rounded-xl p-4 flex items-center gap-3"
            >
              <QrCode size={20} className="text-[#415a77] shrink-0" />
              <input
                autoFocus
                type="text"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTable();
                  if (e.key === "Escape") setAddingTable(false);
                }}
                placeholder="Table number or name (e.g. 9 or Terrace-1)"
                className="flex-1 text-sm text-[#0d1b2a] bg-transparent focus:outline-none placeholder-[#c4c6cc]"
                aria-label="New table number"
              />
              <button
                onClick={addTable}
                className="h-8 px-3 bg-[#10b981] text-white text-xs font-semibold rounded-lg hover:bg-[#059669] transition"
              >
                Add
              </button>
              <button
                onClick={() => setAddingTable(false)}
                className="w-8 h-8 flex items-center justify-center text-[#74777d] hover:bg-[#f1f3ff] rounded-lg transition"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tables grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-[#74777d]">Loading tables...</div>
          ) : (
            <AnimatePresence initial={false}>
              {tables.map((table) => (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden flex flex-col"
              >
                {/* QR visual area */}
                <div className="bg-[#f9f9ff] p-5 flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-[#415a77] uppercase tracking-widest">
                    Table
                  </p>
                  <p className="text-4xl font-bold text-[#0d1b2a] tracking-tight">
                    {table.tableNumber}
                  </p>
                  {/* Real QR Code using the canvas component */}
                  <div className="w-24 h-24 bg-white border border-[#e2e8f0] rounded-lg flex items-center justify-center mt-1 overflow-hidden">
                    <QRCodeCanvas value={getQrUrl(table)} size={96} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1",
                      table.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[#f1f3ff] text-[#74777d]"
                    )}
                  >
                    {table.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Scan URL */}
                <div className="px-4 py-2 border-t border-[#f1f3ff]">
                  <p className="text-[10px] text-[#74777d] truncate font-mono">
                    /r/{table.slug}/t/{table.id}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => copyLink(table)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold border transition-colors col-span-2",
                      copiedId === table.id
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "border-[#e2e8f0] text-[#44474c] hover:bg-[#f1f3ff]"
                    )}
                    aria-label="Copy table link"
                  >
                    {copiedId === table.id ? (
                      <>
                        <CheckCircle size={12} weight="fill" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <LinkIcon size={12} />
                        Copy Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => downloadSingleQR(table)}
                    className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold border border-[#e2e8f0] text-[#44474c] hover:bg-[#f1f3ff] transition"
                    aria-label={`Download QR for Table ${table.tableNumber}`}
                  >
                    <DownloadSimple size={12} />
                    Download
                  </button>

                  <button
                    onClick={() => regenerateQR(table.id)}
                    className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold border border-[#e2e8f0] text-[#44474c] hover:bg-[#f1f3ff] transition"
                    aria-label={`Regenerate QR for Table ${table.tableNumber}`}
                  >
                    <ArrowClockwise size={12} />
                    Regen QR
                  </button>

                  {deleteConfirm === table.id ? (
                    <div className="col-span-2 flex gap-1.5">
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="flex-1 h-8 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold border border-[#e2e8f0] text-[#74777d] hover:bg-[#f1f3ff] transition flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(table.id)}
                      className="col-span-2 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold text-[#74777d] hover:bg-red-50 hover:text-red-500 transition"
                      aria-label={`Delete Table ${table.tableNumber}`}
                    >
                      <Trash size={12} />
                      Delete table
                    </button>
                  )}
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Download all */}
        {tables.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 h-11 px-6 bg-[#0d1b2a] hover:bg-[#1b263b] disabled:bg-[#415a77] text-white text-sm font-semibold rounded-xl transition-colors"
              onClick={downloadAllPDF}
              aria-label="Download all QR codes as PDF"
            >
              <DownloadSimple size={16} className={isGeneratingPdf ? "animate-pulse" : ""} />
              {isGeneratingPdf ? "Generating PDF..." : "Download All QR Codes (PDF)"}
            </button>
            <p className="text-xs text-[#74777d]">
              Prints a labeled sheet — one QR per table, ready to cut and place
            </p>
          </div>
        )}

        {tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#e8edff] flex items-center justify-center mb-4">
              <Warning size={24} className="text-[#415a77]" />
            </div>
            <p className="text-sm font-semibold text-[#0d1b2a] mb-1">No tables yet</p>
            <p className="text-xs text-[#74777d]">Add your first table to generate a QR code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
