import Card from "./Card";
import { formatTime } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Represents worker-side operational telemetry used by GigShield signals.
 * The panel is static mock data but keeps the demo tied to rider activity context.
 */
function ActivityPanel({ activity, lastActiveTime, languageMode }) {
  const movementClasses =
    activity.movementStatus === "Active"
      ? "bg-green-100 text-green-600 border-green-200"
      : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <Card
      icon="activity"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Work Activity", "काम की गतिविधि")
      }
      subtitle={
        selectLabel(languageMode, "Daily summary", "रोज़ का काम")
      }
    >
      <dl className="space-y-4">
        {[
          { label: selectLabel(languageMode, "Orders done today", "आज के ऑर्डर"), value: activity.ordersCompletedToday },
          { label: selectLabel(languageMode, "Last active", "आखिरी सक्रिय"), value: formatTime(lastActiveTime) }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <dt className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {item.label}
            </dt>
            <dd className="text-sm font-extrabold text-gray-900">
              {item.value}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <dt className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {selectLabel(languageMode, "Current movement", "अभी की गतिविधि")}
          </dt>
          <dd>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter ${movementClasses}`}
            >
              {activity.movementStatus}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default ActivityPanel;
