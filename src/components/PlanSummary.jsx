import Card from "./Card";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Displays the worker's active insurance plan and current coverage state.
 * This mirrors the live contract state shown in the GigShield dashboard.
 */
function PlanSummary({ selectedPlan, coverageActive, isEasyMode, languageMode }) {
  const statusClasses = coverageActive
    ? "bg-moss-100 text-moss-600"
    : "bg-red-100 text-red-700";

  return (
    <Card
      languageMode={languageMode}
      title={
        isEasyMode
          ? selectLabel(languageMode, "Your Safety Plan", "Aapki Suraksha Yojana")
          : selectLabel(languageMode, "Worker Coverage", "Worker Suraksha")
      }
      subtitle={
        isEasyMode
          ? selectLabel(
              languageMode,
              "See your plan, payment, and protection status",
              "Yojana, bhugtan, aur suraksha sthiti dekhein",
            )
          : selectLabel(
              languageMode,
              "Your current insurance plan and runtime coverage status",
              "Aapki vartaman yojana aur coverage sthiti",
            )
      }
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Plan name", "Yojana ka naam")
              : selectLabel(languageMode, "Current plan", "Maujooda yojana")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {selectedPlan.name}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Weekly payment", "Hafte ka bhugtan")
              : selectLabel(languageMode, "Weekly premium", "Hafte ka premium")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {formatCurrency(selectedPlan.weeklyPremium)}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Active time", "Chalu samay")
              : selectLabel(languageMode, "Coverage hours", "Coverage ghante")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {selectedPlan.coverageHours}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Protection status", "Suraksha sthiti")
              : selectLabel(languageMode, "Coverage status", "Coverage sthiti")}
          </dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}
            >
              {coverageActive
                ? selectLabel(languageMode, "Coverage Active", "Coverage chalu")
                : selectLabel(languageMode, "Coverage Paused", "Coverage ruka")}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default PlanSummary;
