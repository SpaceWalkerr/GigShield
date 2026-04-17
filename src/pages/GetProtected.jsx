import { TOTAL_STEPS, useVerificationFlow } from "../hooks/useVerificationFlow";
import StepCoverage from "../components/verification/StepCoverage";
import StepPlatform from "../components/verification/StepPlatform";
import StepProgress from "../components/verification/StepProgress";
import StepProfile from "../components/verification/StepProfile";
import StepRiderProof from "../components/verification/StepRiderProof";
import StepSuccess from "../components/verification/StepSuccess";
import { SurfaceCard } from "@/components/ui/marketing-page-shell";

function GetProtected() {
  const {
    step,
    formData,
    isLoading,
    updateField,
    nextStep,
    prevStep,
    completeFlow,
  } = useVerificationFlow();

  const helperItems = [
    ["Persona fit", "Tell us your city, work pattern, and weekly earnings profile."],
    ["Risk score", "We estimate disruption exposure and suggest the right weekly plan."],
    ["Trigger setup", "Choose rain, heat, AQI, and outage coverage preferences."],
    ["Instant activation", "Your weekly parametric protection starts once verified."],
  ];

  const reassuranceItems = [
    { label: "Weekly pricing", value: "Built for payout cycles" },
    { label: "Income-only cover", value: "No health or vehicle add-ons" },
    { label: "Time to complete", value: "Around 3 minutes" },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepProfile
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <StepPlatform
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <StepRiderProof
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <StepCoverage
            formData={formData}
            updateField={updateField}
            onActivate={completeFlow}
            isLoading={isLoading}
          />
        );
      case 5:
        return <StepSuccess formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] px-6 pb-24 pt-28 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14313b_0%,rgba(9,9,11,0.97)_40%,#09090b_75%)]" />
        <div className="absolute left-[-6%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="w-full py-10 sm:py-16">
        <header className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Secure Your Income
          </div>
          <h1 className="mb-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Activate Protection
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Set up your weekly parametric income protection profile in under 3 minutes, with pricing and triggers shaped around how delivery workers actually earn.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {reassuranceItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="grid items-start gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <SurfaceCard className="h-fit xl:sticky xl:top-28">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">What happens here</p>
            <div className="mt-5 space-y-5">
              {helperItems.map(([label, desc], index) => (
                <div key={label} className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-zinc-950">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/8 bg-slate-950/55 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                What this does not cover
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                GigShield only protects income loss from external disruptions. It does not cover health, life, accidents, or vehicle repairs.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden p-0">
            <div className="border-b border-white/8 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Activation Flow
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                    Weekly protection setup
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-zinc-400">
                    Move through the rider profile, platform verification, proof check, and weekly plan setup in one calm flow.
                  </p>
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                  Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}
                </div>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {step <= TOTAL_STEPS && (
                <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
              )}

              <div className="mt-8 flex min-h-[34rem] flex-col">
                {step > 1 && step <= TOTAL_STEPS && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="mb-6 flex w-fit items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition hover:text-white"
                  >
                    ← Previous Step
                  </button>
                )}

                <div key={step} className="animate-enter">
                  {renderStep()}
                </div>
              </div>

              {step <= TOTAL_STEPS && (
                <footer className="mt-8 grid gap-4 border-t border-white/8 pt-6 sm:grid-cols-2">
                  {[
                    { label: "Instant Trigger", desc: "Rain, heat, AQI, and outage events" },
                    { label: "Weekly Cover", desc: "Built around gig worker payout cycles" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {item.label}
                      </p>
                      <p className="text-xs font-bold leading-6 text-zinc-300">{item.desc}</p>
                    </div>
                  ))}
                </footer>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </main>
  );
}

export default GetProtected;

