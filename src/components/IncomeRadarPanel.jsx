import { Compass, Radar, MapPinned, ArrowUpRight, Shield, Clock3, Sparkles, SunMoon, Route } from "lucide-react";
import Card from "./Card";

function ScoreBar({ value, tone = "cyan" }) {
  const toneClass =
    tone === "amber"
      ? "from-amber-300 to-orange-400"
      : tone === "emerald"
        ? "from-emerald-300 to-cyan-300"
        : "from-cyan-300 to-blue-400";

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${toneClass} transition-all duration-700`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function IncomeRadarPanel({ radar }) {
  if (!radar) return null;

  return (
    <Card
      icon="trigger"
      eyebrow="Signature feature"
      title="Income Radar + Shift Advisor"
      subtitle="Predicts where to work, when to leave, and where protection is most likely to matter next."
      className="lg:col-span-2"
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-transparent p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  Next 6 Hours
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                  {radar.safestZone.name}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-300">
                  {radar.recommendation}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <Radar className="h-6 w-6 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  Best earning window
                </p>
                <p className="mt-3 text-sm font-black text-white">{radar.bestWindow}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  Highest risk zone
                </p>
                <p className="mt-3 text-sm font-black text-white">{radar.highestRiskZone.name}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  Model confidence
                </p>
                <p className="mt-3 text-sm font-black text-white">{radar.confidenceScore}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">
              Protection move
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08]">
                <Shield className="h-5 w-5 text-amber-100" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{radar.highestRiskZone.protectionWindow}</p>
                <p className="text-xs text-amber-100/80">Keep payout-ready cover active here</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                Why this stands out
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-100">
                GigShield is not only paying after loss. It helps riders avoid bad earning zones before disruption fully hits.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                  City Heatmap
                </p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-white">
                  {radar.city} earning pressure map
                </h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <MapPinned className="h-5 w-5 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {radar.zones.map((zone, index) => {
                const intensity =
                  zone.disruptionScore >= 72
                    ? "from-red-500/30 via-red-400/10 to-transparent border-red-400/20"
                    : zone.disruptionScore >= 56
                      ? "from-amber-400/25 via-amber-200/10 to-transparent border-amber-300/20"
                      : "from-emerald-400/25 via-cyan-300/10 to-transparent border-emerald-300/20";

                return (
                  <div
                    key={`${zone.id}-heat`}
                    className={`group relative overflow-hidden rounded-[1.3rem] border bg-gradient-to-br ${intensity} p-4 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01]`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_40%)] opacity-70" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-white">{zone.name}</p>
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300">
                          Z{index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                        {zone.disruptionTag}
                      </p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Risk pulse
                          </p>
                          <p className="mt-1 text-2xl font-black text-white">{zone.disruptionScore}%</p>
                        </div>
                        <div className="flex h-10 items-end gap-1">
                          {[0, 1, 2, 3].map((bar) => (
                            <span
                              key={bar}
                              className="w-2 rounded-full bg-white/70 transition-all duration-700 group-hover:bg-white"
                              style={{ height: `${20 + ((zone.disruptionScore + bar * 9) % 55)}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15">
                  <SunMoon className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Tomorrow forecast
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">Next-day earning windows</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {radar.tomorrowOutlook.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-white">{item.zone}</p>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300">
                        {item.riskScore}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                      {item.outlook}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{item.earningMove}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08]">
                  <Sparkles className="h-5 w-5 text-cyan-100" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                    Demo storyline
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">{radar.demoStory.title}</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Disruption builds</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-100">{radar.demoStory.setup}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">2. Rider reroutes</p>
                  <div className="mt-2 flex items-start gap-2">
                    <Route className="mt-1 h-4 w-4 text-cyan-200" />
                    <p className="text-sm leading-7 text-zinc-100">{radar.demoStory.move}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">3. Protection still wins</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-100">{radar.demoStory.fallback}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {radar.zones.map((zone) => (
            <div key={zone.id} className="group rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{zone.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    {zone.corridor}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Income safety</span>
                    <span>{zone.incomeSafetyScore}%</span>
                  </div>
                  <ScoreBar value={zone.incomeSafetyScore} tone="emerald" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Disruption risk</span>
                    <span>{zone.disruptionScore}%</span>
                  </div>
                  <ScoreBar value={zone.disruptionScore} tone="amber" />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-200" />
                  <span>{zone.earningWindow}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinned className="h-3.5 w-3.5 text-amber-200" />
                  <span>{zone.disruptionTag}</span>
                </div>
                <div className="flex items-start gap-2 pt-2">
                  <Compass className="mt-0.5 h-3.5 w-3.5 text-emerald-200" />
                  <span>{zone.advice}</span>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-1.5 bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 transition-all duration-1000 group-hover:translate-x-1"
                  style={{ width: `${Math.max(zone.incomeSafetyScore, 24)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
