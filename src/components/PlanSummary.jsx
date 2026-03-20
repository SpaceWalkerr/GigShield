import Card from "./Card";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Displays the worker's active insurance plan and current coverage state.
 * This mirrors the live contract state shown in the GigShield dashboard.
 */
function PlanSummary({ selectedPlan, coverageActive, languageMode }) {
  const statusClasses = coverageActive
    ? "bg-moss-100 text-moss-600"
    : "bg-red-100 text-red-700";

  return (
    <Card
      icon="shield"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Your Safety Plan", "आपकी सुरक्षा योजना")
      }
      subtitle={
        selectLabel(
          languageMode,
          "See your plan, payment, and protection status",
          "योजना, भुगतान और सुरक्षा स्थिति देखें",
        )
      }
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Plan name", "योजना का नाम")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {selectedPlan.name}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Weekly payment", "साप्ताहिक भुगतान")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {formatCurrency(selectedPlan.weeklyPremium)}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Active time", "सक्रिय समय")}
          </dt>
          <dd className="mt-1 text-base font-semibold text-coal-900">
            {selectedPlan.coverageHours}
          </dd>
        </div>
        <div className="board-soft p-4">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Protection status", "सुरक्षा स्थिति")}
          </dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}
            >
              {coverageActive
                ? selectLabel(languageMode, "Coverage Active", "कवरेज चालू")
                : selectLabel(languageMode, "Coverage Paused", "कवरेज रुका")}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default PlanSummary;
