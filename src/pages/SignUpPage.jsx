import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowRight, User, Building2 } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage";
import { saveSession } from "../utils/session";
import { supabase } from "../utils/supabase";

const platformOptions = ["Zomato", "Swiggy", "Blinkit", "Zepto"];
const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const validPlanIds = new Set(planDetails.map((p) => p.id));
const adminEmailAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

function SignUpPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [searchParams] = useSearchParams();
  const requestedPlanId = searchParams.get("plan");
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const selectedPlanId =
    (requestedPlanId && validPlanIds.has(requestedPlanId) && requestedPlanId) ||
    (persistedPlanId && validPlanIds.has(persistedPlanId) && persistedPlanId) ||
    userProfile.selectedPlanId;
  const selectedPlan = planDetails.find((p) => p.id === selectedPlanId) ?? planDetails[0];
  const premium = calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: 2, riskLevel: "Medium" });

  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden">
        <img src="/shield.png" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 object-contain opacity-10 mix-blend-multiply" />
        <div className="relative z-10">

          <div className="mt-14 space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{selectLabel(languageMode, "Start protecting today", "आज से सुरक्षा शुरू करें")}</p>
            <h2 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              {selectLabel(languageMode, "Join GigShield.", "GigShield से")}<br />
              {selectLabel(languageMode, "Ride protected.", "जुड़ें।")}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed max-w-sm">
              {selectLabel(languageMode, "Create your account in under 2 minutes and start receiving automatic payouts for weather and platform disruptions.", "2 मिनट में अकाउंट बनाएं और मौसम व प्लेटफ़ॉर्म बाधाओं के लिए अपने आप भुगतान पाना शुरू करें।")}
            </p>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: <ShieldCheck className="w-4 h-4" />, text: selectLabel(languageMode, "Rain, heatwave & outage payouts", "बारिश, गर्मी और आउटेज भुगतान") },
            { icon: <User className="w-4 h-4" />, text: selectLabel(languageMode, "Zero paperwork, instant activation", "शून्य कागजी कार्रवाई, त्वरित सक्रियण") },
            { icon: <Building2 className="w-4 h-4" />, text: selectLabel(languageMode, "Works across Zomato, Swiggy, Blinkit", "ज़ोमैटो, स्विगी, ब्लिंकिट पर काम करता है") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/60 shadow-sm">
              <div className="text-gray-700">{item.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-xl mx-auto">


          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{selectLabel(languageMode, "Create Account", "खाता बनाएं")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {selectLabel(languageMode, "Already have an account?", "पहले से खाता है?")} {" "}
            <Link to={`/signin?plan=${selectedPlanId}`} className="font-semibold text-gray-900 underline underline-offset-2">{selectLabel(languageMode, "Sign In", "साइन इन")}</Link>
          </p>

          {authError && <div className="mt-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{authError}</div>}

          <div className="mt-8 space-y-6">
            {/* Google */}
            <button type="button" disabled={isLoading}
              onClick={async () => {
                setIsLoading(true); setAuthError(null);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth?plan=${selectedPlanId}` } });
                  if (error) throw error;
                } catch (err) { setAuthError(err.message); setIsLoading(false); }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white disabled:opacity-50 backdrop-blur-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {selectLabel(languageMode, "Sign up with Google", "Google से साइन अप करें")}
            </button>

            <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-gray-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedPlan.name} — {formatCurrency(premium.adjustedPremium)} / {selectLabel(languageMode, "week", "हफ्ता")}</p>
                  <p className="text-xs text-gray-500">{selectedPlan.coverageHours}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                {selectLabel(languageMode, "* Additional details like city and worker ID will be verified during the activation process.", "* शहर और वर्कर आईडी जैसे अतिरिक्त विवरण सक्रियण प्रक्रिया के दौरान सत्यापित किए जाएंगे।")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
