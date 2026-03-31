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
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-coal-100 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-coal-900 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Step dots */}
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
                    ? "bg-coal-900 text-white"
                    : isCurrent
                    ? "bg-coal-900 text-white ring-4 ring-coal-200"
                    : "bg-coal-100 text-coal-400"
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
                  isCurrent ? "text-coal-900" : isCompleted ? "text-coal-600" : "text-coal-300"
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
