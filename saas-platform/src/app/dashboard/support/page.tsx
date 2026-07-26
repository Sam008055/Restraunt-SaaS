"use client";

import { EnvelopeSimple, WhatsappLogo, Phone, Sparkle, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useCurrentRestaurant } from "@/lib/firebase/hooks";

export default function SupportPage() {
  const { restaurant } = useCurrentRestaurant();
  const currentPlan = restaurant?.subscription?.plan || "starter";
  const isAnnual = currentPlan.includes("annual");

  return (
    <div className="flex flex-col h-full bg-[#f9f9ff]">
      <div className="px-8 py-6 bg-white border-b border-[#e2e8f0]">
        <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Support & Services</h1>
        <p className="text-sm text-[#74777d] mt-1">
          Need help? Contact us directly or opt for our premium setup services.
        </p>
      </div>

      <div className="p-8 max-w-4xl space-y-8">
        
        {/* General Support Section */}
        <section>
          <h2 className="text-lg font-semibold text-[#0d1b2a] mb-4">General Support</h2>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <EnvelopeSimple size={24} weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0d1b2a]">Email Support</h3>
                <p className="text-sm text-[#44474c] mt-1 mb-4">
                  For bug reports, feature requests, or general inquiries, shoot us an email. We typically respond within 24 hours.
                </p>
                <a 
                  href="mailto:samarthpasalkar4@gmail.com?subject=Nosh%20Support%20Request" 
                  className="inline-flex items-center gap-2 bg-[#f1f3ff] text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <EnvelopeSimple size={18} />
                  samarthpasalkar4@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Services Section */}
        <section>
          <h2 className="text-lg font-semibold text-[#0d1b2a] mb-4">Premium Services</h2>
          <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1a2b3d] rounded-xl border border-[#e2e8f0] p-1 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkle size={120} weight="fill" color="white" />
            </div>
            
            <div className="bg-white rounded-lg p-6 m-0.5 relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Done For You
                    </span>
                    {isAnnual && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Sparkle size={10} weight="fill" />
                        Free for Annual Subscribers
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#0d1b2a]">Premium Menu Setup</h3>
                  <p className="text-sm text-[#44474c] mt-2 mb-4 leading-relaxed">
                    Don't want to manually type out 100+ menu items, categories, and prices? 
                    Send us your physical menu PDF or images, and our team will perfectly digitize and structure your entire menu for you.
                  </p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#74777d] line-through">₹999</span>
                      <span className="text-xl font-bold text-[#0d1b2a]">₹499 <span className="text-sm font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1">Early Bird</span></span>
                    </div>
                  </div>
                </div>

                <div className="md:w-[280px] shrink-0 bg-[#f9f9ff] rounded-xl p-5 border border-[#e2e8f0]">
                  <h4 className="text-sm font-semibold text-[#0d1b2a] mb-3">Get Started Now</h4>
                  <div className="space-y-3">
                    <a 
                      href="https://wa.me/918050280065?text=Hi,%20I%20would%20like%20to%20request%20the%20Premium%20Menu%20Setup%20service." 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <WhatsappLogo size={20} weight="fill" />
                      WhatsApp Us
                    </a>
                    <a 
                      href="tel:+918050280065" 
                      className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 text-[#0d1b2a] border border-[#d1d5db] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Phone size={18} weight="fill" />
                      Call +91 80502 80065
                    </a>
                  </div>
                  
                  {!isAnnual && (
                    <div className="mt-4 flex items-start gap-2 text-xs text-[#74777d]">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>
                        Upgrade to an <strong>Annual Growth</strong> or <strong>Pro</strong> plan to get this setup absolutely free!
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </section>
        
      </div>
    </div>
  );
}
