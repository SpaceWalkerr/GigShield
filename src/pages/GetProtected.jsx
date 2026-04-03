import { Link } from "react-router-dom";
import { TOTAL_STEPS, useVerificationFlow } from "../hooks/useVerificationFlow";
import StepCoverage from "../components/verification/StepCoverage";
import StepPlatform from "../components/verification/StepPlatform";
import StepProgress from "../components/verification/StepProgress";
import StepProfile from "../components/verification/StepProfile";
import StepRiderProof from "../components/verification/StepRiderProof";
import StepSuccess from "../components/verification/StepSuccess";

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
    <main className="min-h-screen bg-[#f4f5f7] pb-24">


      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
        <header className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
            Secure Your Income
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-4">
            Activate Protection
          </h1>
          <p className="text-sm font-bold text-gray-500">
            Setup your parametric insurance profile in under 3 minutes.
          </p>
        </header>

        <div className="space-y-12">
          {step < 7 && (
            <div className="mb-8">
              <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
            </div>
          )}

          {step > 1 && step < 7 && (
            <button
              type="button"
              onClick={prevStep}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition flex items-center gap-2"
            >
              ← Previous Step
            </button>
          )}

          <div
            key={step}
            className="animate-enter"
          >
            {renderStep()}
          </div>
        </div>

        {step < 7 && (
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: "Instant Trigger", desc: "Rain, heat, and AQI spikes" },
                { label: "Automatic Payouts", desc: "No manual claims required" }
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                  <p className="text-xs font-bold text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

export default GetProtected;
