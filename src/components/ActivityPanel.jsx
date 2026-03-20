import Card from "./Card";
import { formatTime } from "../utils/format";
import { selectLabel } from "../utils/i18n";

/*
 * Represents worker-side operational telemetry used by GigShield signals.
 * The panel is static mock data but keeps the demo tied to rider activity context.
 */
function ActivityPanel({ activity, lastActiveTime, isEasyMode, languageMode }) {
  const movementClasses =
    activity.movementStatus === "Active"
      ? "bg-moss-100 text-moss-600"
      : "bg-coal-100 text-coal-700";

  return (
    <Card
      languageMode={languageMode}
      title={
        isEasyMode
          ? selectLabel(languageMode, "Work Activity", "Kaam ki gatividhi")
          : selectLabel(languageMode, "Activity Panel", "Gatividhi panel")
      }
      subtitle={
        isEasyMode
          ? selectLabel(languageMode, "Simple daily work summary", "Roz ka kaam ek nazar mein")
          : selectLabel(languageMode, "Mock rider operations data for demo context", "Demo ke liye rider data")
      }
    >
      <dl className="space-y-3 text-sm">
        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Orders done today", "Aaj ke orders")
              : selectLabel(languageMode, "Orders completed today", "Aaj poore orders")}
          </dt>
          <dd className="font-bold text-coal-900">
            {activity.ordersCompletedToday}
          </dd>
        </div>

        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Last working time", "Aakhri kaam ka samay")
              : selectLabel(languageMode, "Last active time", "Aakhri active samay")}
          </dt>
          <dd className="font-bold text-coal-900">
            {formatTime(lastActiveTime)}
          </dd>
        </div>

        <div className="board-soft flex items-center justify-between px-4 py-3">
          <dt className="text-coal-500">
            {isEasyMode
              ? selectLabel(languageMode, "Current movement", "Abhi ki movement")
              : selectLabel(languageMode, "Movement status", "Movement sthiti")}
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
