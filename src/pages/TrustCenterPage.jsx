import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPhase3OpsSnapshot } from "../utils/phase3Analytics";

export default function TrustCenterPage() {
  const [metrics, setMetrics] = useState({
    uptimePct: 99.93,
    payoutSuccessRatePct: 95,
    medianSettlementMins: 18,
    fraudBlockedAmount: 0,
    auditsCompleted: 0,
  });

  useEffect(() => {
    let alive = true;

    const hydrateMetrics = async () => {
      const snapshot = await fetchPhase3OpsSnapshot();
      if (!alive || !snapshot?.trustMetrics) return;
      setMetrics(snapshot.trustMetrics);
    };

    hydrateMetrics();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">
            Trust Center
          </span>
        </div>
        <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Public Metrics</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">Platform trust and transparency</h1>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <article className="bg-white border border-gray-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Uptime</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{metrics.uptimePct}%</p>
          </article>
          <article className="bg-white border border-gray-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payout Success Rate</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{metrics.payoutSuccessRatePct}%</p>
          </article>
          <article className="bg-white border border-gray-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Median Settlement</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{metrics.medianSettlementMins} min</p>
          </article>
          <article className="bg-white border border-gray-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fraud Blocked</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">₹{metrics.fraudBlockedAmount}</p>
          </article>
          <article className="bg-white border border-gray-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Audit Runs</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{metrics.auditsCompleted}</p>
          </article>
        </section>

        <section className="mt-8 bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Audit Notes</p>
          <ul className="space-y-2 text-sm text-gray-700 font-medium">
            <li>Policy decisions are rule-traceable and logged in payout timeline.</li>
            <li>Predictive decisions include factor-level confidence scores.</li>
            <li>Daily payout caps and verification gates are enforced before settlement.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
