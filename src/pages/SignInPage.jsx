import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowRight, Smartphone, Mail } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
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
  .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

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
  const selectedPlan = planDetails.find((p) => p.id === selectedPlanId) ?? planDetails[0];

  const [authMethod, setAuthMethod] = useState("email");
  const [phoneValue, setPhoneValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleOAuthCallback(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) handleOAuthCallback(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleOAuthCallback = (session) => {
    const userMeta = session.user.user_metadata || {};
    const resolvedRole = adminEmailAllowlist.includes((session.user.email || "").toLowerCase()) ? "admin" : "worker";
    const premium = calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: 2, riskLevel: "Medium" });
    saveSession({
      isAuthenticated: true, mode: "oauth", role: resolvedRole,
      authToken: session.access_token,
      name: userMeta.full_name || userProfile.name,
      email: session.user.email,
      city: userMeta.city || "Bangalore",
      workerId: "RIDER-" + session.user.id.substring(0, 6).toUpperCase(),
      platforms: ["Zomato", "Swiggy"], selectedPlanId, riskLevel: "Medium",
      calculatedWeeklyPremium: premium.adjustedPremium, premiumBreakdown: premium,
      premiumHistory: [], signedInAt: new Date().toISOString(),
    });
    navigate(`/dashboard?plan=${selectedPlanId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      if (authMethod === "phone") {
        if (!phoneOtpSent) {
          const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + phoneValue });
          if (error) throw error;
          setPhoneOtpSent(true);
          setIsLoading(false);
          return;
        } else {
          const { data, error } = await supabase.auth.verifyOtp({ phone: "+91" + phoneValue, token: otpValue, type: "sms" });
          if (error || !data.user) throw error || new Error("Invalid OTP");
          handleOAuthCallback(data.session ? { user: data.user, access_token: data.session.access_token } : data);
          return;
        }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userMeta = data.user?.user_metadata || {};
      const resolvedRole = adminEmailAllowlist.includes((data.user?.email || "").toLowerCase()) ? "admin" : "worker";
      const premium = calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: 2, riskLevel: "Medium" });
      saveSession({
        isAuthenticated: true, mode: "signin", role: resolvedRole,
        authToken: data.session?.access_token || "",
        name: userMeta.full_name || userProfile.name,
        email: data.user?.email || email,
        city: userMeta.city || userProfile.city,
        workerId: userMeta.worker_id || ("RIDER-" + (data.user?.id || "AAAA").substring(0, 6).toUpperCase()),
        platforms: ["Zomato", "Swiggy"], selectedPlanId, riskLevel: "Medium",
        calculatedWeeklyPremium: premium.adjustedPremium, premiumBreakdown: premium,
        premiumHistory: [], signedInAt: new Date().toISOString(),
      });
      localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
      navigate(`/dashboard?plan=${selectedPlanId}`);
    } catch (err) {
      setAuthError(err.message || "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <img src="/rider.png" alt="" className="absolute inset-0 w-full h-full object-contain opacity-20 mix-blend-multiply p-16 rounded-[60px]" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
          <div className="mt-16 space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{selectLabel(languageMode, "Parametric Income Protection", "पैरामेट्रिक आय सुरक्षा")}</p>
            <h2 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              {selectLabel(languageMode, "Welcome back,", "वापस स्वागत है,")}<br />
              {selectLabel(languageMode, "rider.", "राइडर।")}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-sm">
              {selectLabel(languageMode, "Your coverage, payouts and earnings are waiting for you.", "आपका कवरेज, भुगतान और कमाई आपका इंतज़ार कर रहे हैं।")}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/60 shadow-md w-fit">
          <ShieldCheck className="w-6 h-6 text-gray-800" />
          <div>
            <p className="text-sm font-bold text-gray-900">{selectLabel(languageMode, "Protected plan", "सुरक्षा योजना")}: {selectedPlan.name}</p>
            <p className="text-xs text-gray-500">{formatCurrency(calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: 2, riskLevel: "Medium" }).adjustedPremium)} / {selectLabel(languageMode, "week", "सप्ताह")}</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="lg:hidden text-xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
            <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{selectLabel(languageMode, "Sign In", "साइन इन करें")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {selectLabel(languageMode, "Don't have an account?", "खाता नहीं है?")} {" "}
            <Link to={`/signup?plan=${selectedPlanId}`} className="font-semibold text-gray-900 underline underline-offset-2">{selectLabel(languageMode, "Sign Up", "साइन अप")}</Link>
          </p>

          {/* Google */}
          <button
            type="button" disabled={isLoading}
            onClick={async () => {
              setIsLoading(true); setAuthError(null);
              try {
                const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth?plan=${selectedPlanId}`, queryParams: { prompt: "select_account" } } });
                if (error) throw error;
              } catch (err) { setAuthError(err.message || "Google sign-in failed."); setIsLoading(false); }
            }}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white disabled:opacity-50 backdrop-blur-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {selectLabel(languageMode, "Continue with Google", "Google से जारी रखें")}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#f4f5f7] px-3 text-gray-500 font-medium">{selectLabel(languageMode, "or", "या")}</span></div>
          </div>

          {/* Auth method tabs */}
          <div className="flex gap-1 bg-white/60 rounded-xl p-1 mb-6 border border-gray-200 w-fit">
            {[{ id: "email", label: selectLabel(languageMode, "Email", "ईमेल"), icon: <Mail className="w-3.5 h-3.5" /> }, { id: "phone", label: selectLabel(languageMode, "Phone", "फ़ोन"), icon: <Smartphone className="w-3.5 h-3.5" /> }].map(m => (
              <button key={m.id} type="button" onClick={() => { setAuthMethod(m.id); setAuthError(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${authMethod === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>

          {authError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{authError}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMethod === "email" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{selectLabel(languageMode, "Email", "ईमेल")}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{selectLabel(languageMode, "Password", "पासवर्ड")}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    placeholder="••••••••" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{selectLabel(languageMode, "Mobile Number", "मोबाइल नंबर")}</label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-white/60 px-3 text-gray-500 text-sm font-semibold">+91</span>
                    <input type="tel" value={phoneValue} onChange={e => setPhoneValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-r-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                      placeholder="10-digit number" disabled={phoneOtpSent || isLoading} required maxLength={10} />
                  </div>
                </div>
                {phoneOtpSent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{selectLabel(languageMode, "Enter OTP", "OTP दर्ज करें")}</label>
                    <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 text-sm text-center tracking-widest text-xl font-mono"
                      placeholder="------" maxLength={6} autoFocus required />
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a2229] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 mt-2">
              {isLoading ? selectLabel(languageMode, "Please wait...", "कृपया प्रतीक्षा करें...") : (
                <>{selectLabel(languageMode, authMethod === "phone" && !phoneOtpSent ? "Send OTP" : "Sign In to GigShield", authMethod === "phone" && !phoneOtpSent ? "OTP भेजें" : "GigShield में साइन इन करें")}<ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <Link to={`/dashboard?plan=${selectedPlanId}`}
              onClick={() => { const premium = calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: 2, riskLevel: "Medium" }); saveSession({ isAuthenticated: true, mode: "demo", name: userProfile.name, email: "demo@gigshield.app", city: userProfile.city, workerId: "demo-worker", platforms: ["Zomato", "Swiggy"], selectedPlanId, riskLevel: "Medium", calculatedWeeklyPremium: premium.adjustedPremium, premiumBreakdown: premium, premiumHistory: [], signedInAt: new Date().toISOString() }); localStorage.setItem(selectedPlanStorageKey, selectedPlanId); }}
              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white/60 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white/80 backdrop-blur-sm">
              {selectLabel(languageMode, "Continue as Demo User", "डेमो उपयोगकर्ता के रूप में जारी रखें")}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
