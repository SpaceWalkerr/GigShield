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
  selectedPlanId,
  selectedPlanName,
  latestTrigger,
  latestPayout,
  latestPayoutMeta,
  paidTodayAmount,
  dailyPayoutCap,
  onSimulateTrigger,
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
  };

  const hindiEventLabelById = {
    "heavy-rain": "तेज बारिश",
    heatwave: "भीषण गर्मी",
    "aqi-spike": "AQI बढ़ोतरी",
    "platform-outage": "प्लेटफॉर्म बंद",
  };

  const getLocalizedEventLabel = (event) =>
    selectLabel(languageMode, event.label, hindiEventLabelById[event.id] ?? event.label);

  return (
    <Card
      icon="trigger"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Problem Buttons", "समस्या बटन")
      }
      subtitle={
        selectLabel(
          languageMode,
          `Tap for ${selectedPlanName} support`,
          "मदद के लिए बटन दबाएं",
        )
      }
      className="lg:col-span-2"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {triggerEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSimulateTrigger(event.id)}
            className="group relative overflow-hidden rounded-2xl bg-white/60 p-5 text-left border border-white/60 hover:bg-white transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-gray-900">
                {getLocalizedEventLabel(event)}
              </span>
              <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-red-500 transition-colors" />
            </div>
            <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {selectLabel(languageMode, "Simulate Signal", "सिग्नल दिखाएं")}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {selectLabel(languageMode, "Daily Payout Utilized", "दैनिक सीमा उपयोग")}
        </p>
        <p className="text-sm font-black text-gray-900">
          {formatCurrency(paidTodayAmount)} <span className="text-gray-300">/</span> {formatCurrency(dailyPayoutCap)}
        </p>
      </div>

      {latestTrigger && (
        <div
          role="alert"
          className={`mt-6 rounded-2xl border p-6 animate-enter ${
            statusStyles[latestPayoutMeta.status] || "border-gray-200 bg-white text-gray-900"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {selectLabel(languageMode, "Status", "स्थिति")}: {latestPayoutMeta.status}
            </span>
            {latestPayoutMeta.triggerConfidenceScore && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/5">
                {latestPayoutMeta.triggerConfidenceScore}% {selectLabel(languageMode, "Match", "मैच")}
              </span>
            )}
          </div>

          <h4 className="text-lg font-black tracking-tight mb-1">
            {latestPayoutMeta.status === "paid" || latestPayoutMeta.status === "capped"
              ? selectLabel(languageMode, "Payout Ready", "भुगतान तैयार")
              : selectLabel(languageMode, "Payment Blocked", "भुगतान रुका")}
          </h4>
          
          <p className="text-sm font-medium opacity-90 leading-relaxed">
            {latestPayoutMeta.status === "paid" && selectLabel(languageMode, `Verified ${latestTrigger.label}. Automatic payment of ${formatCurrency(latestPayout)} triggered.`, `${hindiEventLabelById[latestTrigger.id]} सत्यापित। ${formatCurrency(latestPayout)} का भुगतान स्वचालित रूप से चालू हुआ।`)}
            {latestPayoutMeta.status === "capped" && selectLabel(languageMode, `Partial payment of ${formatCurrency(latestPayout)}. Daily limit reached.`, `${formatCurrency(latestPayout)} का आंशिक भुगतान। दैनिक सीमा पूरी।`)}
            {(latestPayoutMeta.status === "blocked-cap" || latestPayoutMeta.status.startsWith("blocked")) && latestPayoutMeta.reason}
          </p>

          {(latestPayoutMeta.status === "paid" || latestPayoutMeta.status === "capped") && (
            <div className="mt-6">
              <Link to="/payout" className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-900 px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-gray-800 transition-colors">
                {selectLabel(languageMode, "Receive Payout", "भुगतान प्राप्त करें")}
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default TriggerSimulationPanel;
