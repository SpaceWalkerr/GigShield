import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, CloudRain, Wallet, Mail, LockKeyhole } from "lucide-react";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { calculateWeeklyPremium } from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { signInWithEmail, signInWithGoogle } from "../services/backend/sessionService";
import { AuthPageShell, AuthPanel } from "../components/ui/auth-page-shell";

const validPlanIds = new Set(planDetails.map((p) => p.id));
const selectedPlanStorageKey = "gigshieldSelectedPlanId";

function SignInPage({ setSession }) {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

          <div className="space-y-4">
            <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <Mail className="h-3.5 w-3.5" />
                  {selectLabel(languageMode, "Email", "ईमेल")}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="rider@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-cyan-300/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  {selectLabel(languageMode, "Password", "पासवर्ड")}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-cyan-300/30 focus:outline-none"
                />
              </label>
                <button
                  type="button"
                  disabled={isLoading || !email || !password}
                  onClick={async () => {
                    setIsLoading(true);
                    setAuthError(null);
                    try {
                      const sessionData = await signInWithEmail({ email, password });
                      localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
                      if (setSession) setSession(sessionData);
                      navigate(`/dashboard?plan=${selectedPlanId}`);
                    } catch (err) {
                      setAuthError(err.message || "Email sign-in failed.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isLoading
                    ? selectLabel(languageMode, "Signing in...", "साइन इन हो रहा है...")
                    : selectLabel(languageMode, "Sign in with Email", "ईमेल से साइन इन करें")}
                </button>
              </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d1117] px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {selectLabel(languageMode, "Or continue with", "या जारी रखें")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setAuthError(null);
                localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
                try {
                  await signInWithGoogle({ planId: selectedPlanId });
                } catch (err) {
                  setAuthError(err.message || "Google sign-in failed.");
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              <span className="text-base">G</span>
              {selectLabel(languageMode, "Continue with Google", "Google के साथ जारी रखें")}
            </button>
          </div>
        </AuthPanel>

        <footer className="text-center space-y-4">
          <p className="truncate px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {selectLabel(languageMode, "Security verified by IRDAI Sandbox", "IRDAI सैंडबॉक्स द्वारा प्रमाणित सुरक्षा")}
          </p>
        </footer>
      </div>
    </AuthPageShell>
  );
}

export default SignInPage;

