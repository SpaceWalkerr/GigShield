import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActivityPanel from "../components/ActivityPanel";
import EarningsSnapshot from "../components/EarningsSnapshot";
import FraudDetectionIndicator from "../components/FraudDetectionIndicator";
import PlanSummary from "../components/PlanSummary";
import SelfieVerificationPanel from "../components/SelfieVerificationPanel";
import TriggerSimulationPanel from "../components/TriggerSimulationPanel";
import LanguageToggle from "../components/LanguageToggle";
import activityData from "../data/activityData.json";
import fraudScores from "../data/fraudScores.json";
import planDetails from "../data/planDetails.json";
import triggerEvents from "../data/triggerEvents.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import { getRiskLevelFromScore, requiresVerification } from "../utils/fraud";
import {
  applyTriggerToEarnings,
  getDailyPayoutCap,
  getPayoutForTrigger,
} from "../utils/payout";
import { clearSession, getSession } from "../utils/session";
import { savePayoutReceipt } from "../utils/payoutReceipt";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const verificationWindowMs = 10 * 60 * 1000;
const gestureOptions = [
  { key: "open_palm", label: "Show an open palm (hold 3 seconds)" },
  { key: "fist", label: "Show a closed fist (hold 3 seconds)" },
  { key: "thumbs_up", label: "Show a thumbs up (hold 3 seconds)" },
  { key: "peace", label: "Show a peace sign (hold 3 seconds)" },
  { key: "point_up", label: "Point up with index finger (hold 3 seconds)" },
  { key: "ok", label: "Make an OK sign (hold 3 seconds)" },
  { key: "three", label: "Show three fingers (hold 3 seconds)" },
  { key: "four", label: "Show four fingers (hold 3 seconds)" },
  { key: "both_hands", label: "Hold both hands in frame (hold 3 seconds)" },
  { key: "wave", label: "Wave (move left-right twice, then hold)" },
  { key: "move_closer", label: "Move hand closer to camera, then hold" },
  { key: "move_farther", label: "Move hand farther from camera, then hold" },
];

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getDeltaMeta(amount) {
  if (amount > 0) {
    return {
      label: `+${formatCurrency(amount)}`,
      classes: "bg-moss-100 text-moss-600",
    };
  }

  if (amount < 0) {
    return {
      label: `-${formatCurrency(Math.abs(amount))}`,
      classes: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "No change",
    classes: "bg-coal-100 text-coal-700",
  };
}

/*
 * Main demo console for the worker journey.
 * Local state tracks the selected plan, payouts, trigger history, and fraud persona simulation.
 */
function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = getSession();
  const planIdFromUrl = searchParams.get("plan");
  const triggerIdFromUrl = searchParams.get("trigger");
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const resolvedPlanId =
    planIdFromUrl ||
    session?.selectedPlanId ||
    persistedPlanId ||
    userProfile.selectedPlanId;
  const displayName = session?.name || userProfile.name;
  const displayCity = session?.city || userProfile.city;
  const displayPlatforms = session?.platforms || userProfile.platforms;
  const selectedPlan =
    planDetails.find((plan) => plan.id === resolvedPlanId) ??
    planDetails[0];
  const derivedPremiumBreakdown = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: displayPlatforms.length,
    riskLevel: session?.riskLevel || "Medium",
  });
  const displayPremiumBreakdown =
    session?.premiumBreakdown || derivedPremiumBreakdown;
  const displayWeeklyPremium = displayPremiumBreakdown.adjustedPremium;
  const premiumHistory =
    session?.premiumHistory && session.premiumHistory.length > 0
      ? session.premiumHistory
      : [
          {
            id: "fallback",
            reason: "Initial premium setup",
            changedAt: session?.signedInAt || new Date().toISOString(),
            premium: displayPremiumBreakdown.adjustedPremium,
            platformCount: displayPremiumBreakdown.platformCount,
            riskLevel: displayPremiumBreakdown.riskLevel,
            basePremium: displayPremiumBreakdown.basePremium,
            platformLoadFee: displayPremiumBreakdown.platformLoadFee,
            riskMultiplier: displayPremiumBreakdown.riskMultiplier,
          },
        ];
  const timelineEntries = premiumHistory.slice(0, 5).map((entry, index) => {
    const previousEntry = premiumHistory[index + 1];
    const previousPremium = previousEntry?.premium ?? entry.premium;
    const deltaAmount = entry.premium - previousPremium;

    return {
      ...entry,
      deltaAmount,
      deltaMeta: getDeltaMeta(deltaAmount),
      relativeTime: formatRelativeTime(entry.changedAt),
    };
  });

  const [coverageActive] = useState(userProfile.coverageActive);
  const [earningsProtectedThisWeek, setEarningsProtectedThisWeek] = useState(
    userProfile.earningsProtectedThisWeek,
  );
  const [lastPayoutAmount, setLastPayoutAmount] = useState(
    userProfile.lastPayoutAmount,
  );
  const [paidTodayAmount, setPaidTodayAmount] = useState(0);
  const [payoutDayKey, setPayoutDayKey] = useState(new Date().toDateString());
  const [latestPayoutMeta, setLatestPayoutMeta] = useState({
    status: "idle",
    reason: "",
    basePayout: 0,
    remainingCap: getDailyPayoutCap(selectedPlan.id),
    dailyCap: getDailyPayoutCap(selectedPlan.id),
  });
  const [latestTriggerId, setLatestTriggerId] = useState("");
  const [activePersonaKey, setActivePersonaKey] = useState("normal");
  const [verificationState, setVerificationState] = useState({
    status: "idle",
    gesture: "",
    gestureKey: "",
    issuedAt: "",
    verifiedAt: "",
    evidence: null,
  });
  const [lastActiveTime, setLastActiveTime] = useState(
    activityData.lastActiveTime,
  );
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const hasAutoTriggeredRef = useRef(false);

  const activeFraudProfile = fraudScores[activePersonaKey] ?? fraudScores.normal;
  const activeRiskLevel = getRiskLevelFromScore(activeFraudProfile.score);
  const verificationRequired = requiresVerification(activeRiskLevel);

  const latestTrigger =
    triggerEvents.find((event) => event.id === latestTriggerId) ?? null;
  const dailyPayoutCap = getDailyPayoutCap(selectedPlan.id);

  const handleGenerateChallenge = () => {
    const randomGesture = gestureOptions[Math.floor(Math.random() * gestureOptions.length)];
    setVerificationState({
      status: "pending",
      gesture: randomGesture.label,
      gestureKey: randomGesture.key,
      issuedAt: new Date().toISOString(),
      verifiedAt: "",
      evidence: null,
    });
  };

  const handleApproveVerification = (evidence) => {
    setVerificationState((current) => ({
      ...current,
      status: "verified",
      verifiedAt: new Date().toISOString(),
      evidence: evidence ?? null,
    }));
  };

  const handleResetVerification = () => {
    setVerificationState({
      status: "idle",
      gesture: "",
      gestureKey: "",
      issuedAt: "",
      verifiedAt: "",
      evidence: null,
    });
  };

  const handleSimulateTrigger = (triggerId) => {
    const now = new Date();
    const verificationFresh =
      verificationState.status === "verified" &&
      verificationState.verifiedAt &&
      now.getTime() - new Date(verificationState.verifiedAt).getTime() <= verificationWindowMs;

    if (verificationRequired && !verificationFresh) {
      savePayoutReceipt({
        createdAt: now.toISOString(),
        status: "blocked-verification",
        reason:
          "Selfie gesture verification required for high-risk profile. Complete challenge to proceed.",
        triggerId,
        planId: selectedPlan.id,
        payoutAmount: 0,
      });
      setLatestTriggerId(triggerId);
      setLastPayoutAmount(0);
      setLatestPayoutMeta({
        status: "blocked-verification",
        reason:
          "Selfie gesture verification required for high-risk profile. Complete challenge to proceed.",
        basePayout: 0,
        remainingCap: Math.max(0, dailyPayoutCap - paidTodayAmount),
        dailyCap: dailyPayoutCap,
      });
      return;
    }

    const todayKey = now.toDateString();
    const effectivePaidToday = todayKey === payoutDayKey ? paidTodayAmount : 0;

    if (todayKey !== payoutDayKey) {
      setPayoutDayKey(todayKey);
      setPaidTodayAmount(0);
    }

    const payoutResult = getPayoutForTrigger(
      triggerEvents,
      triggerId,
      selectedPlan.id,
      {
        coverageHours: selectedPlan.coverageHours,
        paidTodayAmount: effectivePaidToday,
        atTime: now,
      },
    );
    const payoutAmount = payoutResult.payoutAmount;

    savePayoutReceipt({
      createdAt: now.toISOString(),
      status: payoutResult.status,
      reason: payoutResult.reason,
      triggerId,
      triggerLabel: triggerEvents.find((event) => event.id === triggerId)?.label ?? triggerId,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      payoutAmount,
      basePayout: payoutResult.basePayout,
      dailyCap: payoutResult.dailyCap,
      remainingCap: payoutResult.remainingCap,
      isCoveredNow: payoutResult.isCoveredNow,
      coverageHours: payoutResult.coverageHours,
    });

    setLastPayoutAmount(payoutAmount);
    if (payoutAmount > 0) {
      setEarningsProtectedThisWeek((currentAmount) =>
        applyTriggerToEarnings(currentAmount, payoutAmount),
      );
    }
    setPaidTodayAmount(effectivePaidToday + payoutAmount);
    setLatestPayoutMeta(payoutResult);
    setLatestTriggerId(triggerId);
    setLastActiveTime(now.toISOString());
  };

  useEffect(() => {
    if (!triggerIdFromUrl || hasAutoTriggeredRef.current) {
      return;
    }

    const triggerExists = triggerEvents.some((event) => event.id === triggerIdFromUrl);
    if (!triggerExists) {
      return;
    }

    hasAutoTriggeredRef.current = true;
    const timeoutId = window.setTimeout(() => {
      handleSimulateTrigger(triggerIdFromUrl);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // handleSimulateTrigger has broad state deps; keep this effect URL-driven only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerIdFromUrl]);

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <header className="board animate-enter mb-5 overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Easy Demo: press weather/problem buttons and see instant support payout.",
            "सरल डेमो: मौसम/समस्या बटन दबाएं और तुरंत भुगतान देखें।",
          )}
        </div>

        <div className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="kicker">
                {selectLabel(languageMode, "Worker Dashboard", "वर्कर डैशबोर्ड")}
              </p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "Hello", "नमस्ते")} {displayName}
              </h1>
              <p className="mt-3 text-sm text-coal-500">
                {selectLabel(languageMode, "Apps", "ऐप्स")}: {displayPlatforms.join(", ")} | {" "}
                {selectLabel(languageMode, "City", "शहर")}: {displayCity}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle
                languageMode={languageMode}
                setLanguageMode={setLanguageMode}
              />
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  coverageActive
                    ? "bg-moss-100 text-moss-600"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {coverageActive
                  ? selectLabel(languageMode, "Coverage Active", "कवरेज चालू")
                  : selectLabel(languageMode, "Coverage Paused", "कवरेज रुका")}
              </span>
              <Link to="/" className="secondary-btn">
                {selectLabel(languageMode, "Back to Landing", "मुखपृष्ठ पर जाएं")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  navigate("/auth");
                }}
                className="secondary-btn"
              >
                {selectLabel(languageMode, "Sign Out", "लॉग आउट")}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Current Plan", "मौजूदा योजना")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {selectedPlan.name}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Weekly Premium", "साप्ताहिक प्रीमियम")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {formatCurrency(displayWeeklyPremium)}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Coverage Hours", "कवरेज समय")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {selectedPlan.coverageHours}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Premium Logic", "प्रीमियम का हिसाब")}</p>
              <p className="mt-1 text-sm font-semibold text-coal-900">
                {selectLabel(languageMode, "Base", "मूल")}
                {" "}
                {formatCurrency(displayPremiumBreakdown.basePremium)} + {selectLabel(languageMode, "load", "लोड")}{" "}
                {formatCurrency(displayPremiumBreakdown.platformLoadFee)}
              </p>
              <p className="mt-1 text-xs text-coal-600">
                {displayPremiumBreakdown.platformCount} {selectLabel(languageMode, "platforms", "ऐप्स")} | {" "}
                {selectLabel(languageMode, "Risk", "जोखिम")} {displayPremiumBreakdown.riskLevel} x
                {displayPremiumBreakdown.riskMultiplier.toFixed(2)}
              </p>
            </article>
          </div>

          <article className="board-soft mt-4 p-4">
            <p className="kicker">
              {selectLabel(languageMode, "Why Premium Changed", "प्रीमियम क्यों बदला")}
            </p>
            <p className="mt-1 text-xs text-coal-600">
              {selectLabel(
                languageMode,
                "Each event logs what changed and how much it moved the weekly premium.",
                "हर इवेंट बताता है कि प्रीमियम कितना बदला।",
              )}
            </p>
            <div className="mt-3 space-y-2">
              {timelineEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-coal-900">
                      {formatCurrency(entry.premium)} | {entry.reason}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-coal-500">
                        {entry.relativeTime}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${entry.deltaMeta.classes}`}
                      >
                        {entry.deltaMeta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-coal-600">
                    {entry.platformCount} platforms | Risk {entry.riskLevel} x
                    {Number(entry.riskMultiplier).toFixed(2)} | Base {formatCurrency(entry.basePremium)} + load{" "}
                    {formatCurrency(entry.platformLoadFee)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="board-soft mt-4 p-4">
            <p className="kicker">{selectLabel(languageMode, "How To Use", "कैसे उपयोग करें")}</p>
            <div className="mt-2 grid gap-2 text-sm text-coal-800 sm:grid-cols-3">
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                {selectLabel(
                  languageMode,
                  "1. Press a problem button (Rain / Heat / AQI / Outage)",
                  "1. समस्या बटन दबाएं (बारिश / गर्मी / AQI / प्लेटफॉर्म बंद)",
                )}
              </p>
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                {selectLabel(
                  languageMode,
                  "2. If risk is high, do selfie gesture verification",
                  "2. जोखिम अधिक हो तो सेल्फी जेस्चर सत्यापन करें",
                )}
              </p>
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                {selectLabel(
                  languageMode,
                  "3. Check payout and protected money update instantly",
                  "3. भुगतान और सुरक्षित राशि का तुरंत अपडेट देखें",
                )}
              </p>
            </div>
          </article>
        </div>
      </header>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
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
        <EarningsSnapshot
          earningsProtectedThisWeek={earningsProtectedThisWeek}
          lastPayoutAmount={lastPayoutAmount}
          languageMode={languageMode}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <PlanSummary
          selectedPlan={selectedPlan}
          coverageActive={coverageActive}
          languageMode={languageMode}
        />
        <ActivityPanel
          activity={activityData}
          lastActiveTime={lastActiveTime}
          languageMode={languageMode}
        />
        <FraudDetectionIndicator
          fraudProfiles={fraudScores}
          activePersonaKey={activePersonaKey}
          onPersonaChange={setActivePersonaKey}
          languageMode={languageMode}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <SelfieVerificationPanel
          requiresVerification={verificationRequired}
          verificationState={verificationState}
          onGenerateChallenge={handleGenerateChallenge}
          onApproveVerification={handleApproveVerification}
          onResetVerification={handleResetVerification}
          languageMode={languageMode}
        />
      </section>
    </main>
  );
}

export default DashboardPage;
