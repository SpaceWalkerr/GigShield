import Card from "./Card";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Shows the payout-sensitive financial values that update after each trigger event.
 * This gives judges a quick before/after view during the demo.
 */
function EarningsSnapshot({
  earningsProtectedThisWeek,
  lastPayoutAmount,
  isEasyMode,
  languageMode,
}) {
  return (
    <Card
      languageMode={languageMode}
      title={
        isEasyMode
          ? selectLabel(languageMode, "Money Status", "Paise ki sthiti")
          : selectLabel(languageMode, "Payout Snapshot", "Payout jhalak")
      }
      subtitle={
        isEasyMode
          ? selectLabel(
              languageMode,
              "Shows protected money and latest support payment",
              "Surakshit paisa aur naya bhugtan dikhata hai",
            )
          : selectLabel(
              languageMode,
              "Live values updated by trigger simulations",
              "Trigger par amount turant update hota hai",
            )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-electric-600 bg-electric-500 p-5 text-white shadow-chip">
          <p className="text-xs uppercase tracking-[0.18em] text-electric-100">
            {isEasyMode
              ? selectLabel(languageMode, "Money protected this week", "Is hafte ka surakshit paisa")
              : selectLabel(languageMode, "Earnings protected this week", "Is hafte ki surakshit kamai")}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(earningsProtectedThisWeek)}
          </p>
        </article>

        <article className="rounded-xl border border-signal-600 bg-signal-500 p-5 text-coal-900 shadow-chip">
          <p className="text-xs uppercase tracking-[0.18em] text-coal-700">
            {isEasyMode
              ? selectLabel(languageMode, "Last support payment", "Pichla sahayata bhugtan")
              : selectLabel(languageMode, "Last payout amount", "Aakhri payout rashi")}
          </p>
          <p className="mt-2 text-3xl font-bold text-coal-900">
            {formatCurrency(lastPayoutAmount)}
          </p>
        </article>
      </div>
    </Card>
  );
}

export default EarningsSnapshot;
