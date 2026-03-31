import { useState } from "react";
import { validateAge, validateCity, validateFullName } from "../../utils/validation";

export default function StepProfile({ formData, updateField, onNext }) {
  const [touched, setTouched] = useState({ fullName: false, city: false, age: false });

  const valid = {
    fullName: validateFullName(formData.fullName),
    city: validateCity(formData.city),
    age: validateAge(formData.age),
  };
  const canProceed = valid.fullName && valid.city && valid.age;

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 3 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Tell us about you</h2>
        <p className="mt-2 text-coal-500 text-sm">Basic details to personalise your protection</p>
      </div>

      <div className="board-soft p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-coal-700 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => { updateField("fullName", e.target.value); touch("fullName"); }}
            onBlur={() => touch("fullName")}
            placeholder="Your full name"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-coal-900 outline-none transition focus:ring-2 focus:ring-electric-500 ${
              touched.fullName && !valid.fullName ? "border-red-400 bg-red-50" : "border-coal-300 bg-white"
            }`}
          />
          {touched.fullName && !valid.fullName && (
            <p className="text-red-500 text-xs mt-1">Please enter your full name</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-coal-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => { updateField("city", e.target.value); touch("city"); }}
              onBlur={() => touch("city")}
              placeholder="Mumbai"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-coal-900 outline-none transition focus:ring-2 focus:ring-electric-500 ${
                touched.city && !valid.city ? "border-red-400 bg-red-50" : "border-coal-300 bg-white"
              }`}
            />
            {touched.city && !valid.city && (
              <p className="text-red-500 text-xs mt-1">Required</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-coal-700 mb-1">Age</label>
            <input
              type="number"
              inputMode="numeric"
              value={formData.age}
              onChange={(e) => { updateField("age", e.target.value); touch("age"); }}
              onBlur={() => touch("age")}
              placeholder="25"
              min={18}
              max={65}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-coal-900 outline-none transition focus:ring-2 focus:ring-electric-500 ${
                touched.age && !valid.age ? "border-red-400 bg-red-50" : "border-coal-300 bg-white"
              }`}
            />
            {touched.age && !valid.age && (
              <p className="text-red-500 text-xs mt-1">Must be 18–65</p>
            )}
          </div>
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
