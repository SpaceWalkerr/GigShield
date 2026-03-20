import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActivityPanel from "../components/ActivityPanel";
import EarningsSnapshot from "../components/EarningsSnapshot";
import FraudDetectionIndicator from "../components/FraudDetectionIndicator";
import PlanSummary from "../components/PlanSummary";
import SelfieVerificationPanel from "../components/SelfieVerificationPanel";
import TriggerSimulationPanel from "../components/TriggerSimulationPanel";
import activityData from "../data/activityData.json";
import fraudScores from "../data/fraudScores.json";
import planDetails from "../data/planDetails.json";
import triggerEvents from "../data/triggerEvents.json";
import userProfile from "../data/userProfile.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium } from "../utils/pricing";
import { languageModes, selectLabel } from "../utils/i18n";
import { getRiskLevelFromScore, requiresVerification } from "../utils/fraud";
import {
  applyTriggerToEarnings,
  getDailyPayoutCap,
  getPayoutForTrigger,
} from "../utils/payout";
import { clearSession, getSession } from "../utils/session";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const verificationWindowMs = 10 * 60 * 1000;
const gestureOptions = [
  "Raise your right hand",
  "Thumbs up with left hand",
  "Touch your chin with index finger",
  "Show peace sign near your shoulder",
  "Look left and blink once",
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
    issuedAt: "",
    verifiedAt: "",
  });
  const [lastActiveTime, setLastActiveTime] = useState(
    activityData.lastActiveTime,
  );
  const [isEasyMode, setIsEasyMode] = useState(true);
  const [languageMode, setLanguageMode] = useState(languageModes.BOTH);

  const activeFraudProfile = fraudScores[activePersonaKey] ?? fraudScores.normal;
  const activeRiskLevel = getRiskLevelFromScore(activeFraudProfile.score);
  const verificationRequired = requiresVerification(activeRiskLevel);

  const latestTrigger =
    triggerEvents.find((event) => event.id === latestTriggerId) ?? null;
  const dailyPayoutCap = getDailyPayoutCap(selectedPlan.id);

  const handleGenerateChallenge = () => {
    const randomGesture =
      gestureOptions[Math.floor(Math.random() * gestureOptions.length)];
    setVerificationState({
      status: "pending",
      gesture: randomGesture,
      issuedAt: new Date().toISOString(),
      verifiedAt: "",
    });
  };

  const handleApproveVerification = () => {
    setVerificationState((current) => ({
      ...current,
      status: "verified",
      verifiedAt: new Date().toISOString(),
    }));
  };

  const handleResetVerification = () => {
    setVerificationState({
      status: "idle",
      gesture: "",
      issuedAt: "",
      verifiedAt: "",
    });
  };

  const handleSimulateTrigger = (triggerId) => {
    const now = new Date();
    const verificationFresh =
      verificationState.status === "verified" &&
      verificationState.verifiedAt &&
      now.getTime() - new Date(verificationState.verifiedAt).getTime() <= verificationWindowMs;

    if (verificationRequired && !verificationFresh) {
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

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <header className="board animate-enter mb-5 overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Easy Demo: press weather/problem buttons and see instant support payout.",
            "Saral Demo: mausam/samasya button dabayein aur turant payout dekhein.",
          )}
        </div>

        <div className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="kicker">
                {selectLabel(languageMode, "Worker Dashboard", "Worker dashboard")}
              </p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "Hello", "Namaste")} {displayName}
              </h1>
              <p className="mt-3 text-sm text-coal-500">
                {selectLabel(languageMode, "Apps", "Apps")}: {displayPlatforms.join(", ")} | {" "}
                {selectLabel(languageMode, "City", "Shehar")}: {displayCity}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEasyMode((current) => !current)}
                className="primary-btn"
              >
                {selectLabel(languageMode, "Easy Mode", "Saral Mode")}: {isEasyMode ? "ON" : "OFF"}
              </button>
              <div className="board-soft flex items-center gap-1 p-1">
                <button
                  type="button"
                  onClick={() => setLanguageMode(languageModes.ENGLISH)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    languageMode === languageModes.ENGLISH
                      ? "bg-coal-900 text-white"
                      : "text-coal-700"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageMode(languageModes.HINDI)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    languageMode === languageModes.HINDI
                      ? "bg-coal-900 text-white"
                      : "text-coal-700"
                  }`}
                >
                  Hindi
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageMode(languageModes.BOTH)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    languageMode === languageModes.BOTH
                      ? "bg-coal-900 text-white"
                      : "text-coal-700"
                  }`}
                >
                  Both
                </button>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  coverageActive
                    ? "bg-moss-100 text-moss-600"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {coverageActive
                  ? selectLabel(languageMode, "Coverage Active", "Coverage chalu")
                  : selectLabel(languageMode, "Coverage Paused", "Coverage ruka")}
              </span>
              <Link to="/" className="secondary-btn">
                {selectLabel(languageMode, "Back to Landing", "Home par jao")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  navigate("/auth");
                }}
                className="secondary-btn"
              >
                {selectLabel(languageMode, "Sign Out", "Bahar niklein")}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Current Plan", "Maujooda yojana")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {selectedPlan.name}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Weekly Premium", "Hafte ka premium")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {formatCurrency(displayWeeklyPremium)}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Coverage Hours", "Coverage samay")}</p>
              <p className="mt-1 text-lg font-semibold text-coal-900">
                {selectedPlan.coverageHours}
              </p>
            </article>
            <article className="board-soft p-3">
              <p className="kicker">{selectLabel(languageMode, "Premium Logic", "Premium ka hisaab")}</p>
              <p className="mt-1 text-sm font-semibold text-coal-900">
                Base {formatCurrency(displayPremiumBreakdown.basePremium)} + load{" "}
                {formatCurrency(displayPremiumBreakdown.platformLoadFee)}
              </p>
              <p className="mt-1 text-xs text-coal-600">
                {displayPremiumBreakdown.platformCount} {selectLabel(languageMode, "platforms", "apps")} | {" "}
                {selectLabel(languageMode, "Risk", "Jokhim")} {displayPremiumBreakdown.riskLevel} x
                {displayPremiumBreakdown.riskMultiplier.toFixed(2)}
              </p>
            </article>
          </div>

          <article className="board-soft mt-4 p-4">
            <p className="kicker">
              {selectLabel(languageMode, "Why Premium Changed", "Premium kyun badla")}
            </p>
            <p className="mt-1 text-xs text-coal-600">
              {selectLabel(
                languageMode,
                "Each event logs what changed and how much it moved the weekly premium.",
                "Har event batata hai premium kitna badla.",
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

          {isEasyMode ? (
            <article className="board-soft mt-4 p-4">
              <p className="kicker">How To Use | Kaise Use Karein</p>
              <div className="mt-2 grid gap-2 text-sm text-coal-800 sm:grid-cols-3">
                <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                  1. Press a problem button (Rain / Heat / AQI / Outage)
                </p>
                <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                  2. If risk is high, do selfie gesture verification
                </p>
                <p className="rounded-lg border border-coal-200 bg-white px-3 py-2 font-semibold">
                  3. Check payout and protected money update instantly
                </p>
              </div>
            </article>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <PlanSummary
          selectedPlan={selectedPlan}
          coverageActive={coverageActive}
          isEasyMode={isEasyMode}
          languageMode={languageMode}
        />
        <EarningsSnapshot
          earningsProtectedThisWeek={earningsProtectedThisWeek}
          lastPayoutAmount={lastPayoutAmount}
          isEasyMode={isEasyMode}
          languageMode={languageMode}
        />
      </section>

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
          isEasyMode={isEasyMode}
          languageMode={languageMode}
        />
        <FraudDetectionIndicator
          fraudProfiles={fraudScores}
          activePersonaKey={activePersonaKey}
          onPersonaChange={setActivePersonaKey}
          isEasyMode={isEasyMode}
          languageMode={languageMode}
        />
        <ActivityPanel
          activity={activityData}
          lastActiveTime={lastActiveTime}
          isEasyMode={isEasyMode}
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
          isEasyMode={isEasyMode}
          languageMode={languageMode}
        />
      </section>
    </main>
  );
}

export default DashboardPage;
