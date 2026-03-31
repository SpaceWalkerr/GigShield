import { useState } from "react";
import { validateRiderId } from "../../utils/validation";

const platforms = [
  { id: "swiggy", label: "Swiggy", emoji: "🧡", color: "from-orange-50 to-orange-100 border-orange-200", activeColor: "from-orange-500 to-orange-600" },
  { id: "zomato", label: "Zomato", emoji: "❤️", color: "from-red-50 to-red-100 border-red-200", activeColor: "from-red-500 to-red-600" },
  { id: "both", label: "Both", emoji: "⚡", color: "from-electric-50 to-electric-100 border-electric-200", activeColor: "from-electric-500 to-electric-600" },
];

const vehicles = ["Bike", "Scooter", "Cycle", "EV"];

export default function StepPlatform({ formData, updateField, onNext }) {
  const [touched, setTouched] = useState(false);
  const canProceed = formData.platform && validateRiderId(formData.riderId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 4 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Confirm your delivery platform</h2>
        <p className="mt-2 text-coal-500 text-sm">This helps us activate your rider protection</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-coal-700">Select Platform</p>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateField("platform", p.id)}
              className={`relative rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                formData.platform === p.id
                  ? "border-coal-900 bg-coal-900 text-white shadow-chip scale-[1.03]"
                  : "border-coal-200 bg-white text-coal-700 hover:border-coal-400 hover:shadow-chip"
              }`}
            >
              <span className="block text-2xl mb-1">{p.emoji}</span>
              <span className={`text-sm font-semibold ${formData.platform === p.id ? "text-white" : "text-coal-700"}`}>
                {p.label}
              </span>
              {formData.platform === p.id && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
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
          <label className="block text-sm font-semibold text-coal-700 mb-1">Rider / Delivery Partner ID</label>
          <input
            type="text"
            value={formData.riderId}
            onChange={(e) => { updateField("riderId", e.target.value); setTouched(true); }}
            placeholder="e.g. SW-1234567 or ZOM-89012"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-coal-900 outline-none transition focus:ring-2 focus:ring-electric-500 ${
              touched && !validateRiderId(formData.riderId) ? "border-red-400 bg-red-50" : "border-coal-300 bg-white"
            }`}
          />
          {touched && !validateRiderId(formData.riderId) && (
            <p className="text-red-500 text-xs mt-1">Please enter your Rider ID</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-coal-700 mb-1">Vehicle Type <span className="text-coal-400 font-normal">(optional)</span></label>
          <select
            value={formData.vehicleType}
            onChange={(e) => updateField("vehicleType", e.target.value)}
            className="w-full rounded-xl border border-coal-300 bg-white px-4 py-2.5 text-sm text-coal-900 outline-none transition focus:ring-2 focus:ring-electric-500"
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
