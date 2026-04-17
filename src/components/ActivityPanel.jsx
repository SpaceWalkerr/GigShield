import Card from "./Card";
import { formatTime } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Represents worker-side operational telemetry used by GigShield signals.
 * The panel is static mock data but keeps the demo tied to rider activity context.
 */
function ActivityPanel({ activity, lastActiveTime, languageMode }) {
  const resolvedActivity = activity || {};
  const isWorkingNow = resolvedActivity.movementStatus === "Active";
  const movementClasses =
    isWorkingNow
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : "border-white/10 bg-white/[0.03] text-zinc-400";

  return (
    <Card
      icon="activity"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Operational Activity", "ऑपरेशनल गतिविधि")
      }
      subtitle={
        selectLabel(languageMode, "Live signals from the protection system", "सुरक्षा सिस्टम से लाइव सिग्नल")
      }
    >
      <dl className="space-y-4">
        {[
          { label: selectLabel(languageMode, "Signals Processed Today", "आज प्रोसेस किए गए सिग्नल"), value: resolvedActivity.signalsProcessedToday ?? resolvedActivity.ordersCompletedToday ?? 0 },
          { label: selectLabel(languageMode, "Last Live Check", "अंतिम लाइव जांच"), value: lastActiveTime ? formatTime(lastActiveTime) : "--" }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
            <dt className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              {item.label}
            </dt>
            <dd className="text-sm font-extrabold text-white">
              {item.value}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <dt className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            {selectLabel(languageMode, "Live Protection Status", "लाइव सुरक्षा स्थिति")}
          </dt>
          <dd>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter ${movementClasses}`}
            >
              {isWorkingNow
                ? selectLabel(languageMode, "Yes", "हाँ")
                : selectLabel(languageMode, "No", "नहीं")}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default ActivityPanel;

