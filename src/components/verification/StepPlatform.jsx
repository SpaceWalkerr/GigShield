import { useState } from "react";
import { validateRiderId } from "../../utils/validation";

const platforms = [
  { id: "swiggy", label: "Swiggy", emoji: "🧡" },
  { id: "zomato", label: "Zomato", emoji: "❤️" },
  { id: "both", label: "Both", emoji: "⚡" },
];

const vehicles = ["Bike", "Scooter", "Cycle", "EV"];

export default function StepPlatform({ formData, updateField, onNext }) {
  const [touched, setTouched] = useState(false);
  const canProceed = formData.platform && validateRiderId(formData.riderId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 2 of 4</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Confirm your delivery platform</h2>
        <p className="mt-2 text-sm text-zinc-400">This helps us activate your rider protection</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-200">Select Platform</p>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateField("platform", p.id)}
              className={`relative rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                formData.platform === p.id
                  ? "border-cyan-300/60 bg-cyan-300/10 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.15)] scale-[1.03]"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <span className="block text-2xl mb-1">{p.emoji}</span>
              <span className={`text-sm font-semibold ${formData.platform === p.id ? "text-white" : "text-zinc-300"}`}>
                {p.label}
              </span>
              {formData.platform === p.id && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="board-soft p-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-200">Rider / Delivery Partner ID</label>
          <input
            type="text"
            value={formData.riderId}
            onChange={(e) => { updateField("riderId", e.target.value); setTouched(true); }}
            placeholder="e.g. SW-1234567 or ZOM-89012"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-300/40 ${
              touched && !validateRiderId(formData.riderId)
                ? "border-red-400/70 bg-red-500/10"
                : "border-white/10 bg-white/[0.04] focus:border-cyan-300/50"
            }`}
          />
          {touched && !validateRiderId(formData.riderId) && (
            <p className="mt-1 text-xs text-red-300">Please enter your Rider ID</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-200">Vehicle Type <span className="font-normal text-zinc-500">(optional)</span></label>
          <select
            value={formData.vehicleType}
            onChange={(e) => updateField("vehicleType", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/40"
          >
            <option value="">Select vehicle type</option>
            {vehicles.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={!canProceed}
        onClick={onNext}
        className="primary-btn w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}

