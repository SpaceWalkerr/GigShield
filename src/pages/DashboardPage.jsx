import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { calculateWeeklyPremium } from "../utils/pricing";
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
  fetchWeatherReliability,
  getTriggerAuditEvents,
  getTriggerConfidenceScore,
} from "../utils/triggerEngine";
import { pushNotification } from "../utils/notifications";
import { trackEvent } from "../utils/observability";
import { startRealtimeTriggerMonitor } from "../utils/realtimeMonitor";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const onboardingStorageKey = "gigshieldOnboardingCompleted";
const cityCoordinates = {
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Delhi: { lat: 28.6139, lon: 77.209 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
};

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
    days.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      triggers: 0,
      paidAmount: 0,
      blockedAmount: 0,
      pendingClaims: 0,
    });
  }

  history.forEach((item) => {
    const key = toDayKey(item.createdAt || Date.now());
    const day = days.find((entry) => entry.key === key);
    if (!day) {
      return;
    }
    day.triggers += 1;
    if (item.status === "paid" || item.status === "capped") {
      day.paidAmount += Number(item.payoutAmount || 0);
    } else {
      day.blockedAmount += Number(item.basePayout || 0);
    }
    if (item.lifecycleStatus === "pending-verification" || item.lifecycleStatus === "processing") {
      day.pendingClaims += 1;
    }
  });

  return days;
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
  const [lastActiveTime, setLastActiveTime] = useState(
    activityData.lastActiveTime,
  );
  const [triggerAuditEvents, setTriggerAuditEvents] = useState(() => getTriggerAuditEvents().slice(0, 8));
  const [weeklyTrend, setWeeklyTrend] = useState(() => getWeeklyTrend(getPayoutHistory()));
  const [simulationPlanId, setSimulationPlanId] = useState(selectedPlan.id);
  const [simulationTriggerId, setSimulationTriggerId] = useState(triggerEvents[0]?.id || "");
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(onboardingStorageKey) !== "done",
  );
  const [liveSignals, setLiveSignals] = useState(null);
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const hasAutoTriggeredRef = useRef(false);

  const activeFraudProfile = fraudScores[activePersonaKey] ?? fraudScores.normal;
  const activeRiskLevel = getRiskLevelFromScore(activeFraudProfile.score);

  const latestTrigger =
    triggerEvents.find((event) => event.id === latestTriggerId) ?? null;
  const latestTriggerDomain = latestTrigger?.domain || "";
  const dailyPayoutCap = getDailyPayoutCap(selectedPlan.id);

  const simulationPlan = planDetails.find((plan) => plan.id === simulationPlanId) || selectedPlan;
  const simulationResult = simulationTriggerId
    ? getPayoutForTrigger(triggerEvents, simulationTriggerId, simulationPlan.id, {
        coverageHours: simulationPlan.coverageHours,
        paidTodayAmount,
        atTime: new Date(),
      })
    : null;

  const planRecommendation = planDetails
    .filter((plan) => plan.id !== selectedPlan.id)
    .map((plan) => {
      const comparisonPremium = calculateWeeklyPremium({
        basePremium: plan.weeklyPremium,
        platformCount: displayPlatforms.length,
        riskLevel: session?.riskLevel || "Medium",
      }).adjustedPremium;

      return {
        ...plan,
        comparisonPremium,
        premiumDelta: displayWeeklyPremium - comparisonPremium,
        capDelta: getDailyPayoutCap(plan.id) - getDailyPayoutCap(selectedPlan.id),
      };
    })
    .sort((a, b) => b.premiumDelta - a.premiumDelta)[0];

  const closeOnboarding = () => {
    localStorage.setItem(onboardingStorageKey, "done");
    setShowOnboarding(false);
  };

  const handleSimulateTrigger = async (triggerId) => {
    const now = new Date();
    const triggerRules = evaluateTriggerRules({ triggerId, now });

    if (triggerRules.cooldownBlocked || triggerRules.dedupBlocked) {
      const blockedReason = triggerRules.cooldownBlocked
        ? `Trigger cooling down. Retry in ${triggerRules.cooldownRemainingSec}s.`
        : `Duplicate event blocked. Retry in ${triggerRules.dedupRemainingSec}s.`;

      const status = triggerRules.cooldownBlocked ? "blocked-cooldown" : "blocked-dedup";
      const blockedReceipt = createPayoutReceipt({
        createdAt: now.toISOString(),
        status,
        reason: blockedReason,
        triggerId,
        triggerLabel: triggerEvents.find((event) => event.id === triggerId)?.label ?? triggerId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        payoutAmount: 0,
        basePayout: 0,
        dailyCap: dailyPayoutCap,
        remainingCap: Math.max(0, dailyPayoutCap - paidTodayAmount),
        isCoveredNow: true,
        coverageHours: selectedPlan.coverageHours,
        riskLevel: activeRiskLevel,
        failureReasonCode: "TRIGGER_BLOCKED",
      });
      savePayoutReceipt(blockedReceipt);

      const audit = {
        id: blockedReceipt?.payoutId || `${now.getTime()}`,
        createdAt: now.toISOString(),
        triggerId,
        decision: status,
        reason: blockedReason,
      };
      appendTriggerAuditEvent(audit);
      setTriggerAuditEvents(getTriggerAuditEvents().slice(0, 8));
      setWeeklyTrend(getWeeklyTrend(getPayoutHistory()));
      setLastPayoutAmount(0);
      setLatestPayoutMeta({
        status,
        reason: blockedReason,
        basePayout: 0,
        remainingCap: Math.max(0, dailyPayoutCap - paidTodayAmount),
        dailyCap,
        triggerConfidenceScore: 0,
      });
      setLatestTriggerId(triggerId);

      pushNotification({
        type: "warning",
        title: "Trigger blocked",
        message: blockedReason,
      });
      trackEvent("trigger_blocked", { triggerId, status, blockedReason });
      return;
    }

    const cityCoord = cityCoordinates[displayCity] || cityCoordinates.Bengaluru;
    const weatherReliability = await fetchWeatherReliability(cityCoord);
    const triggerConfidence = getTriggerConfidenceScore({
      triggerId,
      weatherReliability,
      personaRiskLevel: activeRiskLevel,
    });

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
    const enrichedResult = {
      ...payoutResult,
      triggerConfidenceScore: Number((triggerConfidence.score * 100).toFixed(0)),
      triggerConfidenceLabel: triggerConfidence.label,
      weatherReliability,
    };

    const receipt = createPayoutReceipt({
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
      riskLevel: activeRiskLevel,
      triggerConfidenceScore: enrichedResult.triggerConfidenceScore,
      triggerConfidenceLabel: enrichedResult.triggerConfidenceLabel,
      weatherReliability,
    });
    savePayoutReceipt(receipt);

    appendTriggerAuditEvent({
      id: receipt?.payoutId || `${now.getTime()}`,
      createdAt: now.toISOString(),
      triggerId,
      planId: selectedPlan.id,
      decision: payoutResult.status,
      reason: payoutResult.reason,
      payoutAmount,
      confidence: enrichedResult.triggerConfidenceScore,
    });
    setTriggerAuditEvents(getTriggerAuditEvents().slice(0, 8));
    setWeeklyTrend(getWeeklyTrend(getPayoutHistory()));

    setLastPayoutAmount(payoutAmount);
    if (payoutAmount > 0) {
      setEarningsProtectedThisWeek((currentAmount) =>
        applyTriggerToEarnings(currentAmount, payoutAmount),
      );
    }
    setPaidTodayAmount(effectivePaidToday + payoutAmount);
    setLatestPayoutMeta(enrichedResult);
    setLatestTriggerId(triggerId);
    setLastActiveTime(now.toISOString());

    pushNotification({
      type: payoutAmount > 0 ? "success" : "warning",
      title: payoutAmount > 0 ? "Payout approved" : "Payout blocked",
      message: payoutResult.reason,
    });
    trackEvent("trigger_processed", {
      triggerId,
      payoutStatus: payoutResult.status,
      payoutAmount,
      confidence: enrichedResult.triggerConfidenceScore,
    });
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

  useEffect(() => {
    const stop = startRealtimeTriggerMonitor({
      city: displayCity,
      platforms: displayPlatforms,
      onSnapshot: (snapshot) => {
        setLiveSignals(snapshot);
      },
    });

    return () => {
      stop();
    };
  }, [displayCity, displayPlatforms]);

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
              {session?.role === "admin" ? (
                <Link to="/admin/ops" className="secondary-btn">
                  {selectLabel(languageMode, "Admin Ops", "एडमिन ऑप्स")}
                </Link>
              ) : null}
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
                  "2. Tap Receive Payout and complete selfie verification",
                  "2. भुगतान प्राप्त करें दबाएं और सेल्फी सत्यापन पूरा करें",
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
        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Why this payout amount", "यह भुगतान राशि क्यों")}</p>
          <p className="mt-2 text-sm text-coal-700">
            {selectLabel(
              languageMode,
              `Base ${formatCurrency(Number(latestPayoutMeta.basePayout || 0))} -> Remaining Cap ${formatCurrency(Number(latestPayoutMeta.remainingCap || 0))} -> Paid ${formatCurrency(lastPayoutAmount)} (${latestPayoutMeta.status || "idle"})`,
              `बेस ${formatCurrency(Number(latestPayoutMeta.basePayout || 0))} -> बची सीमा ${formatCurrency(Number(latestPayoutMeta.remainingCap || 0))} -> भुगतान ${formatCurrency(lastPayoutAmount)} (${latestPayoutMeta.status || "idle"})`,
            )}
          </p>
          <p className="mt-2 text-xs text-coal-600">
            {selectLabel(languageMode, "Trigger confidence", "ट्रिगर भरोसा")}: {latestPayoutMeta.triggerConfidenceScore || 0}% ({latestPayoutMeta.triggerConfidenceLabel || "-"})
          </p>
          {latestTriggerDomain === "social" ? (
            <p className="mt-2 rounded-lg border border-coal-200 bg-white px-3 py-2 text-xs text-coal-700">
              {selectLabel(
                languageMode,
                "Social disruption rationale: payouts are based on zone access loss, expected shift interruption, and plan coverage constraints.",
                "सामाजिक व्यवधान कारण: भुगतान ज़ोन पहुंच हानि, शिफ्ट बाधा अनुमान और योजना कवरेज सीमाओं पर आधारित है।",
              )}
            </p>
          ) : null}
        </article>

        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Plan recommendation", "योजना सुझाव")}</p>
          {planRecommendation ? (
            <>
              <p className="mt-2 text-sm font-semibold text-coal-900">{planRecommendation.name}</p>
              <p className="mt-1 text-xs text-coal-600">
                {planRecommendation.premiumDelta > 0
                  ? selectLabel(
                    languageMode,
                    `Switch plan to save ${formatCurrency(planRecommendation.premiumDelta)} per week`,
                    `योजना बदलकर प्रति सप्ताह ${formatCurrency(planRecommendation.premiumDelta)} बचाएं`,
                  )
                  : selectLabel(
                    languageMode,
                    `Switch plan for +${formatCurrency(Math.abs(planRecommendation.capDelta))} daily cap potential`,
                    `योजना बदलकर +${formatCurrency(Math.abs(planRecommendation.capDelta))} दैनिक सीमा पाएँ`,
                  )}
              </p>
              <p className="mt-1 text-xs text-coal-600">
                {selectLabel(languageMode, "Coverage", "कवरेज")}: {planRecommendation.coverageHours}
              </p>
            </>
          ) : null}
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Weekly trend", "साप्ताहिक ट्रेंड")}</p>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {weeklyTrend.map((day) => {
              const barHeight = Math.min(100, day.triggers * 20 + day.pendingClaims * 10);
              return (
                <div key={day.key} className="flex flex-col items-center gap-1 text-[10px] text-coal-600">
                  <div className="flex h-24 w-8 items-end rounded bg-coal-100">
                    <div className="w-full rounded bg-electric-500" style={{ height: `${barHeight}%` }} />
                  </div>
                  <span>{day.label}</span>
                  <span>{day.triggers}T</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-coal-600">
            {selectLabel(languageMode, "Legend", "लीजेंड")}: T={selectLabel(languageMode, "Triggers", "ट्रिगर्स")}
          </p>
        </article>

        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Claim simulation", "क्लेम सिमुलेशन")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-coal-600">
              {selectLabel(languageMode, "Plan", "योजना")}
              <select
                className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm"
                value={simulationPlanId}
                onChange={(event) => setSimulationPlanId(event.target.value)}
              >
                {planDetails.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-coal-600">
              {selectLabel(languageMode, "Trigger", "ट्रिगर")}
              <select
                className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm"
                value={simulationTriggerId}
                onChange={(event) => setSimulationTriggerId(event.target.value)}
              >
                {triggerEvents.map((event) => (
                  <option key={event.id} value={event.id}>{event.label}</option>
                ))}
              </select>
            </label>
          </div>

          {simulationResult ? (
            <div className="mt-3 rounded-lg border border-coal-200 bg-white p-3 text-xs text-coal-700">
              <p>{selectLabel(languageMode, "Predicted payout", "अनुमानित भुगतान")}: {formatCurrency(simulationResult.payoutAmount || 0)}</p>
              <p>{selectLabel(languageMode, "Status", "स्थिति")}: {simulationResult.status}</p>
              <p>{selectLabel(languageMode, "Reason", "कारण")}: {simulationResult.reason}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="mt-4">
        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Event audit timeline", "इवेंट ऑडिट टाइमलाइन")}</p>
          <div className="mt-3 space-y-2">
            {triggerAuditEvents.length === 0 ? (
              <p className="text-xs text-coal-600">{selectLabel(languageMode, "No audits yet", "अभी कोई ऑडिट नहीं")}</p>
            ) : (
              triggerAuditEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-coal-200 bg-white px-3 py-2 text-xs text-coal-700">
                  <p className="font-semibold text-coal-900">{event.triggerId}{" -> "}{event.decision}</p>
                  <p>{new Date(event.createdAt).toLocaleString()}</p>
                  <p>{event.reason}</p>
                  {event.confidence ? <p>Confidence: {event.confidence}%</p> : null}
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="mt-4">
        <article className="board-soft p-4">
          <p className="kicker">{selectLabel(languageMode, "Live signal health", "लाइव सिग्नल स्वास्थ्य")}</p>
          {!liveSignals ? (
            <p className="mt-2 text-xs text-coal-600">{selectLabel(languageMode, "Waiting for snapshots...", "स्नैपशॉट का इंतज़ार...")}</p>
          ) : (
            <div className="mt-2 grid gap-2 text-xs text-coal-700 sm:grid-cols-3">
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                {selectLabel(languageMode, "Traffic congestion", "ट्रैफिक भीड़")}:
                {" "}{liveSignals.traffic?.congestion ?? "-"}%
              </p>
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                {selectLabel(languageMode, "Platforms degraded", "प्रभावित प्लेटफॉर्म")}: {liveSignals.degradedCount}
              </p>
              <p className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                {selectLabel(languageMode, "Signal reliability", "सिग्नल भरोसा")}: {(Number(liveSignals.reliability || 0) * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </article>
      </section>

      <nav className="fixed bottom-3 left-1/2 z-40 flex w-[95%] max-w-md -translate-x-1/2 items-center justify-between rounded-full border border-coal-200 bg-white/95 px-3 py-2 shadow-edge lg:hidden">
        <button type="button" className="text-xs font-semibold text-coal-700" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {selectLabel(languageMode, "Trigger", "ट्रिगर")}
        </button>
        <Link to="/payout" className="text-xs font-semibold text-coal-700">
          {selectLabel(languageMode, "Verify", "वेरिफाई")}
        </Link>
        <Link to="/payout" className="text-xs font-semibold text-coal-700">
          {selectLabel(languageMode, "Receive", "प्राप्त")}
        </Link>
        <Link to="/payout/history" className="text-xs font-semibold text-coal-700">
          {selectLabel(languageMode, "History", "इतिहास")}
        </Link>
      </nav>

      {showOnboarding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-coal-900/40 px-4">
          <article className="w-full max-w-lg rounded-2xl border border-coal-200 bg-white p-5 shadow-edge">
            <p className="kicker">{selectLabel(languageMode, "How payout works", "भुगतान कैसे काम करता है")}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-coal-700">
              <li>{selectLabel(languageMode, "Trigger event is detected", "ट्रिगर इवेंट पहचाना जाता है")}</li>
              <li>{selectLabel(languageMode, "Risk and confidence checks run", "जोखिम और भरोसा जांच चलती है")}</li>
              <li>{selectLabel(languageMode, "Verification may be required", "सत्यापन आवश्यक हो सकता है")}</li>
              <li>{selectLabel(languageMode, "Payout settles and receipt is stored", "भुगतान सेटल होता है और रसीद सुरक्षित होती है")}</li>
            </ol>
            <div className="mt-4 flex justify-end">
              <button type="button" className="primary-btn" onClick={closeOnboarding}>
                {selectLabel(languageMode, "Start demo", "डेमो शुरू करें")}
              </button>
            </div>
          </article>
        </div>
      ) : null}

    </main>
  );
}

export default DashboardPage;
