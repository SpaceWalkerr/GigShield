const triggers = [
  {
    id: "heavy_rain",
    label: "Heavy Rain",
    icon: "🌧️",
    desc: "Triggered when rainfall exceeds safety thresholds",
    color: "hover:border-blue-400 hover:bg-blue-50",
    activeColor: "border-blue-500 bg-blue-50",
    checkColor: "bg-blue-500",
  },
  {
    id: "heatwave",
    label: "Heatwave",
    icon: "🌡️",
    desc: "Triggered when temperature crosses extreme heat threshold",
    color: "hover:border-orange-400 hover:bg-orange-50",
    activeColor: "border-orange-500 bg-orange-50",
    checkColor: "bg-orange-500",
  },
  {
    id: "aqi_spike",
    label: "AQI Spike",
    icon: "💨",
    desc: "Triggered when air quality index hits hazardous levels",
    color: "hover:border-purple-400 hover:bg-purple-50",
    activeColor: "border-purple-500 bg-purple-50",
    checkColor: "bg-purple-500",
  },
  {
    id: "platform_outage",
    label: "Platform Outage",
    icon: "📵",
    desc: "Triggered during verified platform downtime events",
    color: "hover:border-red-400 hover:bg-red-50",
    activeColor: "border-red-500 bg-red-50",
    checkColor: "bg-red-500",
  },
];

export default function StepCoverage({ formData, updateField, onActivate, isLoading }) {
  const selected = formData.coverageTriggers || [];

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id];
    updateField("coverageTriggers", next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 6 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Choose your protection triggers</h2>
        <p className="mt-2 text-coal-500 text-sm">Select the disruptions you want coverage for</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {triggers.map((t) => {
          const isActive = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                isActive ? t.activeColor : `border-coal-200 bg-white ${t.color}`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{t.icon}</span>
                <span className={`mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive ? `${t.checkColor} border-transparent` : "border-coal-300 bg-white"
                }`}>
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
              </div>
              <p className="mt-2 font-semibold text-coal-900 text-sm">{t.label}</p>
              <p className="mt-0.5 text-xs text-coal-500">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-signal-50 border border-signal-100 px-4 py-3 text-xs text-coal-600">
        ⚡ GigShield uses these signals to determine when automatic payouts may be triggered.
      </div>

      <button
        type="button"
        disabled={selected.length === 0 || isLoading}
        onClick={onActivate}
        className="primary-btn w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Activating protection…
          </span>
        ) : (
          `Activate Protection ${selected.length > 0 ? `(${selected.length} trigger${selected.length > 1 ? "s" : ""})` : ""}`
        )}
      </button>
    </div>
  );
}
