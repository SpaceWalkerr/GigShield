import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Smartphone } from "lucide-react";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { calculateWeeklyPremium } from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage";
import { saveSession } from "../utils/session";
import { supabase } from "../utils/supabase";

const validPlanIds = new Set(planDetails.map((p) => p.id));
const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const adminEmailAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

function SignInPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [searchParams] = useSearchParams();
  const requestedPlanId = searchParams.get("plan");
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const selectedPlanId =
    (requestedPlanId && validPlanIds.has(requestedPlanId) && requestedPlanId) ||
    (persistedPlanId && validPlanIds.has(persistedPlanId) && persistedPlanId) ||
    userProfile.selectedPlanId;
  const selectedPlan =
    planDetails.find((p) => p.id === selectedPlanId) ?? planDetails[0];

  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  return (
    <div className="min-h-screen bg-[#f8f9fb] flex font-sans selection:bg-gray-900 selection:text-white">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-3/5 flex-col justify-between p-16 relative overflow-hidden mesh-gradient">
        {/* Animated Background Element */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] animate-pulse" />

        <div className="relative z-10">
          <div className="mt-24 space-y-8">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 animate-enter">
                {selectLabel(
                  languageMode,
                  "Parametric Income Protection",
                  "पैरामेट्रिक आय सुरक्षा",
                )}
              </p>
              <h2 className="text-7xl font-black text-gray-900 leading-[0.95] tracking-tightest font-archivo">
                {selectLabel(languageMode, "Welcome back,", "वापस स्वागत है,")}
                <br />
                <span className="text-blue-600 italic tracking-tighter">
                  {selectLabel(languageMode, "rider.", "राइडर।")}
                </span>
              </h2>
            </div>

            <p className="text-gray-500 text-xl leading-relaxed max-w-md font-medium">
              {selectLabel(
                languageMode,
                "Secure your earnings against weather disruptions and platform outages automatically.",
                "मौसम और प्लेटफॉर्म बाधाओं के खिलाफ अपनी कमाई को स्वचालित रूप से सुरक्षित करें।",
              )}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="glass-card rounded-[32px] p-8 w-fit flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                {selectLabel(languageMode, "Active Coverage", "सक्रिय सुरक्षा")}
              </p>
              <p className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                {selectedPlan.name} {selectLabel(languageMode, "Plan", "योजना")}
              </p>
              <p className="text-sm font-semibold text-blue-600">
                {formatCurrency(
                  calculateWeeklyPremium({
                    basePremium: selectedPlan.weeklyPremium,
                    platformCount: 2,
                    riskLevel: "Medium",
                  }).adjustedPremium,
                )}{" "}
                / {selectLabel(languageMode, "week", "सप्ताह")}
              </p>
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-400 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gray-300" />
            BUILT WITH ❤️ FOR RIDERS ACROSS INDIA
          </div>
        </div>

        {/* Hero Image - More stylized */}
        <img
          src="/rider.png"
          alt=""
          className="absolute right-[-5%] bottom-[-5%] w-[70%] h-auto object-contain opacity-40 mix-blend-multiply pointer-events-none drop-shadow-2xl"
        />
      </div>

      {/* Right Panel - Auth Section */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center px-6 pt-2 pb-4 sm:px-12 relative">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight font-archivo">
              {selectLabel(languageMode, "Sign In", "साइन इन करें")}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {selectLabel(
                languageMode,
                "New to GigShield?",
                "GigShield पर नए हैं?",
              )}{" "}
              <Link
                to={`/signup?plan=${selectedPlanId}`}
                className="text-gray-900 font-bold hover:underline underline-offset-4 decoration-2"
              >
                {selectLabel(languageMode, "Create account", "खाता बनाएं")}
              </Link>
            </p>
          </div>

          <div className="glass-card rounded-[40px] p-6 space-y-4">
            {authError && (
              <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-xs font-bold text-red-600 animate-enter">
                {authError}
              </div>
            )}

            {!supabase && (
              <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50 text-xs font-bold text-orange-600 animate-enter">
                Supabase is not configured. Please check your .env file or use
                Demo Mode.
              </div>
            )}

            <div className="space-y-4">
              {/* Google Button - High Visibility / Large */}
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
                className="group w-full flex items-center justify-center gap-5 rounded-[2.5rem] bg-white border border-gray-100 px-8 py-6 text-lg font-black text-gray-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_60px_-15px_rgba(0,0,0,0.2)] hover:border-gray-200 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <div className="w-8 h-8 flex items-center justify-center scale-125">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <span>
                  {selectLabel(
                    languageMode,
                    "Continue with Google",
                    "Google के साथ जारी रखें",
                  )}
                </span>
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <span className="relative bg-white/40 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  {selectLabel(languageMode, "or", "या")}
                </span>
              </div>

              {/* Demo Button - Sleek Profile Link */}
              <button
                type="button"
                onClick={() => {
                  const premium = calculateWeeklyPremium({
                    basePremium: selectedPlan.weeklyPremium,
                    platformCount: 2,
                    riskLevel: "Medium",
                  });
                  saveSession({
                    isAuthenticated: true,
                    mode: "demo",
                    name: userProfile.name,
                    email: "demo@gigshield.app",
                    city: userProfile.city,
                    workerId: "demo-worker",
                    platforms: ["Zomato", "Swiggy"],
                    selectedPlanId,
                    riskLevel: "Medium",
                    calculatedWeeklyPremium: premium.adjustedPremium,
                    premiumBreakdown: premium,
                    premiumHistory: [],
                    signedInAt: new Date().toISOString(),
                  });
                  localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
                  navigate(`/dashboard?plan=${selectedPlanId}`);
                }}
                className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-200 px-6 py-4 text-xs font-bold text-gray-500 transition-all active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                <span>
                  {selectLabel(
                    languageMode,
                    "Explore as Demo User",
                    "डेमो यूजर के रूप में देखें",
                  )}
                </span>
              </button>
            </div>
          </div>

          <footer className="text-center space-y-4">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase truncate px-8">
              {selectLabel(
                languageMode,
                "Security verified by IRDAI Sandbox",
                "IRDAI सैंडबॉक्स द्वारा प्रमाणित सुरक्षा",
              )}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
