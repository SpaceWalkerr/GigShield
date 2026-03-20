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
        selectLabel(languageMode, "Problem Buttons | Instant Help", "समस्या बटन | तुरंत मदद")
      }
      subtitle={
        selectLabel(
          languageMode,
          `Tap any button to test support payout for ${selectedPlanName} plan`,
          "किसी भी बटन पर टैप करके भुगतान टेस्ट करें",
        )
      }
      className="lg:col-span-2"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {triggerEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSimulateTrigger(event.id)}
            className="group board-soft px-4 py-3 text-left text-base font-semibold text-coal-900 transition hover:-translate-y-0.5 hover:bg-coal-900 hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-electric-500 transition group-hover:bg-signal-500" />
              {selectLabel(languageMode, `Tap: ${event.label}`, `टैप करें: ${getLocalizedEventLabel(event)}`)}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-coal-500">
        {selectLabel(languageMode, "Today's help paid", "आज का दिया गया भुगतान")}
        : {formatCurrency(paidTodayAmount)} / {formatCurrency(dailyPayoutCap)}
      </p>

      {latestTrigger ? (
        <div
          role="alert"
          className={`mt-4 rounded-xl border p-4 text-sm ${
            statusStyles[latestPayoutMeta.status] || "border-signal-600 bg-signal-50 text-coal-900"
          }`}
        >
          <p className="font-bold tracking-wide">
            {selectLabel(languageMode, "Trigger Activated", "ट्रिगर चालू")}
          </p>
          {latestPayoutMeta.status === "paid" ? (
            <p className="mt-1">
              {selectLabel(
                languageMode,
                `Success: ${latestTrigger.label} support paid = ${formatCurrency(latestPayout)}`,
                `सफल: ${hindiEventLabelById[latestTrigger.id] ?? latestTrigger.label} के लिए भुगतान = ${formatCurrency(latestPayout)}`,
              )}
            </p>
          ) : null}
          {latestPayoutMeta.status === "capped" ? (
            <p className="mt-1">
              {selectLabel(
                languageMode,
                `Partial payment: ${formatCurrency(latestPayout)}. Daily limit is almost full.`,
                `आंशिक भुगतान: ${formatCurrency(latestPayout)}। दैनिक सीमा लगभग पूरी है।`,
              )}
            </p>
          ) : null}
          {latestPayoutMeta.status === "blocked-cap" ||
          latestPayoutMeta.status === "blocked-coverage" ||
          latestPayoutMeta.status === "blocked-verification" ? (
            <p className="mt-1">{latestPayoutMeta.reason}</p>
          ) : null}
          <p className="mt-1 text-xs text-coal-700">
            {selectLabel(languageMode, "Event reference", "घटना संदर्भ")}: {latestTrigger.id} | {" "}
            {selectLabel(languageMode, "Plan", "योजना")}: {selectedPlanId} | {" "}
            {selectLabel(languageMode, "Remaining cap before event", "इवेंट से पहले बची सीमा")}: {" "}
            {formatCurrency(latestPayoutMeta.remainingCap)}
          </p>

          {latestPayoutMeta.status === "paid" || latestPayoutMeta.status === "capped" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/payout" className="primary-btn">
                {selectLabel(languageMode, "Receive payout", "भुगतान प्राप्त करें")}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export default TriggerSimulationPanel;
