import { Link } from "react-router-dom";
import { TOTAL_STEPS, useVerificationFlow } from "../hooks/useVerificationFlow";
import StepCoverage from "../components/verification/StepCoverage";
import StepOtp from "../components/verification/StepOtp";
import StepPhone from "../components/verification/StepPhone";
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
    resendTimer,
    updateField,
    sendOtp,
    resendOtp,
    verifyOtp,
    nextStep,
    prevStep,
    completeFlow,
  } = useVerificationFlow();

  const handleVerifyOtp = async (otp) => {
    const ok = await verifyOtp(otp);
    if (ok) nextStep();
    return ok;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepPhone
            formData={formData}
            updateField={updateField}
            onSubmit={sendOtp}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <StepOtp
            formData={formData}
            updateField={updateField}
            phone={formData.phone}
            onVerify={handleVerifyOtp}
            onResend={resendOtp}
            resendTimer={resendTimer}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <StepProfile
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <StepPlatform
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 5:
        return (
          <StepRiderProof
            formData={formData}
            updateField={updateField}
            onNext={nextStep}
          />
        );
      case 6:
        return (
          <StepCoverage
            formData={formData}
            updateField={updateField}
            onActivate={completeFlow}
            isLoading={isLoading}
          />
        );
      case 7:
        return <StepSuccess formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <main className="frame-shell flex min-h-screen items-center py-6 sm:py-10">
      <section className="board animate-enter w-full overflow-hidden">
        {/* Top strip */}
        <div className="top-strip">
          AI-powered protection for every ride — activate in minutes
        </div>

        {/* Header */}
        <header className="flex items-center justify-between border-b border-coal-200 px-4 py-4 sm:px-6">
          <div className="bg-coal-900 px-3 py-1">
            <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
              GIGSHIELD.
            </p>
          </div>
          <Link to="/" className="secondary-btn text-xs px-3 py-2">
            ← Back
          </Link>
        </header>

        <div className="grid lg:grid-cols-5 min-h-[560px]">
          {/* Left sidebar – value props */}
          <aside className="hidden lg:flex flex-col justify-between border-r border-coal-200 bg-coal-50 px-6 py-8 lg:col-span-2">
            <div>
              <p className="kicker mb-3">Why GigShield?</p>
              <div className="space-y-4">
                {[
                  { icon: "🌧️", title: "Weather Protection", desc: "Rain, heatwaves and AQI spikes trigger instant payouts" },
                  { icon: "📵", title: "Outage Coverage", desc: "Platform downtime means lost income — we cover it" },
                  { icon: "⚡", title: "Instant Activation", desc: "Takes under 3 minutes. No paperwork. No hassle." },
                  { icon: "🤖", title: "AI-Powered Engine", desc: "Smart signals drive fair, automatic compensation" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-coal-900">{item.title}</p>
                      <p className="text-xs text-coal-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="board p-4 mt-6">
              <p className="kicker mb-2">Trusted by riders on</p>
              <div className="flex gap-3">
                <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1">🧡 Swiggy</span>
                <span className="rounded-full bg-red-100 text-red-700 text-xs font-bold px-3 py-1">❤️ Zomato</span>
              </div>
            </div>
          </aside>

          {/* Right – form area */}
          <div className="flex flex-col px-4 py-6 sm:px-6 sm:py-8 lg:col-span-3">
            {step < 7 && (
              <div className="mb-8">
                <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
              </div>
            )}

            {/* Back button within flow */}
            {step > 1 && step < 7 && (
              <button
                type="button"
                onClick={prevStep}
                className="mb-4 text-xs text-coal-400 hover:text-coal-700 transition flex items-center gap-1 self-start"
              >
                ← Go back
              </button>
            )}

            <div
              key={step}
              className="animate-enter flex-1"
            >
              {renderStep()}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default GetProtected;
