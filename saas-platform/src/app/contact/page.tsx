"use client";

import Link from "next/link";
import { EnvelopeSimple, WhatsappLogo, ArrowLeft, MapPin } from "@phosphor-icons/react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1b2a] flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex items-center justify-between relative z-10 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
            <img src="/logo.png" alt="Nosh Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight">Nosh</span>
        </Link>
        <Link href="/" className="text-[#44474c] hover:text-[#0d1b2a] font-medium flex items-center gap-2 transition-colors">
          <ArrowLeft weight="bold" />
          Back to Home
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[#0d1b2a]">
            Get in Touch
          </h1>
          <p className="text-lg text-[#44474c] max-w-xl mx-auto leading-relaxed">
            Have a question, need support, or want to outsource your menu setup? We're here to help you supercharge your restaurant.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full">
          {/* Email Support */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 hover:border-indigo-500/30 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
              <EnvelopeSimple size={32} weight="fill" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-[#44474c] mb-6 flex-1">
              Drop us an email anytime. We typically respond within 24 hours to all inquiries and support requests.
            </p>
            <a 
              href="mailto:samarthpasalkar4@gmail.com" 
              className="inline-flex items-center justify-center w-full h-12 bg-[#0d1b2a] hover:bg-[#1a2b3d] text-white font-semibold rounded-xl transition-colors"
            >
              samarthpasalkar4@gmail.com
            </a>
          </div>

          {/* WhatsApp & Menu Setup */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 hover:border-green-500/30 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
              <WhatsappLogo size={32} weight="fill" />
            </div>
            <h3 className="text-xl font-bold mb-2">WhatsApp / Menu Setup</h3>
            <p className="text-[#44474c] mb-6 flex-1">
              Want us to set up your menu? Or need quick chat support? Reach out directly via WhatsApp for fastest response.
            </p>
            <a 
              href="https://wa.me/918050280065?text=Hi,%20I'd%20like%20to%20know%20more%20about%20Nosh%20and%20the%20Menu%20Setup%20service." 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl transition-colors"
            >
              +91 8050280065
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
