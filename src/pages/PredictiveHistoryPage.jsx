import { useEffect, useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getPredictiveAssessments, hydratePredictiveAssessments } from "../utils/predictiveSafetyNet";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";
import { useHydratedSession } from "../hooks/useHydratedSession";

const factorOrder = ["weather", "outage", "traffic", "regional", "historical"];

function getFactorLabel(key, languageMode) {
  if (key === "weather") return selectLabel(languageMode, "Weather", "मौसम");
  if (key === "outage") return selectLabel(languageMode, "Outage", "आउटेज");
  if (key === "traffic") return selectLabel(languageMode, "Traffic", "ट्रैफिक");
  if (key === "regional") return selectLabel(languageMode, "Regional", "रीजनल");
  return selectLabel(languageMode, "Historical", "इतिहास");
}

function PredictiveHistoryPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const { session } = useHydratedSession();
  const [history, setHistory] = useState(() => getPredictiveAssessments({ limit: 100 }));
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const triggerOptions = useMemo(() => {
    const set = new Set(history.map((item) => item.triggerId).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [history]);

  const statusOptions = useMemo(() => {
    const set = new Set(history.map((item) => item.status).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [history]);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return history.filter((item) => {
      if (triggerFilter !== "all" && item.triggerId !== triggerFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        String(item.triggerLabel || "").toLowerCase().includes(q) ||
        String(item.reason || "").toLowerCase().includes(q) ||
        String(item.assessmentId || "").toLowerCase().includes(q)
      );
    });
  }, [history, searchValue, statusFilter, triggerFilter]);

  useEffect(() => {
    let alive = true;

    const syncHistory = async () => {
      const hydrated = await hydratePredictiveAssessments({
        workerId: session?.workerId,
        limit: 100,
      });

      if (!alive) {
        return;
      }

      setHistory(hydrated);
    };

    syncHistory();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  return (
    <AppPageShell
      badge="Predictive"
      backTo="/dashboard"
      backLabel={selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
      actions={<LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />}
    >
      <div className="w-full px-0 py-4">
        <header className="mb-10">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectLabel(languageMode, "Predictive Safety Net", "प्रीडिक्टिव सेफ्टी नेट")}</p>
          <h1 className="mb-6 text-4xl font-black leading-none tracking-tighter text-white sm:text-5xl">
            {selectLabel(languageMode, "Forecast assessment history", "फोरकास्ट असेसमेंट हिस्ट्री")}
          </h1>
        </header>

        <AppSurface className="mb-10 p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Trigger", "ट्रिगर")}</span>
              <select
                value={triggerFilter}
                onChange={(event) => setTriggerFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white focus:border-white/30 focus:outline-none"
              >
                {triggerOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Status", "स्थिति")}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white focus:border-white/30 focus:outline-none"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Search", "खोज")}</span>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={selectLabel(languageMode, "Search by trigger or reason", "ट्रिगर या कारण से खोजें")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
            </label>
          </div>
        </AppSurface>

        <section className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
              <p className="text-sm font-bold italic text-zinc-500">
                {selectLabel(languageMode, "No predictive records found.", "कोई प्रीडिक्टिव रिकॉर्ड नहीं मिला।")}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <AppSurface key={item.assessmentId} className="p-6 transition-all hover:border-white/20">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-white">{item.triggerLabel || item.triggerId}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-200">
                      {item.status}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
                      {item.probabilityAdjustedPct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-4 md:grid-cols-4">
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">Threshold</p>
                    <p className="text-[11px] font-bold text-zinc-200">{item.thresholdPct}%</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">Expected</p>
                    <p className="text-[11px] font-bold text-zinc-200">{formatCurrency(item.expectedPayout || 0)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">Advance</p>
                    <p className="text-[11px] font-bold text-zinc-200">{formatCurrency(item.advanceAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">Confidence</p>
                    <p className="text-[11px] font-bold text-zinc-200">{item.confidenceLabel}</p>
                  </div>
                </div>

                {item.factors && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {selectLabel(languageMode, "Signal Factors", "सिग्नल फैक्टर्स")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {factorOrder.map((factorKey) => {
                        const raw = Number(item.factors?.[factorKey] || 0);
                        const pct = Math.max(0, Math.min(100, Math.round(raw * 100)));

                        return (
                          <div key={`${item.assessmentId}-${factorKey}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                {getFactorLabel(factorKey, languageMode)}
                              </span>
                              <span className="text-[9px] font-black text-zinc-200">{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-white transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs font-medium text-zinc-300">{item.reason}</p>
              </AppSurface>
            ))
          )}
        </section>
      </div>
    </AppPageShell>
  );
}

export default PredictiveHistoryPage;
