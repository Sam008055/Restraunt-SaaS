"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  UploadSimple,
  X,
  ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";


const CUISINE_TYPES = [
  "Indian",
  "North Indian",
  "South Indian",
  "Chinese",
  "Continental",
  "Italian",
  "Mexican",
  "Japanese",
  "Thai",
  "Fast Food",
  "Cafe / Bakery",
  "Seafood",
  "Multi-Cuisine",
  "Other",
];

interface FormData {
  restaurantName: string;
  address: string;
  cuisineType: string;
  gstNumber: string;
  logo: File | null;
  logoPreview: string | null;
}

interface FormErrors {
  restaurantName?: string;
  address?: string;
  cuisineType?: string;
  gstNumber?: string;
}

export default function OnboardingStep1() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    restaurantName: "",
    address: "",
    cuisineType: "",
    gstNumber: "",
    logo: null,
    logoPreview: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoPreview: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoSelect(file);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.restaurantName.trim()) newErrors.restaurantName = "Restaurant name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.cuisineType) newErrors.cuisineType = "Please select a cuisine type";
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(formData.gstNumber)) {
      newErrors.gstNumber = "Invalid GST number format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to create a restaurant.");
      }

      // Check if user already has a restaurant to prevent duplicates
      const { getDocs, query, where, limit } = await import("firebase/firestore");
      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", auth.currentUser.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Already has one, redirect instead of creating
        router.push(`/onboarding/step-2?id=${snap.docs[0].id}`);
        return;
      }

      // Generate a simple slug
      const slug = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const docRef = await addDoc(collection(db, "restaurants"), {
        name: formData.restaurantName,
        slug,
        address: formData.address,
        cuisineType: formData.cuisineType,
        gstNumber: formData.gstNumber,
        ownerId: auth.currentUser.uid,
        status: "onboarding_step_2",
        createdAt: serverTimestamp(),
      });

      router.push(`/onboarding/step-2?id=${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save restaurant details.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl md:text-[32px] font-semibold text-[#0d1b2a] tracking-tight leading-tight mb-2">
        Tell us about your restaurant
      </h1>
      <p className="text-[#44474c] text-base leading-relaxed mb-10">
        This info will appear on your digital menu and customer receipts.
      </p>

      <div className="space-y-6">
        {/* Restaurant Name */}
        <div>
          <label
            htmlFor="restaurantName"
            className="block text-sm font-semibold text-[#0d1b2a] mb-1.5"
          >
            Restaurant Name <span className="text-red-500">*</span>
          </label>
          <input
            id="restaurantName"
            type="text"
            autoComplete="organization"
            placeholder="e.g. The Spice Garden"
            value={formData.restaurantName}
            onChange={(e) =>
              setFormData((p) => ({ ...p, restaurantName: e.target.value }))
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg border-[1.5px] bg-white text-[#0d1b2a] placeholder-[#74777d]",
              "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 transition",
              errors.restaurantName
                ? "border-red-500 focus:border-red-500"
                : "border-[#c4c6cc] focus:border-[#0d1b2a]"
            )}
          />
          {errors.restaurantName && (
            <p className="mt-1.5 text-sm text-red-500">{errors.restaurantName}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-[#0d1b2a] mb-1.5"
          >
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            rows={3}
            autoComplete="street-address"
            placeholder="Full address including city and pincode"
            value={formData.address}
            onChange={(e) =>
              setFormData((p) => ({ ...p, address: e.target.value }))
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg border-[1.5px] bg-white text-[#0d1b2a] placeholder-[#74777d] resize-none",
              "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 transition",
              errors.address
                ? "border-red-500 focus:border-red-500"
                : "border-[#c4c6cc] focus:border-[#0d1b2a]"
            )}
          />
          {errors.address && (
            <p className="mt-1.5 text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* Cuisine Type */}
        <div>
          <label
            htmlFor="cuisineType"
            className="block text-sm font-semibold text-[#0d1b2a] mb-1.5"
          >
            Cuisine Type <span className="text-red-500">*</span>
          </label>
          <select
            id="cuisineType"
            value={formData.cuisineType}
            onChange={(e) =>
              setFormData((p) => ({ ...p, cuisineType: e.target.value }))
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg border-[1.5px] bg-white text-[#0d1b2a] appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 transition",
              errors.cuisineType
                ? "border-red-500 focus:border-red-500"
                : "border-[#c4c6cc] focus:border-[#0d1b2a]",
              !formData.cuisineType && "text-[#74777d]"
            )}
          >
            <option value="" disabled>Select cuisine type</option>
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.cuisineType && (
            <p className="mt-1.5 text-sm text-red-500">{errors.cuisineType}</p>
          )}
        </div>

        {/* GST Info */}
        <div>
          <label
            htmlFor="gstNumber"
            className="block text-sm font-semibold text-[#0d1b2a] mb-1.5"
          >
            GST Number{" "}
            <span className="text-[#74777d] font-normal">(optional)</span>
          </label>
          <input
            id="gstNumber"
            type="text"
            maxLength={15}
            placeholder="e.g. 22ABCDE1234F1Z5"
            value={formData.gstNumber}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                gstNumber: e.target.value.toUpperCase(),
              }))
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg border-[1.5px] bg-white text-[#0d1b2a] placeholder-[#74777d] font-mono tracking-widest",
              "focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 transition",
              errors.gstNumber
                ? "border-red-500 focus:border-red-500"
                : "border-[#c4c6cc] focus:border-[#0d1b2a]"
            )}
          />
          {errors.gstNumber ? (
            <p className="mt-1.5 text-sm text-red-500">{errors.gstNumber}</p>
          ) : (
            <p className="mt-1.5 text-xs text-[#74777d]">
              Required for GST-compliant tax invoices
            </p>
          )}
        </div>

        {/* Logo Upload */}
        <div>
          <p className="block text-sm font-semibold text-[#0d1b2a] mb-1.5">
            Restaurant Logo{" "}
            <span className="text-[#74777d] font-normal">(optional)</span>
          </p>

          {formData.logoPreview ? (
            <div className="relative w-28 h-28 rounded-xl border-2 border-[#e2e8f0] overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.logoPreview}
                alt="Logo preview"
                className="w-full h-full object-contain p-2"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    logo: null,
                    logoPreview: null,
                  }))
                }
                aria-label="Remove logo"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#0d1b2a]/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          ) : (
            <motion.div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              animate={{
                borderColor: isDragging ? "#0d1b2a" : "#c4c6cc",
                backgroundColor: isDragging ? "#e8edff" : "#ffffff",
              }}
              transition={{ duration: 0.15 }}
              className="w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center justify-center cursor-pointer gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-[#e8edff] flex items-center justify-center">
                <UploadSimple size={22} className="text-[#415a77]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0d1b2a]">
                  Drop your logo here
                </p>
                <p className="text-xs text-[#74777d] mt-0.5">
                  or click to browse — PNG, SVG, JPG up to 2 MB
                </p>
              </div>
            </motion.div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload logo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoSelect(file);
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          aria-label="Continue to theme selection"
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : (
            <>
              Continue to Theme Selection
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </motion.button>
        <p className="text-xs text-center text-[#74777d] mt-4">
          You can update these details any time from your dashboard.
        </p>
      </div>
    </form>
  );
}
