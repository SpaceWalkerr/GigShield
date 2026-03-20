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
  languageMode,
}) {
  return (
    <Card
      icon="money"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Money Status", "पैसों की स्थिति")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Shows protected money and latest support payment",
          "सुरक्षित पैसे और नया भुगतान दिखाता है",
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-electric-600 bg-electric-500 p-5 text-white shadow-chip">
          <p className="text-xs uppercase tracking-[0.18em] text-electric-100">
            {selectLabel(languageMode, "Money protected this week", "इस हफ्ते के सुरक्षित पैसे")}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(earningsProtectedThisWeek)}
          </p>
        </article>

        <article className="rounded-xl border border-signal-600 bg-signal-500 p-5 text-coal-900 shadow-chip">
          <p className="text-xs uppercase tracking-[0.18em] text-coal-700">
            {selectLabel(languageMode, "Last support payment", "पिछला सहायता भुगतान")}
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
