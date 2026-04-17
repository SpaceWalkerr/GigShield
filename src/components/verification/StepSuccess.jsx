import { useNavigate } from "react-router-dom";
import planDetails from "../../data/planDetails.json";
import { formatCurrency } from "../../utils/format";
import { getPersonaRiskProfile } from "../../utils/onboardingProfile";

export default function StepSuccess({ formData }) {
  const navigate = useNavigate();
  const profile = getPersonaRiskProfile(formData);
  const selectedPlan = planDetails.find((plan) => plan.id === formData.selectedPlanId) ?? planDetails[1];
  const triggerLabels = {
    heavy_rain: "Heavy Rain 🌧️",
    heatwave: "Heatwave 🌡️",
    aqi_spike: "AQI Spike 💨",
    platform_outage: "Platform Outage 📵",
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center py-4">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-400/20 bg-emerald-500/10">
          <svg className="h-12 w-12 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="absolute -inset-2 animate-ping rounded-full border-2 border-emerald-300/20 opacity-30" />
      </div>

      <div>
        <p className="kicker mb-2">Protection Active</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight text-emerald-200">You're protected</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-zinc-400">
          Your GigShield profile is now active. You'll be eligible for automatic payouts when covered disruptions occur.
        </p>
      </div>

      <div className="board-soft w-full p-5 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="kicker">Rider</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{formData.fullName || "Rider"}</p>
          </div>
          <div className="text-right">
            <p className="kicker">Platform</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-white">{formData.platform || "—"}</p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="kicker">Weekly Plan</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{selectedPlan.name}</p>
            </div>
            <div className="text-right">
              <p className="kicker">AI Risk</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{profile.riskLevel} ({profile.score}/100)</p>
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weekly Price</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(selectedPlan.weeklyPremium)} base weekly price</p>
          </div>
          <p className="kicker mb-2">Active Triggers</p>
          <div className="flex flex-wrap gap-2">
            {(formData.coverageTriggers || []).map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-200">
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

      <p className="text-xs text-zinc-500">
        GigShield will monitor conditions in real-time and notify you of any payouts.
      </p>
    </div>
  );
}

