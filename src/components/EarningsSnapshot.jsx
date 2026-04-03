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
        selectLabel(languageMode, "Protected", "सुरक्षित")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Money status",
          "पेमेंट स्थिति",
        )
      }
    >
      <div className="grid gap-6">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            {selectLabel(languageMode, "Protected this week", "इस हफ्ते सुरक्षित")}
          </p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">
            {formatCurrency(earningsProtectedThisWeek)}
          </p>
        </div>

        <div className="flex flex-col border-t border-gray-100 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            {selectLabel(languageMode, "Last support payment", "पिछला भुगतान")}
          </p>
          <p className="text-2xl font-black text-gray-400 tracking-tight">
            {formatCurrency(lastPayoutAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default EarningsSnapshot;
