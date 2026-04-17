import { useState } from "react";
import { getCityZones } from "../../utils/incomeRadar";
import { validateAge, validateCity, validateFullName } from "../../utils/validation";

const workPatterns = [
  { id: "full_time", label: "Full-time rider", desc: "Daily shifts across the week" },
  { id: "peak_hours", label: "Peak-hours rider", desc: "Lunch and dinner rush focus" },
  { id: "flexible", label: "Flexible rider", desc: "Mixed hours based on demand" },
  { id: "weekends", label: "Weekend-heavy rider", desc: "Mostly high-demand weekends" },
];

const weeklyEarningsBands = [
  { id: "under_6000", label: "Under ₹6,000 / week" },
  { id: "6000_10000", label: "₹6,000 - ₹10,000 / week" },
  { id: "10000_15000", label: "₹10,000 - ₹15,000 / week" },
  { id: "above_15000", label: "₹15,000+ / week" },
];

export default function StepProfile({ formData, updateField, onNext }) {
  const [touched, setTouched] = useState({ fullName: false, city: false, age: false });
  const suggestedZones = getCityZones(formData.city || "New Delhi");

  const valid = {
    fullName: validateFullName(formData.fullName),
    city: validateCity(formData.city),
    age: validateAge(formData.age),
  };
  const canProceed = valid.fullName && valid.city && valid.age;

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));
  const selectedZones = Array.isArray(formData.preferredZones) ? formData.preferredZones : [];

  const toggleZone = (zone) => {
    const exists = selectedZones.some((item) => item.id === zone.id);
    if (exists) {
      updateField(
        "preferredZones",
        selectedZones.filter((item) => item.id !== zone.id),
      );
      return;
    }

    const next = [...selectedZones, { id: zone.id, name: zone.name, corridor: zone.corridor }].slice(0, 2);
    updateField("preferredZones", next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 1 of 4</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Tell us about your delivery routine</h2>
        <p className="mt-2 text-sm text-zinc-400">We use this to personalise your weekly disruption risk profile</p>
      </div>

      <div className="board-soft p-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-200">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => { updateField("fullName", e.target.value); touch("fullName"); }}
            onBlur={() => touch("fullName")}
            placeholder="Your full name"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-300/40 ${
              touched.fullName && !valid.fullName
                ? "border-red-400/70 bg-red-500/10"
                : "border-white/10 bg-white/[0.04] focus:border-cyan-300/50"
            }`}
          />
          {touched.fullName && !valid.fullName && (
            <p className="mt-1 text-xs text-red-300">Please enter your full name</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-200">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => { updateField("city", e.target.value); touch("city"); }}
              onBlur={() => touch("city")}
              placeholder="Mumbai"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-300/40 ${
                touched.city && !valid.city
                  ? "border-red-400/70 bg-red-500/10"
                  : "border-white/10 bg-white/[0.04] focus:border-cyan-300/50"
              }`}
            />
            {touched.city && !valid.city && (
              <p className="mt-1 text-xs text-red-300">Required</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-200">Age</label>
            <input
              type="number"
              inputMode="numeric"
              value={formData.age}
              onChange={(e) => { updateField("age", e.target.value); touch("age"); }}
              onBlur={() => touch("age")}
              placeholder="25"
              min={18}
              max={65}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-300/40 ${
                touched.age && !valid.age
                  ? "border-red-400/70 bg-red-500/10"
                  : "border-white/10 bg-white/[0.04] focus:border-cyan-300/50"
              }`}
            />
            {touched.age && !valid.age && (
              <p className="mt-1 text-xs text-red-300">Must be 18–65</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-200">Work Pattern</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {workPatterns.map((pattern) => {
              const selected = formData.workPattern === pattern.id;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => updateField("workPattern", pattern.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-cyan-300/60 bg-cyan-300/10 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.15)]"
                      : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-sm font-semibold">{pattern.label}</p>
                  <p className={`mt-1 text-xs ${selected ? "text-cyan-100/75" : "text-zinc-500"}`}>{pattern.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-200">Typical Weekly Earnings</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {weeklyEarningsBands.map((band) => {
              const selected = formData.weeklyEarningsBand === band.id;
              return (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => updateField("weeklyEarningsBand", band.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {band.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-zinc-200">
              Preferred Work Zones
            </label>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Choose up to 2
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestedZones.map((zone) => {
              const selected = selectedZones.some((item) => item.id === zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => toggleZone(zone)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-sm font-semibold">{zone.name}</p>
                  <p className={`mt-1 text-xs ${selected ? "text-emerald-200/80" : "text-zinc-500"}`}>
                    {zone.corridor} · {zone.disruptionTag}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            GigShield uses these zones to decide whether a disruption should create protection for you automatically.
          </p>
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

