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
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    workerId: "",
  });
  const [authMethod, setAuthMethod] = useState("email"); // "email" | "phone"
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitLabel = useMemo(() => {
    if (authMethod === "phone") {
      return phoneOtpSent
        ? selectLabel(languageMode, "Verify & Login", "सत्यापित करें और लॉगिन करें")
        : selectLabel(languageMode, "Send OTP", "OTP भेजें");
    }
    return mode === "signin"
      ? selectLabel(languageMode, "Sign In to GigShield", "GigShield में साइन इन करें")
      : selectLabel(languageMode, "Create GigShield Account", "GigShield खाता बनाएं");
  }, [languageMode, mode, authMethod, phoneOtpSent]);
  const selectedPlan =
    planDetails.find((plan) => plan.id === selectedPlanId) ?? planDetails[0];
  const premiumBreakdown = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: selectedPlatforms.length,
    riskLevel,
  });
  const [premiumHistory, setPremiumHistory] = useState(() => [
    createPremiumHistoryEntry({
      reason: selectLabel(languageMode, "Initial premium setup", "प्रारंभिक प्रीमियम सेटअप"),
      breakdown: premiumBreakdown,
    }),
  ]);

  useEffect(() => {
    const handleOAuthCallback = async (session) => {
      if (!session) return;
      
      const userMeta = session.user.user_metadata || {};
      const { email } = session.user;
      const name = userMeta.full_name || userProfile.name;
      const resolvedRole = adminEmailAllowlist.includes((email || "").toLowerCase()) ? "admin" : "worker";
      
      saveSession({
        isAuthenticated: true,
        mode: "oauth",
        role: resolvedRole,
        authToken: session.access_token,
        name,
        email,
        city: userMeta.city || "Bangalore",
        workerId: "RIDER-" + session.user.id.substring(0, 6).toUpperCase(),
        platforms: ["Zomato", "Swiggy"],
        selectedPlanId,
        riskLevel: "Medium",
        calculatedWeeklyPremium: 155, 
        premiumBreakdown: { adjustedPremium: 155, basePremium: 155, platformLoadFee: 0, platformCount: 2, riskLevel: "Medium", riskMultiplier: 1.0 },
        premiumHistory: [],
        signedInAt: new Date().toISOString(),
      });
      navigate(`/dashboard?plan=${selectedPlanId}`);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleOAuthCallback(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleOAuthCallback(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, selectedPlanId]);

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
      let authUser;
      let authSession;
      
      if (authMethod === "phone") {
        if (!phoneOtpSent) {
          const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + phoneValue });
          if (error) throw error;
          setPhoneOtpSent(true);
          setIsLoading(false);
          return;
        } else {
          const { data, error } = await supabase.auth.verifyOtp({
            phone: "+91" + phoneValue,
            token: otpValue,
            type: "sms"
          });
          if (error || !data.user) throw error || new Error("Invalid OTP");
          authUser = data.user;
          authSession = data.session;
        }
      } else {
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
              role: "worker",
            }
          }
        });
        
        if (error) throw error;
        authUser = data.user;
        authSession = data.session;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: formValues.password
        });
        if (error) throw error;
        authUser = data.user;
        authSession = data.session;
      }
      }

      const userMeta = authUser?.user_metadata || {};
      const resolvedRole =
        userMeta.role === "admin" || adminEmailAllowlist.includes((authUser?.email || "").toLowerCase())
          ? "admin"
          : "worker";
      const token = authSession?.access_token || "";

      saveSession({
        isAuthenticated: true,
        mode,
        role: resolvedRole,
        authToken: token,
        name: userMeta.full_name || fullNameValue || userProfile.name,
        email: authUser?.email || emailValue || phoneValue,
        city: userMeta.city || cityValue || userProfile.city,
        workerId: userMeta.worker_id || workerIdValue || ("RIDER-" + (authUser?.id || "AAAA").substring(0,6).toUpperCase()),
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

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Google Sign-In button (Mobile Optimized at top) */}
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
                        redirectTo: `${window.location.origin}/auth?plan=${selectedPlanId}`,
                        queryParams: { prompt: "select_account" },
                      },
                    });
                    if (error) throw error;
                  } catch (err) {
                    setAuthError(err.message || "Google sign-in failed.");
                    setIsLoading(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white disabled:opacity-50"
              >
                {/* Google logo SVG */}
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

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-coal-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-coal-50 px-3 text-coal-500 font-medium">
                    {selectLabel(languageMode, "or continue with", "या इसके साथ जारी रखें")}
                  </span>
                </div>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex gap-4 border-b border-coal-200 mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("phone"); setAuthError(null); }}
                  className={`pb-2 text-sm font-semibold transition -mb-px ${
                    authMethod === "phone"
                      ? "text-coal-900 border-b-2 border-coal-900"
                      : "text-coal-500 hover:text-coal-700"
                  }`}
                >
                  Phone OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setAuthError(null); }}
                  className={`pb-2 text-sm font-semibold transition -mb-px ${
                    authMethod === "email"
                      ? "text-coal-900 border-b-2 border-coal-900"
                      : "text-coal-500 hover:text-coal-700"
                  }`}
                >
                  Email & Password
                </button>
              </div>

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
                <p className="mt-1 text-xs text-coal-600">
                  {selectLabel(
                    languageMode,
                    `Base ${formatCurrency(premiumBreakdown.basePremium)} + platform load ${formatCurrency(premiumBreakdown.platformLoadFee)}, risk x${premiumBreakdown.riskMultiplier.toFixed(2)}`,
                    `बेस ${formatCurrency(premiumBreakdown.basePremium)} + प्लेटफॉर्म शुल्क ${formatCurrency(premiumBreakdown.platformLoadFee)}, जोखिम x${premiumBreakdown.riskMultiplier.toFixed(2)}`,
                  )}
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

              {authMethod === "phone" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-coal-700">
                    {selectLabel(languageMode, "Mobile Number", "मोबाइल नंबर")}
                    <div className="flex mt-1">
                      <span className="flex items-center rounded-l-xl border border-r-0 border-coal-300 bg-coal-50 px-3 text-coal-500 text-sm font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full rounded-r-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2 disabled:bg-coal-50 disabled:text-coal-500"
                        placeholder="10-digit number"
                        disabled={phoneOtpSent || isLoading}
                        required
                        maxLength={10}
                      />
                    </div>
                  </label>

                  {phoneOtpSent && (
                    <label className="block text-sm font-medium text-coal-700 mt-3 animate-enter">
                      {selectLabel(languageMode, "Enter OTP", "OTP दर्ज करें")}
                      <input
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2 text-center tracking-widest text-xl font-mono"
                        placeholder="------"
                        maxLength={6}
                        disabled={isLoading}
                        autoFocus
                        required
                      />
                    </label>
                  )}
                </div>
              )}

              {authMethod === "email" && (
                <div className="space-y-3">
                  {mode === "signup" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium text-coal-700">
                        {selectLabel(languageMode, "Full Name", "पूरा नाम")}
                        <input
                          name="fullName"
                          value={formValues.fullName}
                          onChange={handleChange}
                          required
                          className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                          placeholder={selectLabel(languageMode, "Rider full name", "राइडर का पूरा नाम")}
                        />
                      </label>
                      <label className="text-sm font-medium text-coal-700">
                        {selectLabel(languageMode, "City", "शहर")}
                        <input
                          name="city"
                          value={formValues.city}
                          onChange={handleChange}
                          required
                          className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                          placeholder={selectLabel(languageMode, "Mumbai", "मुंबई")}
                        />
                      </label>
                    </div>
                  ) : null}

                  <label className="block text-sm font-medium text-coal-700">
                    {selectLabel(languageMode, "Email", "ईमेल")}
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                      placeholder={selectLabel(languageMode, "you@example.com", "you@example.com")}
                    />
                  </label>

                  <label className="block text-sm font-medium text-coal-700">
                    {selectLabel(languageMode, "Worker ID", "वर्कर आईडी")}
                    <input
                      name="workerId"
                      value={formValues.workerId}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-coal-300 bg-white px-3 py-2 text-coal-900 outline-none ring-electric-500 focus:ring-2"
                      placeholder={selectLabel(languageMode, "Platform rider ID", "प्लेटफॉर्म राइडर आईडी")}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-coal-700">
                      {selectLabel(languageMode, "Password", "पासवर्ड")}
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
                        {selectLabel(languageMode, "Confirm Password", "पासवर्ड पुष्टि करें")}
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
                </div>
              )}

              <div className="board mt-2 p-4">
                <p className="kicker">{selectLabel(languageMode, "Selected Plan", "चयनित योजना")}</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlan.name} | {selectedPlan.coverageHours}
                </p>
                <p className="kicker">{selectLabel(languageMode, "Linked Platforms", "जुड़े प्लेटफॉर्म")}</p>
                <p className="mt-2 text-sm font-semibold text-coal-900">
                  {selectedPlatforms.length > 0
                    ? selectedPlatforms.join(", ")
                    : selectLabel(languageMode, "Select at least one platform account", "कम से कम एक प्लेटफॉर्म खाता चुनें")}
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
                  {selectLabel(languageMode, "Continue as Demo User", "डेमो उपयोगकर्ता के रूप में जारी रखें")}
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