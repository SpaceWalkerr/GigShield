import { Link } from "react-router-dom";

const fraudSignals = [
  {
    name: "Behavior risk score",
    detail: "GigShield assigns a risk score from activity patterns and trigger behavior.",
  },
  {
    name: "Persona simulation",
    detail: "Dashboard can switch Normal and Suspicious personas for fraud testing.",
  },
  {
    name: "Verification gate",
    detail: "High-risk sessions are paused until selfie gesture verification is completed.",
  },
  {
    name: "Payout safety lock",
    detail: "Suspicious payout attempts are blocked with clear reason messages.",
  },
];

const protectionBenefits = [
  "Honest delivery workers receive faster and safer payouts",
  "Fraudulent claims are reduced without harming genuine workers",
  "Payout pool stays sustainable for long-term worker protection",
  "Every blocked or paid decision is transparent on the dashboard",
];

const guardSteps = [
  {
    step: "Step 1",
    title: "Monitor activity and triggers",
    detail: "System reads behavior patterns and event context continuously.",
  },
  {
    step: "Step 2",
    title: "Calculate risk level",
    detail: "Score maps to Low, Medium, or High risk state.",
  },
  {
    step: "Step 3",
    title: "Apply safety rule",
    detail: "Low/Medium risk can proceed; High risk requires selfie verification.",
  },
  {
    step: "Step 4",
    title: "Allow or block payout",
    detail: "Verified users continue, suspicious users are blocked until checks pass.",
  },
];

function FraudGuardPage() {
  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          Fraud Guard keeps payouts fast for genuine workers and blocked for suspicious behavior.
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">Fraud Protection Layer</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                How Fraud Guard
                <br />
                protects GigShield.
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-coal-500 sm:text-base">
                Fraud Guard is the trust layer in GigShield. It uses risk scoring,
                verification gates, and decision checks so payouts go to real delivery
                workers during real disruptions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="secondary-btn">Back to Landing</Link>
              <Link to="/product" className="secondary-btn">Product</Link>
              <Link to="/triggers" className="secondary-btn">Triggers</Link>
              <Link to="/auth" className="primary-btn">Get Protected</Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Fraud Guard Signals</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fraudSignals.map((signal) => (
                <article key={signal.name} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{signal.name}</p>
                  <p className="mt-1 text-sm text-coal-600">{signal.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Decision Flow</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {guardSteps.map((item) => (
                <article key={item.step} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{item.step}</p>
                  <p className="mt-1 text-base font-semibold text-coal-900">{item.title}</p>
                  <p className="mt-1 text-sm text-coal-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Why This Protects Delivery Workers</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              {protectionBenefits.map((benefit) => (
                <li key={benefit} className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Try Fraud Guard Demo</p>
            <p className="mt-2 text-sm text-coal-600">
              Use dashboard personas to test how Fraud Guard responds to safe and suspicious sessions.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/dashboard" className="secondary-btn">Open Dashboard</Link>
              <Link to="/dashboard?trigger=heavy-rain" className="secondary-btn">Open with Rain Trigger</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default FraudGuardPage;
