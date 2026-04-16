import { useEffect, useState } from "react";
import { fetchPhase3OpsSnapshot } from "../utils/phase3Analytics";
import { AppPageShell, AppSurface } from "@/components/ui/app-page-shell";
import { fetchOperationsInsights } from "../services/backend/operationsInsightsService";

export default function TrustCenterPage() {
  const [metrics, setMetrics] = useState({
    uptimePct: 99.93,
    payoutSuccessRatePct: 95,
    medianSettlementMins: 18,
    fraudBlockedAmount: 0,
    auditsCompleted: 0,
  });
  const [recentDisruptions, setRecentDisruptions] = useState([]);
  const [recentAutomationScans, setRecentAutomationScans] = useState([]);

  useEffect(() => {
    let alive = true;

    const hydrateMetrics = async () => {
      const snapshot = await fetchPhase3OpsSnapshot();
      if (!alive || !snapshot?.trustMetrics) return;
      setMetrics(snapshot.trustMetrics);

      const insights = await fetchOperationsInsights();
      if (!alive || !insights) return;
      setMetrics((current) => ({
        ...current,
        payoutSuccessRatePct: insights.trustMetrics?.payoutSuccessRatePct ?? current.payoutSuccessRatePct,
        medianSettlementMins: insights.trustMetrics?.medianSettlementMins ?? current.medianSettlementMins,
        fraudBlockedAmount: insights.trustMetrics?.fraudBlockedAmount ?? current.fraudBlockedAmount,
        auditsCompleted: insights.trustMetrics?.auditsCompleted ?? current.auditsCompleted,
      }));
      setRecentDisruptions(insights.recentDisruptions || []);
      setRecentAutomationScans(insights.recentAutomationScans || []);
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

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <AppSurface>
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent Disruptions</p>
            <div className="space-y-3">
              {recentDisruptions.length === 0 ? (
                <p className="text-sm font-medium text-zinc-400">No recent disruptions recorded yet.</p>
              ) : (
                recentDisruptions.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-white">{item.label}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.severity}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-zinc-300">{item.city} · {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </AppSurface>

          <AppSurface>
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent Automation Scans</p>
            <div className="space-y-3">
              {recentAutomationScans.length === 0 ? (
                <p className="text-sm font-medium text-zinc-400">No automation scans recorded yet.</p>
              ) : (
                recentAutomationScans.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-white">{item.riskLevel} risk</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.confidence}%</span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-zinc-300">{item.city} · {new Date(item.assessedAt).toLocaleString()}</p>
                    <p className="mt-2 text-xs font-medium text-zinc-400">{item.explanation || "Automation scan completed."}</p>
                  </div>
                ))
              )}
            </div>
          </AppSurface>
        </section>
    </AppPageShell>
  );
}
