import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import {
  calculateWeeklyPremium,
  supportedRiskLevels,
} from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage";
import { saveSession } from "../utils/session";
import { supabase } from "../utils/supabase";

const platformOptions = ["Zomato", "Swiggy", "Blinkit", "Zepto"];
const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const validPlanIds = new Set(planDetails.map((plan) => plan.id));
const adminEmailAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

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
  const { languageMode, setLanguageMode } = useSiteLanguage();
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
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectedPlan = useMemo(() => planDetails.find((p) => p.id === selectedPlanId) ?? planDetails[0], [selectedPlanId]);
  const [premiumHistory, setPremiumHistory] = useState([]);
  const premiumBreakdown = useMemo(() => calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: selectedPlatforms.length,
    riskLevel,
  }), [selectedPlan, selectedPlatforms.length, riskLevel]);

  useEffect(() => {
    // AuthPage does not receive the OAuth callback anymore —
    // that is handled by /auth/callback (AuthCallbackPage).
    // This effect only handles the case where the user is already
    // signed in and lands on /auth directly.
    let handled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (handled || !session) return;
      handled = true;
      navigate(`/dashboard?plan=${selectedPlanId}`, { replace: true });
    });
  }, [navigate, selectedPlanId]);

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

  return (
    <main className="frame-shell flex min-h-screen items-center py-6 sm:py-8">
      <section className="board animate-enter w-full overflow-hidden rounded-3xl">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Link your delivery platforms once and switch between protected accounts instantly.",
            "अपने डिलीवरी प्लेटफॉर्म एक बार जोड़ें और सुरक्षित खातों के बीच तुरंत बदलें।",
          )}
        </div>

        <header className="flex items-center justify-between border-b border-coal-200 px-4 py-4 sm:px-6">
          <div className="bg-coal-900 px-3 py-1">
            <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
              GIGSHIELD.
            </p>
          </div>
          <LanguageToggle
            languageMode={languageMode}
            setLanguageMode={setLanguageMode}
          />
          <Link to="/" className="secondary-btn">
            {selectLabel(languageMode, "Back to Landing", "मुखपृष्ठ पर जाएं")}
          </Link>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6 lg:grid-cols-5 lg:gap-6">
          <article className="board-soft p-4 lg:col-span-2">
            <p className="kicker">{selectLabel(languageMode, "Unified Access", "एकीकृत एक्सेस")}</p>
            <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
              {selectLabel(languageMode, "Sign in once.", "एक बार साइन इन करें।")}
              <br />
              {selectLabel(languageMode, "Protect all gigs.", "सभी गिग्स सुरक्षित करें।")}
            </h1>
            <p className="mt-4 text-sm text-coal-600">
              {selectLabel(
                languageMode,
                "Use one GigShield account to manage workers who operate on multiple platforms like Zomato, Swiggy, and Blinkit.",
                "एक GigShield खाते से Zomato, Swiggy और Blinkit जैसे कई प्लेटफॉर्म पर काम करने वाले वर्कर्स को मैनेज करें।",
              )}
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
                      {selected
                        ? selectLabel(languageMode, "Linked", "जुड़ा")
                        : selectLabel(languageMode, "Add", "जोड़ें")}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          <section className="board-soft p-4 sm:p-5 lg:col-span-3">
            <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-white/80 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-coal-900 text-white"
                    : "text-coal-600 hover:bg-coal-100"
                }`}
              >
                {selectLabel(languageMode, "Sign In", "साइन इन")}
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
                {selectLabel(languageMode, "Sign Up", "साइन अप")}
              </button>
            </div>

            <div className="space-y-6">
              {/* Google Sign-In button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  setAuthError(null);
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlanId}`,
                        queryParams: { prompt: "select_account" },
                      },
                    });
                    if (error) throw error;
                  } catch (err) {
                    setAuthError(err.message || "Google sign-in failed.");
                    setIsLoading(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white disabled:opacity-50"
              >
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {mode === "signup"
                  ? selectLabel(languageMode, "Sign up with Google", "Google से साइन अप करें")
                  : selectLabel(languageMode, "Sign in with Google", "Google से साइन इन करें")}
              </button>

              {authError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {authError}
                </div>
              )}

              <div className="board p-4">
                <p className="kicker">{selectLabel(languageMode, "Dynamic Premium", "डायनेमिक प्रीमियम")}</p>
                <p className="mt-2 text-2xl font-bold text-coal-900">
                  {formatCurrency(premiumBreakdown.adjustedPremium)} / week
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
                      {selectLabel(languageMode, `${level} risk`, `${level} जोखिम`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="board p-4">
                <p className="kicker">{selectLabel(languageMode, "Selected Plan", "चयनित योजना")}</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlan.name} | {selectedPlan.coverageHours}
                </p>
                <p className="kicker mt-4">{selectLabel(languageMode, "Linked Platforms", "जुड़े प्लेटफॉर्म")}</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlatforms.length > 0
                    ? selectedPlatforms.join(", ")
                    : selectLabel(languageMode, "Select platforms on the left", "बाएँ से प्लेटफ़ॉर्म चुनें")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
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
                    navigate(`/dashboard?plan=${selectedPlanId}`);
                  }}
                  className="secondary-btn w-full justify-center py-3"
                >
                  {selectLabel(languageMode, "Continue as Demo User", "डेमो उपयोगकर्ता के रूप में जारी रखें")}
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;