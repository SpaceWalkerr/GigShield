import { useEffect, useState } from "react";
import { getCommunityHeatmapRows } from "../utils/communityHeatmap";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";

export default function CommunityHeatmapPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    const hydrateRows = async () => {
      const nextRows = await getCommunityHeatmapRows({ limit: 500 });
      if (!alive) return;
      setRows(nextRows);
    };

    hydrateRows();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppPageShell badge="Community Heatmap" backTo="/dashboard" backLabel="Dashboard">
      <div className="w-full px-0 py-4">
        <header className="mb-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Social Proof</p>
          <h1 className="text-4xl font-black leading-none tracking-tighter text-white sm:text-5xl">City disruption and payout pulse</h1>
        </header>

        <section className="grid md:grid-cols-2 gap-5">
          {rows.length === 0 && (
            <AppSurface className="p-6">
              <p className="text-sm font-semibold text-zinc-400">Loading live city signals...</p>
            </AppSurface>
          )}
          {rows.map((row) => (
            <AppSurface key={row.city} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black tracking-tight text-white">{row.city}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{row.activeRiders} active riders</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Disruption Intensity</span>
                    <span>{row.disruptionScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${row.disruptionScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Payout Activity</span>
                    <span>{row.payoutActivity}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.payoutActivity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Trust Pulse</span>
                    <span>{row.trustPulse}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-white" style={{ width: `${row.trustPulse}%` }} />
                  </div>
                </div>
              </div>
            </AppSurface>
          ))}
        </section>
      </div>
    </AppPageShell>
  );
}

