import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, CloudRain, Wallet } from "lucide-react";
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
import { AuthPageShell, AuthPanel } from "../components/ui/auth-page-shell";

const platformOptions = ["Zomato", "Swiggy", "Blinkit", "Zepto"];
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
  const { languageMode } = useSiteLanguage();
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
    <AuthPageShell
      eyebrow={selectLabel(languageMode, "Unified Access", "एकीकृत एक्सेस")}
      title={selectLabel(languageMode, "One login for every protected gig.", "हर सुरक्षित गिग के लिए एक लॉगिन।")}
      description={selectLabel(languageMode, "Link the delivery apps you work on, tune the weekly premium preview, and move straight into the live protection dashboard.", "जिन डिलीवरी ऐप्स पर आप काम करते हैं उन्हें जोड़ें, साप्ताहिक प्रीमियम प्रीव्यू ट्यून करें और सीधे लाइव प्रोटेक्शन डैशबोर्ड में जाएं।")}
      asideItems={[
        {
          title: selectLabel(languageMode, "Weekly pricing", "साप्ताहिक प्राइसिंग"),
          detail: `${formatCurrency(premiumBreakdown.adjustedPremium)} / ${selectLabel(languageMode, "week", "सप्ताह")}`,
          icon: <Wallet className="size-5" />,
        },
        {
          title: selectLabel(languageMode, "Trigger coverage", "ट्रिगर कवरेज"),
          detail: selectLabel(languageMode, "Coverage responds to rain, AQI spikes, outages, and disruption conditions only.", "कवरेज केवल बारिश, AQI स्पाइक, आउटेज और डिसरप्शन स्थितियों पर प्रतिक्रिया देता है।"),
          icon: <CloudRain className="size-5" />,
        },
        {
          title: selectLabel(languageMode, "Income-safe design", "आय सुरक्षित डिज़ाइन"),
          detail: selectLabel(languageMode, "Strictly focused on lost earnings protection, not health, life, accident, or repair cover.", "सख्ती से खोई हुई कमाई की सुरक्षा पर केंद्रित, स्वास्थ्य, जीवन, दुर्घटना या रिपेयर कवर पर नहीं।"),
          icon: <ShieldCheck className="size-5" />,
        },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
          <article className="lg:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectLabel(languageMode, "Platform Linker", "प्लेटफ़ॉर्म लिंक")}</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl">
              {selectLabel(languageMode, "Sign in once.", "एक बार साइन इन करें।")}
              <br />
              {selectLabel(languageMode, "Protect all gigs.", "सभी गिग्स सुरक्षित करें।")}
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
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
                        ? "border-cyan-300/30 bg-white/[0.08] text-white"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
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

          <section className="space-y-6 lg:col-span-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:bg-white/[0.06]"
                }`}
              >
                {selectLabel(languageMode, "Sign In", "साइन इन")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:bg-white/[0.06]"
                }`}
              >
                {selectLabel(languageMode, "Sign Up", "साइन अप")}
              </button>
            </div>

            <AuthPanel className="space-y-6 rounded-[2rem]">
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
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] transition hover:bg-zinc-100 disabled:opacity-50"
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
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {authError}
                </div>
              )}

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectLabel(languageMode, "Dynamic Premium", "डायनेमिक प्रीमियम")}</p>
                <p className="mt-2 text-2xl font-bold text-white">
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
                          ? "bg-white text-zinc-950"
                          : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      {selectLabel(languageMode, `${level} risk`, `${level} जोखिम`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectLabel(languageMode, "Selected Plan", "चयनित योजना")}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {selectedPlan.name} | {selectedPlan.coverageHours}
                </p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectLabel(languageMode, "Linked Platforms", "जुड़े प्लेटफॉर्म")}</p>
                <p className="mt-2 text-sm font-semibold text-white">
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
                  className="inline-flex w-full justify-center rounded-2xl bg-white px-4 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200"
                >
                  {selectLabel(languageMode, "Continue as Demo User", "डेमो उपयोगकर्ता के रूप में जारी रखें")}
                </button>
              </div>
            </AuthPanel>
          </section>
        </div>
    </AuthPageShell>
  );
}

export default AuthPage;
