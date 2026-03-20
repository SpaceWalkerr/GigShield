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
      ? "bg-moss-100 text-moss-600"
      : "bg-coal-100 text-coal-700";

  return (
    <Card
      icon="activity"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Work Activity", "काम की गतिविधि")
      }
      subtitle={
        selectLabel(languageMode, "Simple daily work summary", "रोज़ का काम एक नज़र में")
      }
    >
      <dl className="space-y-3 text-sm">
        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Orders done today", "आज के ऑर्डर")}
          </dt>
          <dd className="font-bold text-coal-900">
            {activity.ordersCompletedToday}
          </dd>
        </div>

        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Last working time", "आखिरी काम का समय")}
          </dt>
          <dd className="font-bold text-coal-900">
            {formatTime(lastActiveTime)}
          </dd>
        </div>

        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {selectLabel(languageMode, "Current movement", "अभी की गतिविधि")}
          </dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${movementClasses}`}
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
