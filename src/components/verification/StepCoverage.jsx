import planDetails from "../../data/planDetails.json";
import { formatCurrency } from "../../utils/format";
import { getPersonaRiskProfile } from "../../utils/onboardingProfile";
import { calculateWeeklyPremium } from "../../utils/pricing";

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
  const profile = getPersonaRiskProfile(formData);
  const selectedPlan = planDetails.find((plan) => plan.id === formData.selectedPlanId) ?? planDetails[1];
  const premium = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: formData.platform === "both" ? 2 : 1,
    riskLevel: profile.riskLevel,
  });

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id];
    updateField("coverageTriggers", next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 4 of 4</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Create your weekly protection plan</h2>
        <p className="mt-2 text-sm text-zinc-400">Select the disruptions you want covered and review your AI risk profile</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kicker">AI Risk Assessment</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{profile.riskLevel} disruption risk</h3>
              <p className="mt-1 text-sm text-zinc-400">Persona score: {profile.score}/100</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${
              profile.riskLevel === "High"
                ? "bg-red-500/15 text-red-200"
                : profile.riskLevel === "Medium"
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-emerald-500/15 text-emerald-200"
            }`}>
              {profile.recommendedPlanId.toUpperCase()} recommended
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                profile.riskLevel === "High"
                  ? "bg-red-500"
                  : profile.riskLevel === "Medium"
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${profile.score}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.drivers.length > 0 ? profile.drivers.map((driver) => (
              <span key={driver} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300">
                {driver}
              </span>
            )) : (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300">
                balanced exposure profile
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-5 backdrop-blur-xl">
          <p className="kicker">Weekly Pricing</p>
          <label className="mt-3 block text-sm font-semibold text-zinc-200">Choose Plan</label>
          <div className="mt-2 grid gap-2">
            {planDetails.map((plan) => {
              const selectedPlanCard = formData.selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => updateField("selectedPlanId", plan.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selectedPlanCard
                      ? "border-cyan-300/60 bg-slate-950/70 text-white"
                      : "border-white/10 bg-white/[0.06] text-zinc-200 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(
                        calculateWeeklyPremium({
                          basePremium: plan.weeklyPremium,
                          platformCount: formData.platform === "both" ? 2 : 1,
                          riskLevel: profile.riskLevel,
                        }).adjustedPremium,
                      )}
                      /week
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${selectedPlanCard ? "text-zinc-400" : "text-zinc-500"}`}>{plan.coverageHours}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Policy preview</p>
            <p className="mt-2 text-2xl font-black text-white">{formatCurrency(premium.adjustedPremium)}</p>
            <p className="text-sm text-zinc-400">per week for {selectedPlan.name} protection</p>
            <p className="mt-2 text-xs text-zinc-500">
              Trigger-based income loss cover only. Health, life, accidents, and vehicle repairs are excluded.
            </p>
          </div>
        </div>
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
                isActive
                  ? "border-cyan-300/60 bg-cyan-300/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{t.icon}</span>
                <span className={`mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive ? "border-transparent bg-cyan-300 text-slate-950" : "border-white/15 bg-transparent"
                }`}>
                  {isActive && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{t.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/8 px-4 py-3 text-xs text-zinc-300">
        ⚡ GigShield uses these signals plus your rider persona, city, and work pattern to determine weekly pricing and automatic payouts.
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

