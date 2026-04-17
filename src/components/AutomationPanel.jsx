import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { checkGigShieldRisk } from "../lib/gigshieldApi";
import { formatCurrency } from "../utils/format";
import {
  fetchLatestAutomationAssessmentFromBackend,
  saveAutomationAssessmentToBackend,
} from "../services/backend/automationAssessmentService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  high:   { bg: "bg-red-500/10",    border: "border-red-400/20",   badge: "bg-red-500 text-white",    dot: "bg-red-400",   label: "HIGH"   },
  medium: { bg: "bg-amber-500/10",  border: "border-amber-400/20", badge: "bg-amber-400 text-zinc-950",  dot: "bg-amber-300", label: "MEDIUM" },
  low:    { bg: "bg-emerald-500/10",  border: "border-emerald-400/20", badge: "bg-emerald-400 text-zinc-950",  dot: "bg-emerald-300", label: "LOW"    },
};
function riskCfg(level = "low") {
  return RISK_CONFIG[String(level).toLowerCase()] ?? RISK_CONFIG.low;
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, large = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 ${
      accent ? "border-white/10 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03]"
    }`}>
      <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${accent ? "text-zinc-500" : "text-zinc-500"}`}>
        {label}
      </p>
      <p className={`font-black leading-none ${large ? "text-2xl" : "text-xl"} ${accent ? "text-zinc-950" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ConfidenceBar({ value = 0 }) {
  const color = value >= 85 ? "bg-green-500" : value >= 65 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Confidence</p>
        <span className="text-sm font-black text-white">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function WeatherChip({ weather }) {
  if (!weather) return null;
  const aqiLabels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const aqiColors = ['', 'text-green-600', 'text-green-500', 'text-amber-500', 'text-orange-500', 'text-red-600'];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-1.5 text-xs font-bold text-zinc-300 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
        {weather.locationName} · {weather.temperature?.toFixed(1)}°C
        {weather.feelsLike != null && <span className="text-zinc-500">· feels {weather.feelsLike.toFixed(1)}°C</span>}
        · {weather.condition}
        <span className="text-zinc-600">·</span>
        <span className="text-[10px] text-zinc-500">{weather.source}</span>
      </div>
      {weather.aqi != null && (
        <div className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold shadow-sm ${aqiColors[weather.aqi] ?? 'text-zinc-300'}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          AQI: {aqiLabels[weather.aqi] ?? weather.aqi}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-2xl bg-gray-100" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/10" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/10" />)}
      </div>
      <div className="h-14 rounded-2xl bg-white/10" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AutomationPanel({ session, setSession }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [data, setData]         = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const performCheck = useCallback(async () => {
    setLoading(true);
    setError(null);

    let lat = 28.6139, lon = 77.209; // Delhi fallback
    try {
      if ("geolocation" in navigator) {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000, maximumAge: 60000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }
    } catch { /* use fallback */ }

    // Synchronize global session with real-time browser location (only if moved)
    if (setSession && (Math.abs(lat - (session?.latitude || 0)) > 0.001 || Math.abs(lon - (session?.longitude || 0)) > 0.001)) {
       setSession(prev => ({ ...prev, latitude: lat, longitude: lon }));
    }

    const payload = {
      workerId:       session?.workerId   || "worker_101",
      workerName:     session?.name       || "Rahul Worker",
      phone:          session?.phone      || "+919999999999",
      email:          session?.email      || "rahul@gigshield.com",
      zone:           session?.city       || "Delhi-110001",
      latitude:       lat,
      longitude:      lon,
      platform:       session?.platforms?.[0] || "Swiggy",
      coverageTier:   "Standard",
      currentPremium: 129,
      currentRisk:    "low",
      activeCoverage: true,
      avgWeeklyClaims: 1,
    };

    try {
      const result = await checkGigShieldRisk(payload);
      setData(result);
      setLastRefresh(new Date(result?._computedAt || Date.now()).toLocaleTimeString());
      void saveAutomationAssessmentToBackend(result, {
        city: session?.city || result?.worker?.zone || "Unknown",
        workerId: session?.workerId || result?.worker?.id || null,
      });

      // ── Risk Toast Notification ─────────────────────────────────────
      const level = (result.riskLevel || "low").toLowerCase();
      
      const textConfig = {
        low:    "Low Risk — Safe to deliver. Coverage active.",
        medium: "Medium Risk — Stay cautious. Payout may be available.",
        high:   "High Risk — Auto-protection activated! Check your claim.",
      };
      const text = textConfig[level] || textConfig.low;
      
      const config = {
        toastId: `risk-${level}`, // Prevent duplicate toasts for same level
        autoClose: 5000,
        className: "!rounded-xl !shadow-lg !font-sans !text-[13px] !font-semibold text-gray-700",
      };

      if (level === "low") {
        toast.success(text, config);
      } else if (level === "medium") {
        toast.warning(text, config);
      } else {
        toast.error(text, config);
      }

    } catch (err) {
      console.error("[AutomationPanel] Check failed:", err);
      setError(err.message || "Could not connect to the risk engine.");
      toast.error("Risk engine unavailable. Check your connection.", {
        toastId: "engine-error",
        className: "!rounded-xl !shadow-lg !font-sans !text-[13px] !font-semibold text-gray-700",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [session?.workerId, session?.name, session?.city, session?.platforms, setSession, session?.latitude, session?.longitude]);

  useEffect(() => {
    let alive = true;

    const hydrateLatest = async () => {
      const latest = await fetchLatestAutomationAssessmentFromBackend();
      if (!alive || !latest) {
        return;
      }

      setData(latest);
      setLastRefresh(new Date(latest?._computedAt || Date.now()).toLocaleTimeString());
    };

    hydrateLatest();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  // Auto-fetch on mount only (or when worker identity changes)
  useEffect(() => { 
    performCheck(); 
  }, [performCheck]);

  const cfg = riskCfg(data?.riskLevel);

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl space-y-6">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Live Risk Engine
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white">Auto-Protection AI</h3>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">
            Real-time weather · multi-trigger risk analysis
            {lastRefresh && <span className="ml-2 text-gray-300">· Last checked {lastRefresh}</span>}
          </p>
        </div>

        <button
          id="automation-panel-refresh"
          onClick={performCheck}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-zinc-100 shadow-sm transition-all hover:border-white/20 hover:bg-white/[0.08] hover:shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-40"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? "Scanning…" : "Refresh"}
        </button>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="relative z-10">
          <LoadingSkeleton />
            <p className="mt-3 animate-pulse text-center text-xs font-semibold text-zinc-500">
            Analyzing live environmental signals via n8n…
          </p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="relative z-10 flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-black text-red-200">Critical Engine Failure</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
            <p className="mt-2 text-[10px] text-red-300 uppercase tracking-widest font-bold">Both Backend and Local Fallback failed. Check your internet connection.</p>
          </div>
        </div>
      )}

      {/* ── Engine Source Badge ──────────────────────────────────────────────── */}
      {data && !loading && (
        <div className="relative z-10 flex justify-end">
           <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${data._source === 'local-fallback' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'}`}>
             {data._source === 'local-fallback' ? 'Local Compute Active' : 'Cloud Engine Active'}
           </span>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {data && !loading && (
        <div className="relative z-10 space-y-5">

          {/* Notification banner */}
          {data.notification && (
            <div className={`relative overflow-hidden rounded-2xl border p-4 flex items-center gap-4 ${cfg.bg} ${cfg.border} shadow-sm transition-all duration-500`}>
              {/* Thick left edge accent */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${cfg.dot}`} />
              
              {/* Premium Icon Circle */}
              <div className="relative pl-2 flex items-center justify-center">
                 <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-sm border ${cfg.border}`}>
                    {cfg.label === 'HIGH' && <span className="text-xl" role="img" aria-label="warning">🚨</span>}
                    {cfg.label === 'MEDIUM' && <span className="text-xl" role="img" aria-label="caution">⚠️</span>}
                    {cfg.label === 'LOW' && <span className="text-xl" role="img" aria-label="safe">🛡️</span>}
                 </div>
                 {/* Pulse indicator */}
                 <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white ${cfg.dot}`}>
                   <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${cfg.dot}`} />
                 </div>
              </div>

              {/* Text content */}
              <div className="flex-1">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                   System Alert
                   <span className="text-zinc-600">•</span>
                   <span className="capitalize text-zinc-500">{data.riskLevel} Risk Detected</span>
                </p>
                <p className="text-[14px] font-bold leading-snug text-white">{data.notification}</p>
              </div>
            </div>
          )}

          {/* Weather chip */}
          <WeatherChip weather={data.liveWeather} />

          {/* ── Row 1: 4 stat cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Risk Level */}
            <div className={`rounded-2xl border p-4 shadow-sm ${cfg.bg} ${cfg.border}`}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Risk Level</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <p className="text-xl font-black capitalize text-white">{data.riskLevel ?? "—"}</p>
              </div>
            </div>

            {/* Premium */}
            <StatCard label="Live Premium" value={formatCurrency(data.premium ?? 0)} />

            {/* Coverage Status */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Coverage</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {data.coverageStatus ?? "active"}
              </span>
            </div>

            {/* Claim Status */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Claim</p>
              <p className="truncate text-sm font-black capitalize text-white">{data.claimStatus ?? "none"}</p>
              {data.claimId && (
                <p className="mt-0.5 truncate text-[10px] font-bold text-zinc-500">{data.claimId}</p>
              )}
            </div>
          </div>

          {/* ── Row 2: Confidence + Earnings ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ConfidenceBar value={data.confidence ?? 0} />
            <StatCard label="Earnings Protected" value={formatCurrency(data.earningsProtected ?? 0)} accent />
          </div>

          {/* ── Row 3: Explanation + Action ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Explanation</p>
              <p className="text-sm font-medium leading-relaxed text-zinc-300">{data.explanation ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-200">Recommended Action</p>
              <p className="text-sm font-semibold leading-relaxed text-cyan-50">{data.recommendedAction ?? "—"}</p>
            </div>
          </div>

          {/* ── Row 4: Timeline + Next Risk Window ──────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-sm">
              <svg className="h-4 w-4 flex-shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Timeline</p>
                <p className="text-xs font-bold text-zinc-100">{data.timeline ?? "—"}</p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 shadow-sm">
              <svg className="h-4 w-4 flex-shrink-0 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-300">Next Risk Window</p>
                <p className="text-xs font-bold text-violet-50">{data.nextRiskWindow ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* ── Footer: Trigger tag + engine badge ──────────────────────────── */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Last Trigger</p>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-950 shadow-sm">
                {data.lastTrigger || "none"}
              </span>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
              Live Engine
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
