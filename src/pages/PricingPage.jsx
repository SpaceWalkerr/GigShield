import { Link } from "react-router-dom";
import { useState } from "react";
import planDetails from "../data/planDetails.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";

const planHighlights = {
  basic: ["Rain and AQI trigger payouts", "Daily payout cap: INR 300", "Email support"],
  standard: [
    "All weather and outage triggers",
    "Daily payout cap: INR 650",
    "Priority support",
  ],
  pro: [
    "24x7 trigger coverage",
    "Daily payout cap: INR 1,000",
    "Fast-track verification",
    "Dedicated claims concierge",
  ],
};

function PricingPage() {
  const [platformCount, setPlatformCount] = useState(2);
  const [riskLevel, setRiskLevel] = useState("Medium");

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          Transparent weekly pricing for multi-platform riders across Zomato, Swiggy, Blinkit, and more.
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker">Plans and Pricing</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                Pick your
                <br />
                protection level.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-coal-500 sm:text-base">
                Every plan includes parametric payouts for major disruptions. Scale coverage based on work hours,
                risk appetite, and number of linked platform accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="secondary-btn">
                Back to Landing
              </Link>
              <Link
                to={`/auth?plan=standard&risk=${riskLevel}&platforms=${platformCount}`}
                className="primary-btn"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6">
          <section className="board-soft mb-4 p-4">
            <p className="kicker">Premium Assumptions</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-coal-800">
                Linked platforms: {platformCount}
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={platformCount}
                  onChange={(event) => setPlatformCount(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-coal-800">Risk level</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {supportedRiskLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRiskLevel(level)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        riskLevel === level
                          ? "bg-coal-900 text-white"
                          : "border border-coal-300 bg-white text-coal-700 hover:bg-coal-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {planDetails.map((plan) => {
              const isRecommended = plan.id === "standard";
              const highlights = planHighlights[plan.id] ?? [];
              const premium = calculateWeeklyPremium({
                basePremium: plan.weeklyPremium,
                platformCount,
                riskLevel,
              });

              return (
                <article
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 shadow-edge ${
                    isRecommended
                      ? "border-electric-500 bg-electric-500 text-white"
                      : "border-coal-200 bg-white text-coal-900"
                  }`}
                >
                  {isRecommended ? (
                    <span className="absolute right-4 top-4 rounded-full bg-signal-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-coal-900">
                      Recommended
                    </span>
                  ) : null}

                  <p className={`kicker ${isRecommended ? "text-electric-100" : ""}`}>Weekly Plan</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">{plan.name}</h2>
                  <p className={`mt-4 text-sm ${isRecommended ? "text-electric-100" : "text-coal-500"}`}>
                    Premium
                  </p>
                  <p className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(premium.adjustedPremium)}
                  </p>
                  <p className={`mt-1 text-xs ${isRecommended ? "text-electric-100" : "text-coal-600"}`}>
                    Base {formatCurrency(premium.basePremium)} + platform load {formatCurrency(premium.platformLoadFee)}
                    , risk x{premium.riskMultiplier.toFixed(2)}
                  </p>
                  <p className={`mt-1 text-sm ${isRecommended ? "text-electric-100" : "text-coal-600"}`}>
                    Coverage window: {plan.coverageHours}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm">
                    {highlights.map((item) => (
                      <li
                        key={item}
                        className={`rounded-lg border px-3 py-2 ${
                          isRecommended
                            ? "border-electric-300/60 bg-electric-400/40"
                            : "border-coal-200 bg-coal-50"
                        }`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/auth?plan=${plan.id}&risk=${riskLevel}&platforms=${platformCount}`}
                    className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isRecommended
                        ? "bg-white text-coal-900 hover:bg-coal-100"
                        : "bg-coal-900 text-white hover:bg-coal-700"
                    }`}
                  >
                    Choose {plan.name}
                  </Link>
                </article>
              );
            })}
          </div>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="board-soft p-4">
              <p className="kicker">Billing</p>
              <p className="mt-2 font-semibold text-coal-900">Weekly, auto-renewable, cancel anytime</p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Trigger Types</p>
              <p className="mt-2 font-semibold text-coal-900">Rain, heatwave, AQI spike, and outage</p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Payout Speed</p>
              <p className="mt-2 font-semibold text-coal-900">Instant after trigger verification</p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Supported Platforms</p>
              <p className="mt-2 font-semibold text-coal-900">Zomato, Swiggy, Blinkit, Zepto, Uber</p>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}

export default PricingPage;
