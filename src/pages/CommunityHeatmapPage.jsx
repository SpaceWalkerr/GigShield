import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCommunityHeatmapRows } from "../utils/communityHeatmap";

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
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">
            Community Heatmap
          </span>
        </div>
        <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Live Social Proof</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">City disruption and payout pulse</h1>
        </header>

        <section className="grid md:grid-cols-2 gap-5">
          {rows.length === 0 && (
            <article className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Loading live city signals...</p>
            </article>
          )}
          {rows.map((row) => (
            <article key={row.city} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black tracking-tight">{row.city}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{row.activeRiders} active riders</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    <span>Disruption Intensity</span>
                    <span>{row.disruptionScore}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${row.disruptionScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    <span>Payout Activity</span>
                    <span>{row.payoutActivity}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.payoutActivity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    <span>Trust Pulse</span>
                    <span>{row.trustPulse}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-900" style={{ width: `${row.trustPulse}%` }} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
