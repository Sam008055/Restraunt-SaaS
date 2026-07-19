"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, QrCode, CreditCard, Desktop } from "@phosphor-icons/react";
import { useRef } from "react";

const STAGGER = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1], // Custom sophisticated easing
      staggerChildren: 0.15,
    },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-[#fcf9f8] text-[#1c1b1b] overflow-x-hidden selection:bg-[#c5a059] selection:text-white"
    >
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-5 md:px-16 flex items-center justify-between backdrop-blur-md bg-[#fcf9f8]/80 border-b border-[#c5a059]/10"
      >
        <div className="font-playfair text-xl font-bold tracking-tight text-[#061b0e]">
          SavorSystem
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-semibold uppercase tracking-widest text-[#434843] hover:text-[#c5a059] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/onboarding/step-1"
            className="text-sm font-semibold uppercase tracking-widest bg-[#061b0e] text-[#fcf9f8] px-5 py-2.5 hover:bg-[#1b3022] transition-colors"
          >
            Start Legacy
          </Link>
        </div>
      </motion.nav>

      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-48 pb-32 px-6 md:px-16 flex flex-col items-center justify-center text-center min-h-[90dvh]">
        {/* Decorative background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1b3022]/[0.02] blur-3xl -z-10" />

        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-4xl"
        >
          <motion.p
            variants={ITEM}
            className="text-[#c5a059] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-6"
          >
            The Standard of Excellence
          </motion.p>
          <motion.h1
            variants={ITEM}
            className="font-playfair text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] font-bold text-[#061b0e] tracking-tight mb-8"
          >
            Elevate Your <br />
            <span className="italic text-[#1b3022]">Dining Experience.</span>
          </motion.h1>
          <motion.p
            variants={ITEM}
            className="text-lg md:text-xl text-[#434843] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Bespoke digital menus, frictionless table-side payments, and intelligent
            kitchen orchestration. Built for culinary establishments that refuse to
            compromise.
          </motion.p>
          <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/onboarding/step-1"
              className="group relative flex items-center gap-3 bg-[#061b0e] text-[#fcf9f8] px-8 py-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#c5a059] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
              <span className="relative z-10 text-sm font-semibold uppercase tracking-widest">
                Curate Your Menu
              </span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="text-sm font-semibold uppercase tracking-widest text-[#061b0e] hover:text-[#c5a059] transition-colors border-b border-transparent hover:border-[#c5a059] pb-0.5">
              Request Private Demo
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Divider ─────────────────────────────────────────────────────────── */}
      <div className="w-px h-24 bg-gradient-to-b from-[#c5a059]/0 via-[#c5a059]/40 to-[#c5a059]/0 mx-auto" />

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          className="text-center mb-24"
        >
          <motion.h2 variants={ITEM} className="font-playfair text-4xl md:text-5xl text-[#061b0e] mb-4">
            Uncompromising Refinement
          </motion.h2>
          <motion.div variants={ITEM} className="w-12 h-0.5 bg-[#c5a059] mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {[
            {
              title: "Bespoke Digital Menus",
              desc: "A tactile, premium browsing experience on the guest's own device. No clunky apps—just pure culinary anticipation.",
              icon: QrCode,
            },
            {
              title: "Frictionless Payments",
              desc: "Discreet and immediate table-side checkout. Let your guests settle their bill with grace, powered by Razorpay.",
              icon: CreditCard,
            },
            {
              title: "Intelligent Orchestration",
              desc: "A quiet, highly legible Kitchen Display System that keeps your back-of-house in perfect, unhurried synchronization.",
              icon: Desktop,
            },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={ITEM}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full border border-[#c5a059]/30 flex items-center justify-center mb-8 bg-white shadow-[0_10px_40px_rgba(27,48,34,0.03)] group-hover:border-[#c5a059] transition-colors duration-500">
                <feat.icon size={28} className="text-[#1b3022]" weight="light" />
              </div>
              <h3 className="font-playfair text-2xl text-[#061b0e] mb-4">{feat.title}</h3>
              <p className="text-[#434843] leading-relaxed max-w-sm">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Testimonial ─────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-16 bg-[#061b0e] text-[#fcf9f8] relative overflow-hidden">
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')" }} />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="text-[#c5a059] text-6xl font-playfair leading-none block mb-6">"</span>
            <h2 className="font-playfair text-3xl md:text-5xl leading-tight mb-12 text-white font-light italic">
              SavorSystem is the silent partner every world-class kitchen needs. It removes friction without removing the romance of dining.
            </h2>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c5a059]">
              — Chef Julian Dupont, <span className="text-[#b4cdb8]">Le Petit Rêve (★★)</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer CTA ──────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-16 text-center max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-playfair text-4xl text-[#061b0e] mb-8"
        >
          Join the Exclusive Platform
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[#434843] mb-12"
        >
          Begin your 14-day curation period. No commitment required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link
            href="/onboarding/step-1"
            className="inline-block bg-[#061b0e] text-[#fcf9f8] px-10 py-5 text-sm font-semibold uppercase tracking-widest hover:bg-[#c5a059] transition-colors duration-500"
          >
            Start Your Legacy
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#c5a059]/20 py-8 text-center">
        <p className="text-[#737973] text-xs font-semibold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} SavorSystem. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
