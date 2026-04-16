import Card from "./Card";
import { formatTime } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Represents worker-side operational telemetry used by GigShield signals.
 * The panel is static mock data but keeps the demo tied to rider activity context.
 */
function ActivityPanel({ activity, lastActiveTime, languageMode }) {
  const isWorkingNow = activity.movementStatus === "Active";
  const movementClasses =
    isWorkingNow
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : "border-white/10 bg-white/[0.03] text-zinc-400";

  return (
    <Card
      icon="activity"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Work Summary", "काम का सार")
      }
      subtitle={
        selectLabel(languageMode, "Simple daily work status", "आज के काम की सरल स्थिति")
      }
    >
      <dl className="space-y-4">
        {[
          { label: selectLabel(languageMode, "Orders Completed Today", "आज पूरे किए गए ऑर्डर"), value: activity.ordersCompletedToday },
          { label: selectLabel(languageMode, "Last Seen Working", "अंतिम बार काम करते हुए"), value: formatTime(lastActiveTime) }
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
            {selectLabel(languageMode, "Working Right Now", "अभी काम कर रहे हैं")}
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
