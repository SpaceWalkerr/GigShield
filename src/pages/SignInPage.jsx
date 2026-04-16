import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Smartphone, CloudRain, Wallet } from "lucide-react";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { calculateWeeklyPremium } from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage";
import { saveSession } from "../utils/session";
import { supabase } from "../utils/supabase";
import { AuthPageShell, AuthPanel } from "@/components/ui/auth-page-shell";

const validPlanIds = new Set(planDetails.map((p) => p.id));
const selectedPlanStorageKey = "gigshieldSelectedPlanId";
function SignInPage() {
  const navigate = useNavigate();
  const { languageMode } = useSiteLanguage();
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
    <AuthPageShell
      eyebrow={selectLabel(languageMode, "Parametric Income Protection", "पैरामेट्रिक आय सुरक्षा")}
      title={selectLabel(languageMode, "Welcome back, rider.", "वापस स्वागत है, राइडर।")}
      description={selectLabel(languageMode, "Secure your earnings against weather disruption, pollution spikes, and platform outages with one weekly protection account.", "मौसम, प्रदूषण और प्लेटफॉर्म बाधाओं के खिलाफ अपनी कमाई को एक साप्ताहिक सुरक्षा खाते से सुरक्षित करें।")}
      asideItems={[
        {
          title: `${selectedPlan.name} ${selectLabel(languageMode, "Plan", "योजना")}`,
          detail: `${formatCurrency(
            calculateWeeklyPremium({
              basePremium: selectedPlan.weeklyPremium,
              platformCount: 2,
              riskLevel: "Medium",
            }).adjustedPremium,
          )} / ${selectLabel(languageMode, "week", "सप्ताह")}`,
          icon: <ShieldCheck className="size-5" />,
        },
        {
          title: selectLabel(languageMode, "Automatic triggers", "स्वचालित ट्रिगर"),
          detail: selectLabel(languageMode, "Rain, heat, AQI, and outage disruptions can start payouts automatically.", "बारिश, गर्मी, AQI और आउटेज के लिए भुगतान अपने आप शुरू हो सकता है।"),
          icon: <CloudRain className="size-5" />,
        },
        {
          title: selectLabel(languageMode, "Weekly safety net", "साप्ताहिक सुरक्षा जाल"),
          detail: selectLabel(languageMode, "Built around the weekly earning and withdrawal cycle of delivery workers.", "डिलीवरी वर्कर्स की साप्ताहिक कमाई और निकासी चक्र के हिसाब से बनाया गया।"),
          icon: <Wallet className="size-5" />,
        },
      ]}
    >
      <div className="w-full max-w-md space-y-6 mx-auto">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black tracking-tight text-white font-archivo">
              {selectLabel(languageMode, "Sign In", "साइन इन करें")}
            </h1>
            <p className="text-sm font-medium text-zinc-400">
              {selectLabel(
                languageMode,
                "New to GigShield?",
                "GigShield पर नए हैं?",
              )}{" "}
              <Link
                to={`/signup?plan=${selectedPlanId}`}
                className="font-bold text-white hover:underline underline-offset-4 decoration-2"
              >
                {selectLabel(languageMode, "Create account", "खाता बनाएं")}
              </Link>
            </p>
          </div>

          <AuthPanel className="space-y-4 rounded-[2rem]">
            {authError && (
              <div className="animate-enter rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-xs font-bold text-red-200">
                {authError}
              </div>
            )}

            {!supabase && (
              <div className="animate-enter rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-xs font-bold text-orange-200">
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
                className="group flex w-full items-center justify-center gap-5 rounded-[2rem] border border-white/10 bg-white px-8 py-6 text-lg font-black text-gray-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] active:scale-[0.97] disabled:opacity-50"
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
                <span className="relative bg-transparent px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
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
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-xs font-bold text-zinc-300 transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <Smartphone className="h-4 w-4 text-zinc-500 group-hover:text-cyan-300 transition-colors" />
                <span>
                  {selectLabel(
                    languageMode,
                    "Explore as Demo User",
                    "डेमो यूजर के रूप में देखें",
                  )}
                </span>
              </button>
            </div>
          </AuthPanel>

          <footer className="text-center space-y-4">
            <p className="truncate px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {selectLabel(
                languageMode,
                "Security verified by IRDAI Sandbox",
                "IRDAI सैंडबॉक्स द्वारा प्रमाणित सुरक्षा",
              )}
            </p>
          </footer>
        </div>
    </AuthPageShell>
  );
}

export default SignInPage;
