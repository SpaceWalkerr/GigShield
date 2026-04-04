import { useState, useEffect, useCallback } from "react";
import { checkGigShieldRisk } from "../lib/gigshieldApi";
import { formatCurrency } from "../utils/format";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  high:   { bg: "bg-red-50",    border: "border-red-200",   badge: "bg-red-500 text-white",    dot: "bg-red-500",   label: "HIGH"   },
  medium: { bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-400 text-white",  dot: "bg-amber-400", label: "MEDIUM" },
  low:    { bg: "bg-green-50",  border: "border-green-200", badge: "bg-green-500 text-white",  dot: "bg-green-500", label: "LOW"    },
};
function riskCfg(level = "low") {
  return RISK_CONFIG[String(level).toLowerCase()] ?? RISK_CONFIG.low;
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, large = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 ${
      accent ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-100"
    }`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${accent ? "text-gray-400" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`font-black leading-none ${large ? "text-2xl" : "text-xl"} ${accent ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function ConfidenceBar({ value = 0 }) {
  const color = value >= 85 ? "bg-green-500" : value >= 65 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Confidence</p>
        <span className="text-sm font-black text-gray-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-bold text-gray-600 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
        {weather.locationName} · {weather.temperature?.toFixed(1)}°C
        {weather.feelsLike != null && <span className="text-gray-400">· feels {weather.feelsLike.toFixed(1)}°C</span>}
        · {weather.condition}
        <span className="text-gray-300">·</span>
        <span className="text-[10px] text-gray-400">{weather.source}</span>
      </div>
      {weather.aqi != null && (
        <div className={`flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-bold shadow-sm ${aqiColors[weather.aqi] ?? 'text-gray-600'}`}>
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
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
      </div>
      <div className="h-14 rounded-2xl bg-gray-100" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AutomationPanel({ session }) {
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
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("[AutomationPanel] Check failed:", err);
      setError(err.message || "Could not connect to the risk engine.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Auto-fetch on mount
  useEffect(() => { performCheck(); }, [performCheck]);

  const cfg = riskCfg(data?.riskLevel);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl p-6 space-y-6">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-[80px]" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Live Risk Engine
          </p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Auto-Protection AI</h3>
          <p className="text-xs font-medium text-gray-400 mt-0.5">
            Real-time weather · multi-trigger risk analysis
            {lastRefresh && <span className="ml-2 text-gray-300">· Last checked {lastRefresh}</span>}
          </p>
        </div>

        <button
          id="automation-panel-refresh"
          onClick={performCheck}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:border-gray-400 hover:shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-wait"
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
          <p className="text-center text-xs font-semibold text-gray-400 mt-3 animate-pulse">
            Analyzing live environmental signals via n8n…
          </p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="relative z-10 rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-black text-red-700">Connection Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <p className="text-[10px] text-red-400 mt-1">Make sure the backend server is running on port 3001.</p>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {data && !loading && (
        <div className="relative z-10 space-y-5">

          {/* Notification banner */}
          {data.notification && (
            <div className={`rounded-2xl border p-4 flex gap-3 ${cfg.bg} ${cfg.border}`}>
              <div className={`w-1 self-stretch rounded-full ${cfg.dot} flex-shrink-0`} />
              <div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-widest mb-0.5">Live Alert</p>
                <p className="text-sm font-semibold text-gray-800">{data.notification}</p>
              </div>
            </div>
          )}

          {/* Weather chip */}
          <WeatherChip weather={data.liveWeather} />

          {/* ── Row 1: 4 stat cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Risk Level */}
            <div className={`rounded-2xl border p-4 shadow-sm ${cfg.bg} ${cfg.border}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Risk Level</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <p className="text-xl font-black text-gray-900 capitalize">{data.riskLevel ?? "—"}</p>
              </div>
            </div>

            {/* Premium */}
            <StatCard label="Live Premium" value={formatCurrency(data.premium ?? 0)} />

            {/* Coverage Status */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Coverage</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {data.coverageStatus ?? "active"}
              </span>
            </div>

            {/* Claim Status */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Claim</p>
              <p className="text-sm font-black text-gray-900 capitalize truncate">{data.claimStatus ?? "none"}</p>
              {data.claimId && (
                <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{data.claimId}</p>
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
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">AI Explanation</p>
              <p className="text-sm text-gray-700 font-medium leading-relaxed">{data.explanation ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Recommended Action</p>
              <p className="text-sm text-blue-900 font-semibold leading-relaxed">{data.recommendedAction ?? "—"}</p>
            </div>
          </div>

          {/* ── Row 4: Timeline + Next Risk Window ──────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline</p>
                <p className="text-xs font-bold text-gray-700">{data.timeline ?? "—"}</p>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 shadow-sm">
              <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Next Risk Window</p>
                <p className="text-xs font-bold text-purple-900">{data.nextRiskWindow ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* ── Footer: Trigger tag + engine badge ──────────────────────────── */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Trigger</p>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white shadow-sm">
                {data.lastTrigger || "none"}
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-500">
              🟢 Standalone Engine
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
