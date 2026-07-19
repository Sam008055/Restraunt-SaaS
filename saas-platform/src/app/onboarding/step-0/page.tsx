"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { GoogleLogo, ArrowRight, Spinner, Warning } from "@phosphor-icons/react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase/client";

export default function OnboardingStep0() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Automatically proceed if already logged in
        router.push("/onboarding/step-1");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignUp = async () => {
    if (!isConfigured) {
      setError("Firebase is not configured. Please check your .env.local file.");
      return;
    }
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will trigger and redirect to step-1
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size={32} className="animate-spin text-[#0d1b2a]" />
        <p className="mt-4 text-[#74777d] text-sm">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-[32px] font-semibold text-[#0d1b2a] tracking-tight leading-tight mb-2">
        Create your account
      </h1>
      <p className="text-[#44474c] text-base leading-relaxed mb-10">
        Before we set up your restaurant, let's create your owner account.
      </p>

      {!isConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex gap-3 items-start">
          <Warning size={20} weight="fill" className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Firebase API Key Missing</p>
            <p className="mt-1">
              Authentication is disabled because Firebase is not configured in <code>.env.local</code>. Please add your credentials and restart the server.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center max-w-sm mx-auto shadow-[0_1px_4px_rgba(13,27,42,0.06)]">
        <div className="w-16 h-16 bg-[#f1f3ff] rounded-full flex items-center justify-center mx-auto mb-6">
          <GoogleLogo size={32} weight="bold" className="text-[#0d1b2a]" />
        </div>
        
        <h2 className="text-lg font-semibold text-[#0d1b2a] mb-2">Continue with Google</h2>
        <p className="text-sm text-[#74777d] mb-8">
          Use your Google account to sign up quickly and securely.
        </p>

        <motion.button
          onClick={handleGoogleSignUp}
          whileTap={{ scale: 0.98 }}
          disabled={googleLoading}
          className="w-full h-12 bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          aria-label="Sign up with Google"
        >
          {googleLoading ? (
            <Spinner size={20} className="animate-spin" />
          ) : (
            <>
              Sign Up with Google
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </motion.button>
        
        <p className="text-[11px] text-[#74777d] mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
