import { useNavigate } from "react-router-dom";

/*
 * Public-facing entry page for the hackathon demo.
 * It explains the parametric insurance concept and routes users to the worker dashboard.
 */
function LandingPage() {
  const navigate = useNavigate();
  const navItems = ["Product", "Triggers", "Fraud Guard", "Pricing"];

  return (
    <main className="frame-shell flex min-h-screen items-center py-6 sm:py-8">
      <section className="board animate-enter w-full overflow-hidden">
        <div className="top-strip">
          Heavy rain, heatwave, AQI spike, or outage: GigShield pays by trigger,
          not paperwork.
        </div>

        <header className="flex items-center justify-between border-b border-coal-200 px-4 py-4 sm:px-6">
          <div className="bg-coal-900 px-3 py-1">
            <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
              GIGSHIELD.
            </p>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-medium text-coal-500 lg:flex">
            {navItems.map((item) =>
              item === "Pricing" ? (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="underline-offset-4 transition hover:text-coal-900 hover:underline"
                >
                  {item}
                </button>
              ) : (
                <span key={item}>{item}</span>
              ),
            )}
          </nav>

          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="primary-btn"
          >
            Get Protected
          </button>
        </header>

        <div className="px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:pb-10">
          <p className="kicker">Parametric Income Insurance</p>
          <h1 className="hero-title mt-4 max-w-5xl text-[3rem] leading-[0.9] sm:text-[4.4rem] lg:text-[5.7rem]">
            Protect income.
            <br />
            <span className="inline-block bg-electric-500 px-3 py-0.5 text-white">
              Ride
            </span>{" "}
            through every disruption.
          </h1>
          <p className="mt-5 max-w-3xl text-base text-coal-500 sm:text-lg">
            GigShield protects delivery workers across Zomato and Swiggy with
            automatic payouts triggered by environmental and platform events.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="primary-btn"
            >
              Get Protected
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
              onClick={() => navigate("/dashboard")}
              className="secondary-btn"
            >
              See Live Dashboard
            </button>
          </div>

          <div className="mt-9 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <article className="board-soft p-4">
              <p className="kicker">Trigger Engine</p>
              <p className="mt-2 font-semibold text-coal-900">
                Heavy Rain, Heatwave, AQI Spike, Outage
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Decisioning</p>
              <p className="mt-2 font-semibold text-coal-900">
                AI signal fusion and payout thresholds
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Fraud Control</p>
              <p className="mt-2 font-semibold text-coal-900">
                Risk scoring with verification gates
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">Demo Promise</p>
              <p className="mt-2 font-semibold text-coal-900">
                End-to-end flow in under 2 minutes
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
