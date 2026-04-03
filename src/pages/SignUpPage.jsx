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

  const [formValues, setFormValues] = useState({ fullName: "", email: "", password: "", confirmPassword: "", city: "", workerId: "" });
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Zomato", "Swiggy"]);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormValues(cur => ({ ...cur, [e.target.name]: e.target.value }));

  const togglePlatform = (p) =>
    setSelectedPlatforms(cur => cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    if (formValues.password !== formValues.confirmPassword) { setAuthError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formValues.email.trim(), password: formValues.password,
        options: { data: { full_name: formValues.fullName.trim(), city: formValues.city.trim(), worker_id: formValues.workerId.trim(), role: "worker" } }
      });
      if (error) throw error;
      const userMeta = data.user?.user_metadata || {};
      const resolvedRole = adminEmailAllowlist.includes((data.user?.email || "").toLowerCase()) ? "admin" : "worker";
      const currentPremium = calculateWeeklyPremium({ basePremium: selectedPlan.weeklyPremium, platformCount: selectedPlatforms.length, riskLevel });
      saveSession({
        isAuthenticated: true, mode: "signup", role: resolvedRole,
        authToken: data.session?.access_token || "",
        name: userMeta.full_name || formValues.fullName || userProfile.name,
        email: data.user?.email || formValues.email,
        city: userMeta.city || formValues.city || userProfile.city,
        workerId: userMeta.worker_id || formValues.workerId || ("RIDER-" + (data.user?.id || "AAAA").substring(0, 6).toUpperCase()),
        platforms: selectedPlatforms, selectedPlanId, riskLevel,
        calculatedWeeklyPremium: currentPremium.adjustedPremium,
        premiumBreakdown: currentPremium, premiumHistory: [],
        signedInAt: new Date().toISOString(),
      });
      localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
      navigate(`/dashboard?plan=${selectedPlanId}`);
    } catch (err) {
      setAuthError(err.message || "Sign up failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden">
        <img src="/shield.png" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 object-contain opacity-10 mix-blend-multiply" />
        <div className="relative z-10">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
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

      {/* Right Panel — scrollable form */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-6 py-10 sm:px-12 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="lg:hidden text-xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
            <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{selectLabel(languageMode, "Create Account", "खाता बनाएं")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {selectLabel(languageMode, "Already have an account?", "पहले से खाता है?")} {" "}
            <Link to={`/signin?plan=${selectedPlanId}`} className="font-semibold text-gray-900 underline underline-offset-2">{selectLabel(languageMode, "Sign In", "साइन इन")}</Link>
          </p>

          {/* Google */}
          <button type="button" disabled={isLoading}
            onClick={async () => {
              setIsLoading(true); setAuthError(null);
              try {
                const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth?plan=${selectedPlanId}` } });
                if (error) throw error;
              } catch (err) { setAuthError(err.message); setIsLoading(false); }
            }}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white disabled:opacity-50 backdrop-blur-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {selectLabel(languageMode, "Sign up with Google", "Google से साइन अप करें")}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#f4f5f7] px-3 text-gray-500 font-medium">{selectLabel(languageMode, "or fill in details", "या विवरण भरें")}</span></div>
          </div>

          {authError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{authError}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ name: "fullName", label: selectLabel(languageMode, "Full Name", "पूरा नाम"), placeholder: selectLabel(languageMode, "Rider full name", "राइडर का पूरा नाम"), type: "text" },
                { name: "city", label: selectLabel(languageMode, "City", "शहर"), placeholder: "Mumbai", type: "text" },
                { name: "email", label: selectLabel(languageMode, "Email", "ईमेल"), placeholder: "you@example.com", type: "email" },
                { name: "workerId", label: selectLabel(languageMode, "Worker ID", "वर्कर आईडी"), placeholder: selectLabel(languageMode, "Platform rider ID", "राइडर आईडी"), type: "text" },
                { name: "password", label: selectLabel(languageMode, "Password", "पासवर्ड"), placeholder: "••••••••", type: "password" },
                { name: "confirmPassword", label: selectLabel(languageMode, "Confirm Password", "पासवर्ड पुष्टि करें"), placeholder: "••••••••", type: "password" },
              ].map(f => (
                <label key={f.name} className="block text-sm font-medium text-gray-700">
                  {f.label}
                  <input name={f.name} type={f.type} value={formValues[f.name]} onChange={handleChange} required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    placeholder={f.placeholder} />
                </label>
              ))}
            </div>

            {/* Platforms */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{selectLabel(languageMode, "Linked Platforms", "जुड़े प्लेटफॉर्म")}</p>
              <div className="grid grid-cols-2 gap-2">
                {platformOptions.map(p => (
                  <button key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${selectedPlatforms.includes(p) ? "border-[#1a2229] bg-[#1a2229] text-white" : "border-gray-200 bg-white/80 text-gray-700 hover:bg-white"}`}>
                    <span>{p}</span>
                    <span className="text-xs uppercase tracking-widest">{selectedPlatforms.includes(p) ? selectLabel(languageMode, "Linked", "जुड़ा") : selectLabel(languageMode, "Add", "जोड़ें")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{selectLabel(languageMode, "Risk Level", "जोखिम स्तर")}</p>
              <div className="flex gap-2">
                {supportedRiskLevels.map(l => (
                  <button key={l} type="button" onClick={() => setRiskLevel(l)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${riskLevel === l ? "bg-[#1a2229] text-white" : "border border-gray-200 bg-white/80 text-gray-700 hover:bg-white"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan summary */}
            <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm p-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-gray-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedPlan.name} — {formatCurrency(premium.adjustedPremium)} / {selectLabel(languageMode, "week", "हफ्ता")}</p>
                <p className="text-xs text-gray-500">{selectedPlan.coverageHours}</p>
              </div>
            </div>

            <button type="submit" disabled={selectedPlatforms.length === 0 || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a2229] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">
              {isLoading ? selectLabel(languageMode, "Please wait...", "कृपया प्रतीक्षा करें...") : (
                <>{selectLabel(languageMode, "Create GigShield Account", "GigShield खाता बनाएं")}<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
