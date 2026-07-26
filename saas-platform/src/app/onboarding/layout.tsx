"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const STEPS = [
  { label: "Business Info", href: "/onboarding/step-1" },
  { label: "Theme & Plan", href: "/onboarding/step-2" },
  { label: "Payment", href: "/onboarding/step-3" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentStep = STEPS.findIndex((s) => pathname.startsWith(s.href)) + 1;

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (authChecking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f9f9ff]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0d1b2a] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9f9ff]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#e2e8f0]">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d1b2a] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-[#0d1b2a] text-sm tracking-tight">Nosh</span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div key={step.href} className="flex items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isDone
                        ? "#10b981"
                        : isCurrent
                        ? "#0d1b2a"
                        : "#e2e8f0",
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    transition={{ duration: 0.2 }}
                  >
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className={`text-[10px] font-semibold ${isCurrent ? "text-white" : "text-[#74777d]"}`}>
                        {stepNum}
                      </span>
                    )}
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="hidden sm:block w-8 h-px"
                      style={{ background: isDone ? "#10b981" : "#e2e8f0" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Log in link */}
          <Link href="/login" className="text-sm text-[#44474c] hover:text-[#0d1b2a] transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Step label */}
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8">
        {currentStep > 1 && (
          <Link
            href={STEPS[currentStep - 2].href}
            className="inline-flex items-center gap-1.5 text-sm text-[#44474c] hover:text-[#0d1b2a] transition-colors mb-6"
          >
            <ArrowLeft size={14} weight="bold" />
            Back
          </Link>
        )}
        <p className="text-xs font-semibold tracking-widest text-[#10b981] uppercase mb-1">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-8 pb-16">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
