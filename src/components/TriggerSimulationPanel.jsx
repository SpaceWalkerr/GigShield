import Card from "./Card";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { Link } from "react-router-dom";

/*
 * Demo control panel that mimics external trigger ingestion (weather, AQI, outage signals).
 * Clicking a trigger calls the parent callback to apply payout logic and refresh dashboard values.
 */
function TriggerSimulationPanel({
  triggerEvents,
  latestTrigger,
  latestPayout,
  latestPayoutMeta,
  paidTodayAmount,
  dailyPayoutCap,
  onSimulateTrigger,
  predictiveSummary,
  languageMode,
}) {
  const statusStyles = {
    paid: "border-moss-300 bg-moss-50 text-coal-900",
    capped: "border-signal-600 bg-signal-50 text-coal-900",
    "blocked-cap": "border-red-300 bg-red-50 text-red-800",
    "blocked-coverage": "border-red-300 bg-red-50 text-red-800",
    "blocked-verification": "border-red-300 bg-red-50 text-red-800",
    "blocked-policy": "border-red-300 bg-red-50 text-red-800",
    "blocked-cooldown": "border-red-300 bg-red-50 text-red-800",
    "blocked-dedup": "border-red-300 bg-red-50 text-red-800",
    "invalid-trigger": "border-red-300 bg-red-50 text-red-800",
    "predictive-approved": "border-green-300 bg-green-50 text-green-900",
    "predictive-pending": "border-amber-300 bg-amber-50 text-amber-900",
    "predictive-invalid": "border-red-300 bg-red-50 text-red-800",
  };

  const hindiEventLabelById = {
    "heavy-rain": "भारी बारिश इमरजेंसी",
    heatwave: "भारी गर्मी इमरजेंसी",
    "aqi-spike": "खराब हवा इमरजेंसी",
    "platform-outage": "ऐप बंद इमरजेंसी",
  };

  const englishEventLabelById = {
    "heavy-rain": "Heavy Rain Emergency",
    heatwave: "Extreme Heat Emergency",
    "aqi-spike": "Bad Air Emergency",
    "platform-outage": "App Outage Emergency",
  };

  const statusLabelByCode = {
    paid: { en: "Support approved", hi: "सहायता स्वीकृत" },
    capped: { en: "Partial support approved", hi: "आंशिक सहायता स्वीकृत" },
    "blocked-cap": { en: "Daily limit reached", hi: "दैनिक सीमा पूरी" },
    "blocked-coverage": { en: "Outside protection hours", hi: "सुरक्षा समय के बाहर" },
    "blocked-verification": { en: "Verification needed", hi: "सत्यापन आवश्यक" },
    "blocked-policy": { en: "Not included in your plan", hi: "आपकी योजना में शामिल नहीं" },
    "blocked-cooldown": { en: "Please wait and retry", hi: "कृपया इंतजार करें" },
    "blocked-dedup": { en: "Already checked recently", hi: "अभी हाल में जांचा गया" },
    "invalid-trigger": { en: "Invalid emergency input", hi: "अमान्य इमरजेंसी इनपुट" },
    "predictive-approved": { en: "Advance is ready", hi: "एडवांस तैयार है" },
    "predictive-pending": { en: "Monitoring in progress", hi: "निगरानी जारी है" },
    "predictive-invalid": { en: "Predictive check unavailable", hi: "प्रीडिक्टिव जांच उपलब्ध नहीं" },
  };

  const getLocalizedEventLabel = (event) =>
    selectLabel(
      languageMode,
      englishEventLabelById[event.id] ?? event.label,
      hindiEventLabelById[event.id] ?? event.label,
    );

  const getLocalizedStatusLabel = (statusCode) => {
    const fallback = { en: "Under review", hi: "जांच जारी" };
    const statusMeta = statusLabelByCode[statusCode] ?? fallback;
    return selectLabel(languageMode, statusMeta.en, statusMeta.hi);
  };

  return (
    <Card
      icon="trigger"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Check Emergency Support", "इमरजेंसी सहायता जांचें")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Tap a situation to see if support money starts",
          "सहायता भुगतान शुरू होगा या नहीं, यह देखने के लिए स्थिति चुनें",
        )
      }
      className="lg:col-span-2"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {triggerEvents.map((event) => (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-xl shadow-black/10 transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-widest text-white">
                {getLocalizedEventLabel(event)}
              </span>
              <div className="h-2 w-2 rounded-full bg-zinc-600 transition-colors group-hover:bg-red-400" />
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
              {selectLabel(languageMode, "Run Forecast or Confirm", "फोरकास्ट चलाएं या कन्फर्म करें")}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSimulateTrigger(event.id, "forecast")}
                className="h-10 rounded-xl border border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                {selectLabel(languageMode, "Forecast", "फोरकास्ट")}
              </button>
              <button
                type="button"
                onClick={() => onSimulateTrigger(event.id, "confirmed")}
                className="h-10 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                {selectLabel(languageMode, "Confirm", "कन्फर्म")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {predictiveSummary && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {selectLabel(languageMode, "Radar", "रडार")}: {predictiveSummary.triggerLabel}
            </p>
            <span className="text-xs font-black text-white">{predictiveSummary.probabilityAdjustedPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${predictiveSummary.probabilityAdjustedPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-zinc-300">{predictiveSummary.reason}</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          {selectLabel(languageMode, "Today Support Used", "आज उपयोग हुई सहायता")}
        </p>
        <p className="text-sm font-black text-white">
          {formatCurrency(paidTodayAmount)} <span className="text-zinc-600">/</span> {formatCurrency(dailyPayoutCap)}
        </p>
      </div>

      {latestTrigger && (
        <div
          role="alert"
          className={`mt-6 rounded-2xl border p-6 animate-enter ${
            statusStyles[latestPayoutMeta.status] || "border-white/10 bg-white/[0.04] text-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {selectLabel(languageMode, "Status", "स्थिति")}: {getLocalizedStatusLabel(latestPayoutMeta.status)}
            </span>
            {latestPayoutMeta.triggerConfidenceScore && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/5">
                {latestPayoutMeta.triggerConfidenceScore}% {selectLabel(languageMode, "Match", "मैच")}
              </span>
            )}
          </div>

          <h4 className="text-lg font-black tracking-tight mb-1">
            {latestPayoutMeta.status === "paid" || latestPayoutMeta.status === "capped"
              ? selectLabel(languageMode, "Support Approved", "सहायता स्वीकृत")
              : latestPayoutMeta.status?.startsWith("predictive")
                ? selectLabel(languageMode, "Forecast Outcome", "फोरकास्ट परिणाम")
                : selectLabel(languageMode, "Support Not Started", "सहायता शुरू नहीं हुई")}
          </h4>
          
          <p className="text-sm font-medium opacity-90 leading-relaxed">
            {latestPayoutMeta.status === "paid" && selectLabel(languageMode, `${getLocalizedEventLabel(latestTrigger)} confirmed. ${formatCurrency(latestPayout)} support will be sent automatically.`, `${hindiEventLabelById[latestTrigger.id]} सत्यापित। ${formatCurrency(latestPayout)} की सहायता राशि स्वतः भेजी जाएगी।`)}
            {latestPayoutMeta.status === "capped" && selectLabel(languageMode, `${formatCurrency(latestPayout)} support approved. Daily limit reached.`, `${formatCurrency(latestPayout)} सहायता स्वीकृत। दैनिक सीमा पूरी।`)}
            {latestPayoutMeta.status === "predictive-approved" && selectLabel(languageMode, `Disruption probability is ${latestPayoutMeta.predictiveProbability}%. Early support of ${formatCurrency(latestPayoutMeta.predictiveAdvanceAmount || 0)} can be released.`, `डिसरप्शन संभावना ${latestPayoutMeta.predictiveProbability}% है। ${formatCurrency(latestPayoutMeta.predictiveAdvanceAmount || 0)} का अर्ली सपोर्ट रिलीज हो सकता है।`)}
            {latestPayoutMeta.status === "predictive-pending" && selectLabel(languageMode, `Current probability is ${latestPayoutMeta.predictiveProbability}% and threshold is ${latestPayoutMeta.predictiveThreshold}%. Monitoring continues.`, `अभी संभावना ${latestPayoutMeta.predictiveProbability}% है और थ्रेशहोल्ड ${latestPayoutMeta.predictiveThreshold}% है। निगरानी जारी है।`)}
            {(latestPayoutMeta.status === "blocked-cap" || latestPayoutMeta.status.startsWith("blocked")) && latestPayoutMeta.reason}
            {latestPayoutMeta.status === "predictive-invalid" && latestPayoutMeta.reason}
          </p>

          {(latestPayoutMeta.status === "paid" || latestPayoutMeta.status === "capped") && (
            <div className="mt-6">
              <Link to="/payout" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-xs font-black uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200">
                {selectLabel(languageMode, "Go to Payment", "भुगतान पेज खोलें")}
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default TriggerSimulationPanel;

