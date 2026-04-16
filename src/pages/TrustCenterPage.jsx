import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPhase3OpsSnapshot } from "../utils/phase3Analytics";
import { AppPageShell, AppSurface } from "@/components/ui/app-page-shell";

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
    <AppPageShell
      badge="Trust Center"
      title="Platform trust and transparency"
      description="Public-facing operating metrics for payout reliability, settlement speed, fraud blocked value, and audit visibility."
    >
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            ["Uptime", `${metrics.uptimePct}%`],
            ["Payout Success Rate", `${metrics.payoutSuccessRatePct}%`],
            ["Median Settlement", `${metrics.medianSettlementMins} min`],
            ["Fraud Blocked", `₹${metrics.fraudBlockedAmount}`],
            ["Audit Runs", `${metrics.auditsCompleted}`],
          ].map(([label, value]) => (
            <AppSurface key={label}>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
            </AppSurface>
          ))}
        </section>

        <AppSurface className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Audit Notes</p>
          <ul className="space-y-2 text-sm font-medium text-zinc-300">
            <li>Policy decisions are rule-traceable and logged in payout timeline.</li>
            <li>Predictive decisions include factor-level confidence scores.</li>
            <li>Daily payout caps and verification gates are enforced before settlement.</li>
          </ul>
        </AppSurface>
    </AppPageShell>
  );
}
