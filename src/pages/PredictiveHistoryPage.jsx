import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getPredictiveAssessments, hydratePredictiveAssessments } from "../utils/predictiveSafetyNet";
import { getSession } from "../utils/session";

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
  const [session] = useState(() => getSession());
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
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">
            Predictive
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
            {selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <header className="mb-10">
          <p className="kicker mb-2">{selectLabel(languageMode, "Predictive Safety Net", "प्रीडिक्टिव सेफ्टी नेट")}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
            {selectLabel(languageMode, "Forecast assessment history", "फोरकास्ट असेसमेंट हिस्ट्री")}
          </h1>
        </header>

        <section className="bg-white border-2 border-gray-900 rounded-3xl p-6 mb-10 shadow-xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Trigger", "ट्रिगर")}</span>
              <select
                value={triggerFilter}
                onChange={(event) => setTriggerFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none appearance-none transition-colors"
              >
                {triggerOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Status", "स्थिति")}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none appearance-none transition-colors"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Search", "खोज")}</span>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={selectLabel(languageMode, "Search by trigger or reason", "ट्रिगर या कारण से खोजें")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none transition-colors"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
              <p className="text-sm font-bold text-gray-400 italic">
                {selectLabel(languageMode, "No predictive records found.", "कोई प्रीडिक्टिव रिकॉर्ड नहीं मिला।")}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.assessmentId} className="bg-white border border-gray-200 rounded-3xl p-6 transition-all hover:border-gray-900/10 hover:shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-4">
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-wide">{item.triggerLabel || item.triggerId}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-gray-100 border-gray-200 text-gray-700">
                      {item.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-indigo-50 border-indigo-200 text-indigo-700">
                      {item.probabilityAdjustedPct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Threshold</p>
                    <p className="text-[11px] font-bold text-gray-700">{item.thresholdPct}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Expected</p>
                    <p className="text-[11px] font-bold text-gray-700">{formatCurrency(item.expectedPayout || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Advance</p>
                    <p className="text-[11px] font-bold text-gray-700">{formatCurrency(item.advanceAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Confidence</p>
                    <p className="text-[11px] font-bold text-gray-700">{item.confidenceLabel}</p>
                  </div>
                </div>

                {item.factors && (
                  <div className="mt-5 border-t border-gray-50 pt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      {selectLabel(languageMode, "Signal Factors", "सिग्नल फैक्टर्स")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {factorOrder.map((factorKey) => {
                        const raw = Number(item.factors?.[factorKey] || 0);
                        const pct = Math.max(0, Math.min(100, Math.round(raw * 100)));

                        return (
                          <div key={`${item.assessmentId}-${factorKey}`} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                {getFactorLabel(factorKey, languageMode)}
                              </span>
                              <span className="text-[9px] font-black text-gray-700">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gray-900 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs font-medium text-gray-600">{item.reason}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default PredictiveHistoryPage;
