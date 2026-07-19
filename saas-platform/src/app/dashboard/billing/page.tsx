export default function BillingPage() {
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Billing & Plan</h1>
        <p className="text-sm text-[#74777d] mt-1">
          Manage your subscription and view past invoices.
        </p>
      </div>

      <div className="px-8 space-y-6">
        {/* Current Plan Card */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-[#0d1b2a]">Pro Plan</h2>
              <span className="bg-[#e8edff] text-[#415a77] text-xs font-semibold px-2 py-0.5 rounded-full">
                Trial active
              </span>
            </div>
            <p className="text-sm text-[#44474c] mb-4">
              ₹3,999/month · Billed via Razorpay Subscriptions
            </p>
            <p className="text-xs text-[#74777d]">
              Trial ends on Oct 24, 2025. You will be charged ₹3,999 on this date.
            </p>
          </div>
          <button className="h-9 px-4 bg-[#f1f3ff] hover:bg-[#e2e8f0] text-[#0d1b2a] text-sm font-semibold rounded-lg transition-colors">
            Manage Subscription
          </button>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs font-semibold text-[#415a77] uppercase tracking-widest mb-1">
              Tables Usage
            </p>
            <p className="text-2xl font-bold text-[#0d1b2a]">
              8 <span className="text-lg text-[#74777d] font-normal">/ 50 limit</span>
            </p>
            <div className="w-full h-1.5 bg-[#f1f3ff] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: "16%" }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs font-semibold text-[#415a77] uppercase tracking-widest mb-1">
              Orders this month
            </p>
            <p className="text-2xl font-bold text-[#0d1b2a]">
              1,204
            </p>
            <p className="text-xs text-[#74777d] mt-2">Unlimited orders included in your plan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
