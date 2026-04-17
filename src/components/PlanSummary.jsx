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
        selectLabel(languageMode, "Your Insurance Plan", "आपकी बीमा योजना")
      }
      subtitle={
        selectLabel(
          languageMode,
          "What you pay and what you get",
          "आप क्या देते हैं और क्या पाते हैं",
        )
      }
    >
      <div className="space-y-6">
        {[
          { label: selectLabel(languageMode, "Plan Name", "योजना का नाम"), value: selectedPlan.name },
          { label: selectLabel(languageMode, "Weekly Cost", "साप्ताहिक खर्च"), value: formatCurrency(selectedPlan.weeklyPremium) },
          { label: selectLabel(languageMode, "Protection Hours", "सुरक्षा समय"), value: selectedPlan.coverageHours }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {item.label}
            </dt>
            <dd className="text-sm font-black text-gray-900">
              {item.value}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {selectLabel(languageMode, "Plan Status", "योजना स्थिति")}
          </dt>
          <dd>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusClasses}`}
            >
              {coverageActive
                ? selectLabel(languageMode, "Running", "चालू")
                : selectLabel(languageMode, "Paused", "रुका")}
            </span>
          </dd>
        </div>
      </div>
    </Card>
  );
}

export default PlanSummary;

