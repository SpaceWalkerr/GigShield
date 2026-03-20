import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import {
  calculateWeeklyPremium,
  supportedRiskLevels,
} from "../utils/pricing";
import { saveSession } from "../utils/session";
import { supabase } from "../utils/supabase";

const platformOptions = ["Zomato", "Swiggy", "Blinkit", "Zepto", "Uber"];
const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const validPlanIds = new Set(planDetails.map((plan) => plan.id));

function createPremiumHistoryEntry({ reason, breakdown }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reason,
    changedAt: new Date().toISOString(),
    premium: breakdown.adjustedPremium,
    platformCount: breakdown.platformCount,
    riskLevel: breakdown.riskLevel,
    basePremium: breakdown.basePremium,
    platformLoadFee: breakdown.platformLoadFee,
    riskMultiplier: breakdown.riskMultiplier,
  };
}

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlanId = searchParams.get("plan");
  const requestedRiskLevel = searchParams.get("risk");
  const requestedPlatformCount = Number(searchParams.get("platforms") || "0");
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const selectedPlanId =
    (requestedPlanId && validPlanIds.has(requestedPlanId) && requestedPlanId) ||
    (persistedPlanId && validPlanIds.has(persistedPlanId) && persistedPlanId) ||
    userProfile.selectedPlanId;
  const [mode, setMode] = useState("signin");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => {
    if (requestedPlatformCount >= 1) {
      return platformOptions.slice(0, Math.min(platformOptions.length, requestedPlatformCount));
    }
    return ["Zomato", "Swiggy"];
  });
  const [riskLevel, setRiskLevel] = useState(
    supportedRiskLevels.includes(requestedRiskLevel) ? requestedRiskLevel : "Medium",
  );
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    workerId: "",
  });
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitLabel = useMemo(
    () => (mode === "signin" ? "Sign In to GigShield" : "Create GigShield Account"),
    [mode],
  );
  const selectedPlan =
    planDetails.find((plan) => plan.id === selectedPlanId) ?? planDetails[0];
  const premiumBreakdown = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: selectedPlatforms.length,
    riskLevel,
  });
  const [premiumHistory, setPremiumHistory] = useState(() => [
    createPremiumHistoryEntry({
      reason: "Initial premium setup",
      breakdown: premiumBreakdown,
    }),
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((current) => {
      const nextPlatforms = current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform];
      const nextBreakdown = calculateWeeklyPremium({
        basePremium: selectedPlan.weeklyPremium,
        platformCount: nextPlatforms.length,
        riskLevel,
      });
      setPremiumHistory((entries) => [
        createPremiumHistoryEntry({
          reason: `Platform ${current.includes(platform) ? "removed" : "added"}: ${platform}`,
          breakdown: nextBreakdown,
        }),
        ...entries,
      ].slice(0, 10));
      return nextPlatforms;
    });
  };

  const handleRiskChange = (level) => {
    if (level === riskLevel) {
      return;
    }
    const nextBreakdown = calculateWeeklyPremium({
      basePremium: selectedPlan.weeklyPremium,
      platformCount: selectedPlatforms.length,
      riskLevel: level,
    });
    setRiskLevel(level);
    setPremiumHistory((entries) => [
      createPremiumHistoryEntry({
        reason: `Risk level changed to ${level}`,
        breakdown: nextBreakdown,
      }),
      ...entries,
    ].slice(0, 10));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const fullNameValue = formValues.fullName.trim();
    const cityValue = formValues.city.trim();
    const emailValue = formValues.email.trim();
    const workerIdValue = formValues.workerId.trim();

    try {
      if (mode === "signup") {
        if (formValues.password !== formValues.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: emailValue,
          password: formValues.password,
          options: {
            data: {
              full_name: fullNameValue,
              city: cityValue,
              worker_id: workerIdValue,
            }
          }
        });
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: formValues.password
        });
        if (error) throw error;
      }

      saveSession({
        isAuthenticated: true,
        mode,
        name: fullNameValue || userProfile.name,
        email: emailValue,
        city: cityValue || userProfile.city,
        workerId: workerIdValue,
        platforms: selectedPlatforms,
        selectedPlanId,
        riskLevel,
        calculatedWeeklyPremium: premiumBreakdown.adjustedPremium,
        premiumBreakdown,
        premiumHistory,
        signedInAt: new Date().toISOString(),
      });

      localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
      navigate(`/dashboard?plan=${selectedPlanId}`);
    } catch (err) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="frame-shell flex min-h-screen items-center py-6 sm:py-8">
      <section className="board animate-enter w-full overflow-hidden">
        <div className="top-strip">
          Link your delivery platforms once and switch between protected accounts instantly.
        </div>

        <header className="flex items-center justify-between border-b border-coal-200 px-4 py-4 sm:px-6">
          <div className="bg-coal-900 px-3 py-1">
            <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
              GIGSHIELD.
            </p>
          </div>
          <Link to="/" className="secondary-btn">
            Back to Landing
          </Link>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6 lg:grid-cols-5 lg:gap-6">
          <article className="board-soft p-4 lg:col-span-2">
            <p className="kicker">Unified Access</p>
            <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
              Sign in once.
              <br />
              Protect all gigs.
            </h1>
            <p className="mt-4 text-sm text-coal-600">
              Use one GigShield account to manage workers who operate on multiple platforms like
              Zomato, Swiggy, and Blinkit.
            </p>

            <div className="mt-6 space-y-2">
              {platformOptions.map((platform) => {
                const selected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-coal-900 bg-coal-900 text-white"
                        : "border-coal-200 bg-white text-coal-700 hover:bg-coal-100"
                    }`}
                  >
                    <span>{platform}</span>
                    <span className="text-xs uppercase tracking-[0.15em]">
                      {selected ? "Linked" : "Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          <section className="board-soft p-4 sm:p-5 lg:col-span-3">
            <div className="mb-4 inline-flex rounded-full border border-coal-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-coal-900 text-white"
                    : "text-coal-600 hover:bg-coal-100"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-coal-900 text-white"
                    : "text-coal-600 hover:bg-coal-100"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {authError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {authError}
                </div>
              )}
              <div className="board p-4">
                <p className="kicker">Dynamic Premium</p>
                <p className="mt-2 text-2xl font-bold text-coal-900">
                  {formatCurrency(premiumBreakdown.adjustedPremium)} / week
                </p>
                <p className="mt-1 text-xs text-coal-600">
                  Base {formatCurrency(premiumBreakdown.basePremium)} + platform load{" "}
                  {formatCurrency(premiumBreakdown.platformLoadFee)}, risk x
                  {premiumBreakdown.riskMultiplier.toFixed(2)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {supportedRiskLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleRiskChange(level)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        riskLevel === level
                          ? "bg-coal-900 text-white"
                          : "border border-coal-300 bg-white text-coal-700 hover:bg-coal-100"
                      }`}
                    >
                      {level} risk
                    </button>
                  ))}
                </div>
              </div>

              {mode === "signup" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-coal-700">
                    Full Name
                    <input
                      name="fullName"
                      value={formValues.fullName}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                      placeholder="Rider full name"
                    />
                  </label>
                  <label className="text-sm font-medium text-coal-700">
                    City
                    <input
                      name="city"
                      value={formValues.city}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                      placeholder="Mumbai"
                    />
                  </label>
                </div>
              ) : null}

              <label className="block text-sm font-medium text-coal-700">
                Email
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm font-medium text-coal-700">
                Worker ID
                <input
                  name="workerId"
                  value={formValues.workerId}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                  placeholder="Platform rider ID"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-coal-700">
                  Password
                  <input
                    type="password"
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                    placeholder="••••••••"
                  />
                </label>

                {mode === "signup" ? (
                  <label className="text-sm font-medium text-coal-700">
                    Confirm Password
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formValues.confirmPassword}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                      placeholder="••••••••"
                    />
                  </label>
                ) : null}
              </div>

              <div className="board mt-2 p-4">
                <p className="kicker">Selected Plan</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlan.name} | {selectedPlan.coverageHours}
                </p>
                <p className="kicker">Linked Platforms</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlatforms.length > 0
                    ? selectedPlatforms.join(", ")
                    : "Select at least one platform account"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="submit" className="primary-btn" disabled={selectedPlatforms.length === 0 || isLoading}>
                  {isLoading ? "Please wait..." : submitLabel}
                </button>
                <Link
                  to={`/dashboard?plan=${selectedPlanId}`}
                  onClick={() => {
                    saveSession({
                      isAuthenticated: true,
                      mode: "demo",
                      name: userProfile.name,
                      email: "demo@gigshield.app",
                      city: userProfile.city,
                      workerId: "demo-worker",
                      platforms: selectedPlatforms,
                      selectedPlanId,
                      riskLevel,
                      calculatedWeeklyPremium: premiumBreakdown.adjustedPremium,
                      premiumBreakdown,
                      premiumHistory,
                      signedInAt: new Date().toISOString(),
                    });
                    localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
                  }}
                  className="secondary-btn"
                >
                  Continue as Demo User
                </Link>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;