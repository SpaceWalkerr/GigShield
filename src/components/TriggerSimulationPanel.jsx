import Card from "./Card";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";

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
  isEasyMode,
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

  return (
    <Card
      languageMode={languageMode}
      title={
        isEasyMode
          ? selectLabel(languageMode, "Problem Buttons | Instant Help", "Samasya button | Turant madad")
          : selectLabel(languageMode, "Trigger Simulation", "Trigger demo")
      }
      subtitle={
        isEasyMode
          ? selectLabel(
              languageMode,
              `Tap any button to test support payout for ${selectedPlanName} plan`,
              "Kisi bhi button par tap karke payout test karein",
            )
          : selectLabel(
              languageMode,
              `Trigger payouts for the ${selectedPlanName} plan`,
              `${selectedPlanName} plan ke liye trigger payout`,
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
            className={`group board-soft px-4 py-3 text-left font-semibold text-coal-900 transition hover:-translate-y-0.5 hover:bg-coal-900 hover:text-white ${
              isEasyMode ? "text-base" : "text-sm"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-electric-500 transition group-hover:bg-signal-500" />
              {isEasyMode
                ? selectLabel(languageMode, `Tap: ${event.label}`, `Dabayein: ${event.label}`)
                : selectLabel(languageMode, event.buttonLabel, `${event.label} demo`)}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-coal-500">
        {isEasyMode
          ? selectLabel(languageMode, "Today's help paid", "Aaj ka diya gaya payout")
          : selectLabel(languageMode, "Paid today", "Aaj ka payout")}
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
            {selectLabel(languageMode, "Trigger Activated", "Trigger chalu")}
          </p>
          {latestPayoutMeta.status === "paid" ? (
            <p className="mt-1">
              {isEasyMode
                ? `Success: ${latestTrigger.label} support paid = ${formatCurrency(latestPayout)}`
                : `${latestTrigger.label} payout applied for ${selectedPlanName}: ${formatCurrency(latestPayout)}`}
            </p>
          ) : null}
          {latestPayoutMeta.status === "capped" ? (
            <p className="mt-1">
              {isEasyMode
                ? `Partial payment: ${formatCurrency(latestPayout)}. Daily limit is almost full.`
                : `${latestTrigger.label} payout partially applied: ${formatCurrency(latestPayout)} out of ${formatCurrency(latestPayoutMeta.basePayout)} because the daily cap is nearly reached.`}
            </p>
          ) : null}
          {latestPayoutMeta.status === "blocked-cap" ||
          latestPayoutMeta.status === "blocked-coverage" ||
          latestPayoutMeta.status === "blocked-verification" ? (
            <p className="mt-1">{latestPayoutMeta.reason}</p>
          ) : null}
          <p className="mt-1 text-xs text-coal-700">
            {selectLabel(languageMode, "Event reference", "Event ID")}: {latestTrigger.id} | {" "}
            {selectLabel(languageMode, "Plan", "Yojana")}: {selectedPlanId} | {" "}
            {selectLabel(languageMode, "Remaining cap before event", "Event se pehle bachi limit")}: {" "}
            {formatCurrency(latestPayoutMeta.remainingCap)}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

export default TriggerSimulationPanel;
