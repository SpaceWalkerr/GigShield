import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Fingerprint, Clock, Plus, Check } from "lucide-react";
import ActivityPanel from "../components/ActivityPanel";
import EarningsSnapshot from "../components/EarningsSnapshot";
import FraudDetectionIndicator from "../components/FraudDetectionIndicator";
import PlanSummary from "../components/PlanSummary";
import TriggerSimulationPanel from "../components/TriggerSimulationPanel";
import LanguageToggle from "../components/LanguageToggle";
import activityData from "../data/activityData.json";
import fraudScores from "../data/fraudScores.json";
import planDetails from "../data/planDetails.json";
import triggerEvents from "../data/triggerEvents.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, getRiskMultiplier } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import { getRiskLevelFromScore } from "../utils/fraud";
import {
  applyTriggerToEarnings,
  getDailyPayoutCap,
  getPayoutForTrigger,
} from "../utils/payout";
import { clearSession, getSession } from "../utils/session";
import { createPayoutReceipt, getPayoutHistory, savePayoutReceipt } from "../utils/payoutReceipt";
import {
  appendTriggerAuditEvent,
  evaluateTriggerRules,
  getTriggerAuditEvents,
  getTriggerConfidenceScore,
} from "../utils/triggerEngine";
import { pushNotification } from "../utils/notifications";
import { trackEvent } from "../utils/observability";
import { supabase } from "../utils/supabase";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const onboardingStorageKey = "gigshieldOnboardingCompleted";

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getDeltaMeta(amount) {
  if (amount > 0) return { label: `+${formatCurrency(amount)}`, classes: "bg-green-100 text-green-700" };
  if (amount < 0) return { label: `-${formatCurrency(Math.abs(amount))}`, classes: "bg-red-100 text-red-700" };
  return { label: "No change", classes: "bg-gray-100 text-gray-500" };
}

function toDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getWeeklyTrend(history) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = toDayKey(date);
    days.push({ key, label: date.toLocaleDateString(undefined, { weekday: "short" }), triggers: 0, paidAmount: 0, blockedAmount: 0, pendingClaims: 0 });
  }
  history.forEach((item) => {
    const key = toDayKey(item.createdAt || Date.now());
    const day = days.find((entry) => entry.key === key);
    if (!day) return;
    day.triggers += 1;
    if (item.status === "paid" || item.status === "capped") day.paidAmount += Number(item.payoutAmount || 0);
    if (item.lifecycleStatus === "pending-verification" || item.lifecycleStatus === "processing") day.pendingClaims += 1;
  });
  return days;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session] = useState(() => getSession());
  const { languageMode, setLanguageMode } = useSiteLanguage();

  // Core States
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Swiggy", "Zomato", "Blinkit"]);
  const [activePersonaKey, setActivePersonaKey] = useState("normal");
  const [earningsProtectedThisWeek, setEarningsProtectedThisWeek] = useState(userProfile.earningsProtectedThisWeek);
  const [lastPayoutAmount, setLastPayoutAmount] = useState(userProfile.lastPayoutAmount);
  const [paidTodayAmount, setPaidTodayAmount] = useState(0);
  const [payoutDayKey, setPayoutDayKey] = useState(new Date().toDateString());
  const [latestTriggerId, setLatestTriggerId] = useState("");
  const [triggerAuditEvents, setTriggerAuditEvents] = useState(() => getTriggerAuditEvents().slice(0, 8));
  const [weeklyTrend, setWeeklyTrend] = useState(() => getWeeklyTrend(getPayoutHistory()));
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(onboardingStorageKey) !== "done");

  const availablePlatforms = ["Swiggy", "Zomato", "Blinkit", "Zepto", "BigBasket", "Porter"];
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const resolvedPlanId = searchParams.get("plan") || session?.selectedPlanId || persistedPlanId || userProfile.selectedPlanId;
  const selectedPlan = planDetails.find((p) => p.id === resolvedPlanId) ?? planDetails[0];

  // Derived Data for Dynamic UI
  const activeFraudProfile = fraudScores[activePersonaKey] ?? fraudScores.normal;
  const displayRiskLevel = getRiskLevelFromScore(activeFraudProfile.score);
  const displayRiskMultiplier = getRiskMultiplier(displayRiskLevel);
  const platformCount = selectedPlatforms.length;

  // Use the refined pricing utility
  const displayPremiumBreakdown = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount,
    riskLevel: displayRiskLevel
  });
  const displayWeeklyPremium = displayPremiumBreakdown.adjustedPremium;

  const [latestPayoutMeta, setLatestPayoutMeta] = useState({
    status: "idle", reason: "", basePayout: 0, remainingCap: getDailyPayoutCap(selectedPlan.id), dailyCap: getDailyPayoutCap(selectedPlan.id)
  });

  const latestTrigger = triggerEvents.find((e) => e.id === latestTriggerId) ?? null;
  const dailyPayoutCap = getDailyPayoutCap(selectedPlan.id);

  // Simulation Logic
  const handleSimulateTrigger = async (triggerId) => {
    const now = new Date();
    const triggerRules = evaluateTriggerRules({ triggerId, now });

    if (triggerRules.cooldownBlocked || triggerRules.dedupBlocked) {
      const blockedReason = triggerRules.cooldownBlocked ? `Cooling down. Retry in ${triggerRules.cooldownRemainingSec}s.` : "Duplicate blocked.";
      const status = triggerRules.cooldownBlocked ? "blocked-cooldown" : "blocked-dedup";
      setLatestPayoutMeta({ status, reason: blockedReason, basePayout: 0, remainingCap: Math.max(0, dailyPayoutCap - paidTodayAmount), dailyCap: dailyPayoutCap });
      setLatestTriggerId(triggerId);
      return;
    }

    const triggerConfidence = getTriggerConfidenceScore({ triggerId, personaRiskLevel: displayRiskLevel });
    const todayKey = now.toDateString();
    const effectivePaidToday = todayKey === payoutDayKey ? paidTodayAmount : 0;

    const payoutResult = getPayoutForTrigger(triggerEvents, triggerId, selectedPlan.id, {
      coverageHours: selectedPlan.coverageHours, paidTodayAmount: effectivePaidToday, atTime: now
    });

    const payoutAmount = payoutResult.payoutAmount;
    const enrichedResult = { ...payoutResult, triggerConfidenceScore: Number((triggerConfidence.score * 100).toFixed(0)), triggerConfidenceLabel: triggerConfidence.label };

    const receipt = createPayoutReceipt({
      createdAt: now.toISOString(), status: payoutResult.status, reason: payoutResult.reason, triggerId,
      triggerLabel: triggerEvents.find((e) => e.id === triggerId)?.label ?? triggerId,
      planId: selectedPlan.id, planName: selectedPlan.name, payoutAmount, basePayout: payoutResult.basePayout,
      dailyCap: payoutResult.dailyCap, remainingCap: payoutResult.remainingCap, isCoveredNow: true,
      coverageHours: selectedPlan.coverageHours, riskLevel: displayRiskLevel,
      triggerConfidenceScore: enrichedResult.triggerConfidenceScore
    });
    savePayoutReceipt(receipt);

    appendTriggerAuditEvent({
      id: receipt?.payoutId || `${now.getTime()}`, createdAt: now.toISOString(), triggerId,
      decision: payoutResult.status, reason: payoutResult.reason, payoutAmount, confidence: enrichedResult.triggerConfidenceScore
    });

    setTriggerAuditEvents(getTriggerAuditEvents().slice(0, 8));
    setWeeklyTrend(getWeeklyTrend(getPayoutHistory()));
    setLastPayoutAmount(payoutAmount);
    setPaidTodayAmount(effectivePaidToday + payoutAmount);
    setLatestPayoutMeta(enrichedResult);
    setLatestTriggerId(triggerId);

    if (payoutAmount > 0 && (payoutResult.status === "paid" || payoutResult.status === "capped")) {
      navigate("/payout");
    }
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const timelineEntries = useMemo(() => [
    { id: '1', premium: displayWeeklyPremium, reason: 'Current premium', changedAt: new Date().toISOString(), platformCount, riskLevel: displayRiskLevel, riskMultiplier: displayRiskMultiplier, deltaMeta: { label: 'Active', classes: 'bg-green-100 text-green-700' } }
  ], [displayWeeklyPremium, platformCount, displayRiskLevel, displayRiskMultiplier]);

  const timelineEntriesWithDelta = useMemo(() => timelineEntries.map(e => ({ ...e, relativeTime: formatRelativeTime(e.changedAt) })), [timelineEntries]);

  const coverageActive = selectedPlatforms.length > 0;

  return (
    <main className="min-h-screen bg-[#f4f5f7] font-sans pb-24 text-gray-900 overflow-x-hidden">
      {/* Dynamic Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">Live</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <button onClick={async () => { await supabase.auth.signOut(); clearSession(); navigate("/auth"); }} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <header className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">{selectLabel(languageMode, "Worker Console", "वर्कर कंसोल")}</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">
                {selectLabel(languageMode, "Hello", "नमस्ते")}, <span className="text-gray-300">{session?.name || "Rider"}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-8 text-sm font-bold text-gray-500">
                <span className="flex items-center gap-2"><MapPin size={16} />{session?.city || "New Delhi"}</span>
                <span className="flex items-center gap-2"><Fingerprint size={16} />{session?.workerId || "GS-8.2k"}</span>
                <span className={`flex items-center gap-2 transition-colors ${coverageActive ? "text-green-600" : "text-red-400"}`}><Clock size={16} />{selectedPlan.coverageHours}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
               <div className="bg-white border-2 border-gray-900 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Weekly Premium", "साप्ताहिक प्रीमियम")}</p>
                  <p className="text-3xl font-black tracking-tighter">{formatCurrency(displayWeeklyPremium)}</p>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Risk Level", "जोखिम स्तर")}</p>
                  <p className={`text-sm font-black uppercase ${displayRiskLevel === "High" ? "text-red-500" : "text-green-600"}`}>{displayRiskLevel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Platform Manager Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{selectLabel(languageMode, "Active Work Apps", "सक्रिय काम के ऐप्स")}</p>
            <p className="text-xs font-bold text-gray-400">{selectedPlatforms.length} {selectLabel(languageMode, "Apps active", "ऐप्स सक्रिय")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {availablePlatforms.map((p) => {
              const isActive = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                    isActive ? "border-gray-900 bg-gray-900 text-white shadow-lg scale-[1.02]" : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-widest">{p}</span>
                    {isActive ? <Check size={14} /> : <Plus size={14} className="text-gray-300" />}
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-white/60" : "text-gray-400"}`}>
                    {isActive ? "Connected" : "Connect"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-12">
            <TriggerSimulationPanel
              triggerEvents={triggerEvents}
              selectedPlanId={selectedPlan.id}
              selectedPlanName={selectedPlan.name}
              latestTrigger={latestTrigger}
              latestPayout={lastPayoutAmount}
              latestPayoutMeta={latestPayoutMeta}
              paidTodayAmount={paidTodayAmount}
              dailyPayoutCap={dailyPayoutCap}
              onSimulateTrigger={handleSimulateTrigger}
              languageMode={languageMode}
            />

            <div className="grid md:grid-cols-2 gap-8">
              <EarningsSnapshot
                earningsProtectedThisWeek={earningsProtectedThisWeek}
                lastPayoutAmount={lastPayoutAmount}
                languageMode={languageMode}
              />
              <ActivityPanel
                activity={activityData}
                lastActiveTime={userProfile.lastActiveTime}
                languageMode={languageMode}
              />
            </div>
          </div>

          {/* Side Feedback */}
          <div className="space-y-12">
            <FraudDetectionIndicator
              fraudProfiles={fraudScores}
              activePersonaKey={activePersonaKey}
              onPersonaChange={setActivePersonaKey}
              languageMode={languageMode}
            />

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{selectLabel(languageMode, "Premium Timeline", "प्रीमियम टाइमलाइन")}</p>
              <div className="space-y-4">
                {timelineEntriesWithDelta.map((e) => (
                  <div key={e.id} className="bg-white border border-gray-200 rounded-3xl p-6 transition-all hover:border-gray-900/10 hover:shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-sm font-black">{formatCurrency(e.premium)} — {e.reason}</p>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${e.deltaMeta.classes}`}>{e.deltaMeta.label}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400">
                      {e.platformCount} platforms | Risk {e.riskLevel} x{Number(e.riskMultiplier).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{selectLabel(languageMode, "Weekly Activity", "साप्ताहिक गतिविधि")}</p>
              <div className="bg-white border border-gray-200 rounded-3xl p-8">
                <div className="flex h-32 items-end justify-between gap-3">
                  {weeklyTrend.map((d) => (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-2">
                       <div className="w-full bg-gray-100 rounded-full overflow-hidden h-full flex flex-col justify-end">
                          <div className="bg-gray-900 rounded-full transition-all duration-1000" style={{ height: `${Math.min(100, d.triggers * 25)}%` }} />
                       </div>
                       <span className="text-[9px] font-black text-gray-400 uppercase">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
