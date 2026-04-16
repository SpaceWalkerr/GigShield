import { Link } from "react-router-dom";
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

      <div className="mx-auto max-w-6xl py-12 sm:py-20">
        <header className="mb-12">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
            Secure Your Income
          </p>
          <h1 className="mb-4 text-4xl font-black leading-none tracking-tighter sm:text-6xl">
            Activate Protection
          </h1>
          <p className="max-w-2xl text-sm font-bold text-zinc-400">
            Setup your weekly parametric income protection profile in under 3 minutes.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <SurfaceCard className="h-fit">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">What happens here</p>
            <div className="mt-6 space-y-6">
              {[
                ["Persona fit", "Tell us your city, work pattern, and weekly earnings profile."],
                ["Risk score", "We estimate disruption exposure and suggest the right weekly plan."],
                ["Trigger setup", "Choose rain, heat, AQI, and outage coverage preferences."],
                ["Instant activation", "Your weekly parametric protection starts once verified."],
              ].map(([label, desc], index) => (
                <div key={label} className="flex gap-4">
                  <div className="flex size-8 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-zinc-950">{index + 1}</div>
                  <div>
                    <p className="font-semibold text-white">{label}</p>
                    <p className="mt-1 text-sm leading-7 text-zinc-300">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-10">
            {step < 7 && (
              <div className="mb-8">
                <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
              </div>
            )}

            {step > 1 && step < 7 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition hover:text-white"
              >
                ← Previous Step
              </button>
            )}

            <div key={step} className="animate-enter">
              {renderStep()}
            </div>

            {step < 7 && (
              <footer className="mt-8 border-t border-white/8 pt-8">
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { label: "Instant Trigger", desc: "Rain, heat, AQI, and outage events" },
                    { label: "Weekly Cover", desc: "Built around gig worker payout cycles" }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                      <p className="text-xs font-bold text-zinc-300">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </footer>
            )}
          </SurfaceCard>
        </div>
      </div>
    </main>
  );
}

export default GetProtected;
