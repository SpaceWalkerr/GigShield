import { useNavigate } from "react-router-dom";

export default function StepSuccess({ formData }) {
  const navigate = useNavigate();
  const triggerLabels = {
    heavy_rain: "Heavy Rain 🌧️",
    heatwave: "Heatwave 🌡️",
    aqi_spike: "AQI Spike 💨",
    platform_outage: "Platform Outage 📵",
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center py-4">
      {/* Success animation */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-moss-50 border-4 border-moss-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-moss-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="absolute -inset-2 rounded-full border-2 border-moss-200 animate-ping opacity-30" />
      </div>

      <div>
        <p className="kicker mb-2">Protection Active</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight text-moss-600">You're protected</h2>
        <p className="mt-3 text-coal-500 text-sm max-w-sm mx-auto">
          Your GigShield profile is now active. You'll be eligible for automatic payouts when covered disruptions occur.
        </p>
      </div>

      {/* Summary card */}
      <div className="board-soft w-full p-5 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="kicker">Rider</p>
            <p className="mt-0.5 font-semibold text-coal-900 text-sm">{formData.fullName || "Rider"}</p>
          </div>
          <div className="text-right">
            <p className="kicker">Platform</p>
            <p className="mt-0.5 font-semibold text-coal-900 text-sm capitalize">{formData.platform || "—"}</p>
          </div>
        </div>
        <div className="border-t border-coal-200 pt-3">
          <p className="kicker mb-2">Active Triggers</p>
          <div className="flex flex-wrap gap-2">
            {(formData.coverageTriggers || []).map((t) => (
              <span key={t} className="rounded-full bg-coal-900 px-3 py-1 text-xs font-semibold text-white">
                {triggerLabels[t] || t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="primary-btn flex-1 py-3 text-base"
        >
          Go to Dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate("/triggers")}
          className="secondary-btn flex-1 py-3 text-base"
        >
          View Protection Status
        </button>
      </div>

      <p className="text-xs text-coal-400">
        GigShield will monitor conditions in real-time and notify you of any payouts.
      </p>
    </div>
  );
}
