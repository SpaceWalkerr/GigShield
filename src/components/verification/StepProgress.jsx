const STEP_LABELS = [
  "Phone",
  "OTP",
  "Profile",
  "Platform",
  "Proof",
  "Coverage",
  "Done",
];

export default function StepProgress({ currentStep, totalSteps }) {
  return (
    <div className="w-full">
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-300 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-cyan-300 text-slate-950"
                    : isCurrent
                    ? "bg-cyan-300 text-slate-950 ring-4 ring-cyan-300/20"
                    : "bg-white/10 text-zinc-500 border border-white/10"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`hidden sm:block text-[10px] font-semibold transition-colors ${
                  isCurrent ? "text-cyan-200" : isCompleted ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

