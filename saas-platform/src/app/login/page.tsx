"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Spinner, GoogleLogo, Warning } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError("Firebase is not configured. Please check your .env.local file.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard/orders");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError("Firebase is not configured. Please check your .env.local file.");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Wait for auth state to settle
      // Check if user has a restaurant setup (this would ideally be done via Claims or a Firestore check)
      // For now, redirect to dashboard.
      router.push("/dashboard/orders");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-[#fcf9f8]">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 max-w-2xl">
        <div className="mb-12">
          <Link href="/" className="font-playfair text-xl font-bold text-[#061b0e]">
            SavorSystem
          </Link>
        </div>

        <h1 className="font-playfair text-4xl text-[#061b0e] mb-3">Welcome back.</h1>
        <p className="text-[#434843] mb-8">
          Sign in to orchestrate your restaurant's digital presence.
        </p>

        {!isConfigured && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex gap-3 items-start">
            <Warning size={20} weight="fill" className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Firebase API Key Missing</p>
              <p className="mt-1">Authentication is disabled because Firebase is not configured in <code>.env.local</code>. Please add your credentials and restart the server.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#c3c8c1] text-[#061b0e] px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-70"
          >
            {googleLoading ? (
              <Spinner size={20} className="animate-spin" />
            ) : (
              <GoogleLogo size={20} weight="bold" />
            )}
            Continue with Google
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#e2e8f0]"></div>
            <span className="flex-shrink-0 mx-4 text-[#74777d] text-xs uppercase tracking-widest font-semibold">Or</span>
            <div className="flex-grow border-t border-[#e2e8f0]"></div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#061b0e] mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#c3c8c1] focus:border-[#061b0e] outline-none text-[#1c1b1b] bg-white transition-colors"
              placeholder="manager@restaurant.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#061b0e] mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#c3c8c1] focus:border-[#061b0e] outline-none text-[#1c1b1b] bg-white transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#061b0e] text-[#fcf9f8] px-8 py-4 rounded-lg text-sm font-semibold uppercase tracking-widest hover:bg-[#1b3022] transition-colors mt-2 disabled:opacity-70"
          >
            {loading ? <Spinner size={20} className="animate-spin" /> : "Sign In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-sm text-[#434843] mt-8 text-center">
          Don't have an account?{" "}
          <Link href="/onboarding/step-0" className="text-[#c5a059] font-semibold hover:underline">
            Start your legacy
          </Link>
        </p>
      </div>

      {/* Right side - Image/Graphic */}
      <div className="hidden lg:flex flex-1 bg-[#1b3022] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')" }} />
        <div className="relative z-10 text-center px-12">
          <span className="text-[#c5a059] text-6xl font-playfair leading-none block mb-4">"</span>
          <h2 className="font-playfair text-3xl leading-tight text-white font-light italic max-w-md mx-auto">
            Orchestrate your kitchen and dining room with effortless precision.
          </h2>
        </div>
      </div>
    </div>
  );
}

