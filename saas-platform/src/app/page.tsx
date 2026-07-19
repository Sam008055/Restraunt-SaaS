"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, QrCode, CreditCard, Desktop } from "@phosphor-icons/react";
import { useRef } from "react";

const STAGGER: any = {
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

const ITEM: any = {
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
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nosh Logo" className="w-8 h-8 rounded-md" />
          <div className="font-playfair text-2xl font-bold tracking-tight text-[#061b0e]">
            Nosh
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-bold uppercase tracking-widest text-[#434843] hover:text-[#c5a059] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold uppercase tracking-widest bg-[#eaff00] text-black px-5 py-2.5 rounded-full hover:bg-[#d4e600] transition-colors shadow-sm"
          >
            Get Started
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
            className="text-[#ff0055] text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-6"
          >
            The Ultimate Vibe Check
          </motion.p>
          <motion.h1
            variants={ITEM}
            className="font-playfair text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] font-bold text-[#061b0e] tracking-tight mb-8"
          >
            Dine differently. <br />
            <span className="italic text-[#ff0055]">Zero friction.</span>
          </motion.h1>
          <motion.p
            variants={ITEM}
            className="text-lg md:text-xl text-[#434843] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Dope digital menus, instant table-side payments, and real-time
            kitchen vibes. Built for restaurants that actually get it.
          </motion.p>
          <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/login"
              className="group relative flex items-center gap-3 bg-[#061b0e] text-[#fcf9f8] px-8 py-4 rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#eaff00] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
              <span className="relative z-10 text-sm font-bold uppercase tracking-widest group-hover:text-black transition-colors">
                Build Your Menu
              </span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 group-hover:text-black transition-all" />
            </Link>
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
            Next-Gen Features
          </motion.h2>
          <motion.div variants={ITEM} className="w-12 h-0.5 bg-[#eaff00] mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {[
            {
              title: "Digital Menus That Pop",
              desc: "A sleek, mobile-first browsing experience right from their own phone. No app required—just scan and crave.",
              icon: QrCode,
            },
            {
              title: "Seamless Payments",
              desc: "Instant, table-side checkout. Let your guests split the bill and pay in seconds using Razorpay.",
              icon: CreditCard,
            },
            {
              title: "Live Kitchen Sync",
              desc: "A highly intuitive Kitchen Display System that keeps your cooks in perfect flow without the chaos.",
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
            <span className="text-[#eaff00] text-6xl font-playfair leading-none block mb-6">"</span>
            <h2 className="font-playfair text-3xl md:text-5xl leading-tight mb-12 text-white font-light italic">
              Nosh completely leveled up our restaurant's aesthetic and flow. Orders are flying out the kitchen faster than ever.
            </h2>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#eaff00]">
              — Kiki & Co., <span className="text-white/60">Boutique Cafe</span>
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
          Join the Club
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
            href="/login"
            className="inline-block bg-[#eaff00] rounded-full text-black px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-[#d4e600] transition-colors duration-300 shadow-md"
          >
            Get Started Now
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#c5a059]/20 py-8 text-center">
        <p className="text-[#737973] text-xs font-semibold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Nosh. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
