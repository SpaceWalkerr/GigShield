import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, User, Building2, CloudRain, Mail, LockKeyhole } from "lucide-react";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { calculateWeeklyPremium } from "../utils/pricing";
import { useSiteLanguage } from "../utils/siteLanguage";
import { buildAuthCallbackUrl } from "../utils/authRedirect";
import { signUpWithEmail } from "../services/backend/sessionService";
import { AuthPageShell, AuthPanel } from "../components/ui/auth-page-shell";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const validPlanIds = new Set(planDetails.map((p) => p.id));

function SignUpPage({ setSession }) {
  const navigate = useNavigate();
  const { languageMode } = useSiteLanguage();
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDemoMode = () => {
    const demoSession = {
      isAuthenticated: true,
      mode: "demo",
      name: "Demo Rider",
      email: "rider@demo.app",
      city: "New Delhi",
      workerId: "DW-1029",
      platforms: ["Zomato", "Blinkit"],
      selectedPlanId,
      signedInAt: new Date().toISOString(),
    };
    
    import('../utils/session').then(({ saveSession }) => {
      saveSession(demoSession);
      if (setSession) setSession(demoSession);
      navigate(`/dashboard?plan=${selectedPlanId}`);
    });
  };

  if (isSuccess) {
    return (
      <AuthPageShell
        eyebrow="Account Created"
        title="Check your email"
        description="We've sent a verification link to your inbox. Please click the link to activate your GigShield account and start your protection."
        asideItems={[]}
      >
        <div className="w-full max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-6 border border-emerald-500/20">
              <Mail className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm">
            Once verified, you can sign in to access your dashboard.
          </p>
          <Link to="/signin" className="block w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-zinc-200">
            Sign In
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow={selectLabel(languageMode, "Start protecting today", "आज से सुरक्षा शुरू करें")}
      title={selectLabel(languageMode, "Join GigShield. Ride protected.", "GigShield से जुड़ें। सुरक्षित राइड करें।")}
      description={selectLabel(languageMode, "Create your account in under 2 minutes and start receiving automatic payouts for weather and platform disruptions.", "2 मिनट में अकाउंट बनाएं और मौसम व प्लेटफ़ॉर्म बाधाओं के लिए अपने आप भुगतान पाना शुरू करें।")}
      asideItems={[
        { title: selectLabel(languageMode, "Rain, heatwave, and outage payouts", "बारिश, गर्मी और आउटेज भुगतान"), icon: <CloudRain className="size-5" /> },
        { title: selectLabel(languageMode, "Zero paperwork, instant activation", "शून्य कागजी कार्रवाई, त्वरित सक्रियण"), icon: <User className="size-5" /> },
        { title: selectLabel(languageMode, "Works across Zomato, Swiggy, Blinkit", "ज़ोमैटो, स्विगी, ब्लिंकिट पर काम करता है"), icon: <Building2 className="size-5" /> },
      ]}
    >
      <div className="w-full max-w-md mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{selectLabel(languageMode, "Create Account", "खाता बनाएं")}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {selectLabel(languageMode, "Already have an account?", "पहले से खाता है?")} {" "}
            <Link to={`/signin?plan=${selectedPlanId}`} className="font-semibold text-white underline underline-offset-2">{selectLabel(languageMode, "Sign In", "साइन इन")}</Link>
          </p>
        </div>

        {authError && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{authError}</div>}

        <div className="space-y-6">
          <AuthPanel className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <User className="h-3.5 w-3.5" />
                {selectLabel(languageMode, "Full name", "पूरा नाम")}
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Rider Name"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-cyan-300/30 focus:outline-none"
              />
            </label>
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
                placeholder="Minimum 6 characters"
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
                  const sessionData = await signUpWithEmail({ email, password, fullName });
                  localStorage.setItem(selectedPlanStorageKey, selectedPlanId);
                  
                  // If we got a session back, go to dashboard.
                  // If not (awaiting verification), show success screen.
                  if (sessionData && sessionData.isAuthenticated) {
                    if (setSession) setSession(sessionData);
                    navigate(`/dashboard?plan=${selectedPlanId}`);
                  } else {
                    setIsSuccess(true);
                  }
                } catch (err) {
                  setAuthError(err.message || "Email sign-up failed.");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isLoading
                ? selectLabel(languageMode, "Creating account...", "खाता बन रहा है...")
                : selectLabel(languageMode, "Create account with Email", "ईमेल से खाता बनाएं")}
            </button>
          </AuthPanel>

          <button
            type="button"
            onClick={handleDemoMode}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-zinc-300 shadow-sm transition hover:bg-white/10 backdrop-blur-sm"
          >
            {selectLabel(languageMode, "Explore as Demo User", "डेमो उपयोगकर्ता के रूप में एक्सप्लोर करें")}
          </button>

          <AuthPanel>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-cyan-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{selectedPlan.name} — {formatCurrency(premium.adjustedPremium)} / {selectLabel(languageMode, "week", "हफ्ता")}</p>
                <p className="text-xs text-zinc-400">{selectedPlan.coverageHours}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              {selectLabel(languageMode, "* Additional details like city and worker ID will be verified during the activation process.", "* शहर और वर्कर आईडी जैसे अतिरिक्त विवरण सक्रियण प्रक्रिया के दौरान सत्यापित किए जाएंगे।")}
            </p>
          </AuthPanel>
        </div>
      </div>
    </AuthPageShell>
  );
}

export default SignUpPage;
