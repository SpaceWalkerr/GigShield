import { Link } from "react-router-dom";
import triggerEvents from "../data/triggerEvents.json";
import { formatCurrency } from "../utils/format";

const triggerSources = [
  {
    name: "Weather signals",
    detail: "Heavy rain and heatwave alerts from external weather feeds.",
  },
  {
    name: "Air quality signals",
    detail: "AQI spike conditions that reduce safe outdoor work.",
  },
  {
    name: "Platform status",
    detail: "Outage or downtime events that stop order flow.",
  },
];

const payoutRules = [
  "Trigger must be valid for selected plan",
  "Coverage time window must be active",
  "Daily payout cap must have remaining balance",
  "If risk is high, selfie verification may be required",
];

function TriggerPage() {
  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          Triggers power automatic payout decisions so workers get support during real disruptions.
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">Trigger System</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                How trigger payouts
                <br />
                work in GigShield.
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-coal-500 sm:text-base">
                A trigger is a verified disruption event. When one happens, GigShield checks
                plan rules and risk controls, then applies payout instantly if conditions match.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="secondary-btn">Back to Landing</Link>
              <Link to="/product" className="secondary-btn">Product</Link>
              <Link to="/pricing" className="secondary-btn">Pricing</Link>
              <Link to="/auth" className="primary-btn">Get Protected</Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Where Triggers Come From</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {triggerSources.map((source) => (
                <article key={source.name} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{source.name}</p>
                  <p className="mt-1 text-sm text-coal-600">{source.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Available Trigger Events</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-coal-200 text-coal-600">
                    <th className="py-2 pr-3 font-semibold">Trigger</th>
                    <th className="py-2 pr-3 font-semibold">Basic</th>
                    <th className="py-2 pr-3 font-semibold">Standard</th>
                    <th className="py-2 pr-3 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerEvents.map((event) => (
                    <tr key={event.id} className="border-b border-coal-100">
                      <td className="py-2 pr-3 font-semibold text-coal-900">{event.label}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.basic)}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.standard)}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.pro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Payout Decision Rules</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              {payoutRules.map((rule) => (
                <li key={rule} className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Try Trigger Demo</p>
            <p className="mt-2 text-sm text-coal-600">
              Open dashboard with a preselected trigger event to test the live payout flow instantly.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {triggerEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/dashboard?plan=standard&trigger=${event.id}`}
                  className="rounded-lg border border-coal-200 bg-white px-3 py-2 text-sm font-semibold text-coal-900 transition hover:bg-coal-100"
                >
                  Run {event.label} Demo
                </Link>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">Worker Protection Outcome</p>
            <p className="mt-2 text-sm text-coal-700">
              Instead of waiting for manual claim approvals, workers receive support when
              disruption events are verified. This reduces income shock, keeps payout logic
              transparent, and uses fraud checks so honest workers are protected consistently.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

export default TriggerPage;
