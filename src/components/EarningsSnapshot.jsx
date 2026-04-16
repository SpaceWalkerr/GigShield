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
        selectLabel(languageMode, "Support Money", "सहायता राशि")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Easy view of your insurance support",
          "आपकी बीमा सहायता का आसान विवरण",
        )
      }
    >
      <div className="grid gap-6">
        <div className="flex flex-col">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {selectLabel(languageMode, "Total Support This Week", "इस सप्ताह कुल सहायता")}
          </p>
          <p className="text-4xl font-black tracking-tighter text-white">
            {formatCurrency(earningsProtectedThisWeek)}
          </p>
        </div>

        <div className="flex flex-col border-t border-white/10 pt-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {selectLabel(languageMode, "Latest Payment", "नवीनतम भुगतान")}
          </p>
          <p className="text-2xl font-black tracking-tight text-zinc-300">
            {formatCurrency(lastPayoutAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default EarningsSnapshot;
