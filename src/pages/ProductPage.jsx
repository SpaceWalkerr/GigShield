import { useNavigate } from "react-router-dom";

const protectionSituations = [
  {
    trigger: "Heavy Rain",
    issue: "Orders drop and riders lose active earning hours",
    response: "GigShield detects the rain trigger and releases payout automatically.",
  },
  {
    trigger: "Heatwave",
    issue: "Unsafe working conditions reduce delivery efficiency",
    response: "Riders receive support payout so income loss is reduced.",
  },
  {
    trigger: "AQI Spike",
    issue: "Pollution risk forces shorter shifts or slow movement",
    response: "Trigger payout protects daily earning consistency.",
  },
  {
    trigger: "Platform Outage",
    issue: "Order flow stops even when riders are ready to work",
    response: "Outage trigger starts payout without claim paperwork.",
  },
];

const featureHighlights = [
  {
    title: "Automatic Trigger Payouts",
    detail: "No manual claim process. If trigger conditions match, payout is calculated instantly.",
  },
  {
    title: "Plan-Based Protection",
    detail: "Basic, Standard, and Pro plans define payout amount, coverage window, and daily cap.",
  },
  {
    title: "Fraud Guard Layer",
    detail: "Risk scoring detects suspicious behavior and can require verification before payout.",
  },
  {
    title: "Selfie Verification Gate",
    detail: "High-risk sessions are verified through a random selfie gesture challenge.",
  },
  {
    title: "Transparent Dashboard",
    detail: "Workers can see payouts, active plan, risk state, and premium history in one place.",
  },
  {
    title: "Fast Demo-to-Real Flow",
    detail: "The same dashboard flow demonstrates practical worker protection decisions end to end.",
  },
];

function ProductPage() {
  const navigate = useNavigate();

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          GigShield protects delivery income during disruption events through trigger-based payouts.
        </div>

        <header className="border-b border-coal-200 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-coal-900 px-3 py-1">
              <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
                GIGSHIELD.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="secondary-btn"
              >
                Back to Landing
              </button>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="secondary-btn"
              >
                View Pricing
              </button>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="primary-btn"
              >
                Get Protected
              </button>
            </div>
          </div>

          <p className="kicker mt-6">Product Overview</p>
          <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl lg:text-6xl">
            How GigShield works
            <br />
            for delivery workers.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-coal-600 sm:text-lg">
            GigShield is built to protect gig worker earnings when real-world events
            interrupt normal delivery flow. It does this by watching verified
            triggers and releasing support payout quickly, with fraud controls to
            keep the system fair.
          </p>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">How To Use</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">Step 1</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">Choose your plan</p>
                <p className="mt-1 text-sm text-coal-600">Select Basic, Standard, or Pro based on your work hours and risk coverage needs.</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">Step 2</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">Keep coverage active</p>
                <p className="mt-1 text-sm text-coal-600">When coverage is active, trigger events are evaluated for payout eligibility.</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">Step 3</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">Trigger event occurs</p>
                <p className="mt-1 text-sm text-coal-600">Rain, heat, AQI, or outage triggers are checked against your plan and daily cap.</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">Step 4</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">Receive payout</p>
                <p className="mt-1 text-sm text-coal-600">If rules match, payout is applied instantly. High-risk sessions may require selfie verification.</p>
              </article>
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Key Features</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map((feature) => (
                <article key={feature.title} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{feature.title}</p>
                  <p className="mt-1 text-sm text-coal-600">{feature.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Protection In Real Situations</p>
            <div className="mt-3 grid gap-3">
              {protectionSituations.map((situation) => (
                <article key={situation.trigger} className="rounded-lg border border-coal-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-coal-900">{situation.trigger}</p>
                    <span className="rounded-full bg-coal-100 px-3 py-1 text-xs font-semibold text-coal-700">
                      Worker protection event
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-coal-600">
                    <strong className="text-coal-900">Situation:</strong> {situation.issue}
                  </p>
                  <p className="mt-1 text-sm text-coal-600">
                    <strong className="text-coal-900">GigShield response:</strong> {situation.response}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Why It Helps Workers</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">Less income shock on bad weather or outage days</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">No complex paperwork for every event</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">Fast visibility of payout decisions and history</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">Fraud controls keep honest worker payouts sustainable</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ProductPage;
