import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Fingerprint, Clock, Plus, Check } from "lucide-react";
import ActivityPanel from "../components/ActivityPanel";
import AutomationPanel from "../components/AutomationPanel";
import EarningsSnapshot from "../components/EarningsSnapshot";
import FraudDetectionIndicator from "../components/FraudDetectionIndicator";
import IncomeRadarPanel from "../components/IncomeRadarPanel";
import PlanSummary from "../components/PlanSummary";
import WeatherRadarMap from "../components/WeatherRadarMap";
import TriggerSimulationPanel from "../components/TriggerSimulationPanel";
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
import { getDailyPayoutCap, getPayoutForTrigger } from "../utils/payout";
import {
  createPayoutReceipt,
  getPayoutHistory,
  hydratePayoutHistory,
  savePayoutReceipt,
} from "../utils/payoutReceipt";
import {
  appendTriggerAuditEvent,
  evaluateTriggerRules,
  getTriggerAuditEvents,
  getTriggerConfidenceScore,
  hydrateTriggerAuditEvents,
} from "../utils/triggerEngine";
import {
  buildPredictiveAssessment,
  createPredictivePolicyConfig,
  deriveLiveSignalsFromComposite,
  hydratePredictiveAssessments,
  getPredictivePolicySavedAt,
  loadPredictivePolicyConfig,
  getLatestPredictiveAssessment,
  getPredictiveAssessments,
  savePredictivePolicyConfig,
  savePredictiveAssessment,
} from "../utils/predictiveSafetyNet";
import { getCompositeDisruptionSignals } from "../utils/integrations";
import { computeReputationProfile } from "../utils/reputation";
import { getPlanOptimizerRecommendation } from "../utils/planOptimizer";
import { AppSurface } from "../components/ui/app-page-shell";
import { buildIncomeRadar } from "../utils/incomeRadar";
import { saveIncomeRadarSnapshot } from "../services/backend/incomeRadarService";
import { useHydratedSession } from "../hooks/useHydratedSession";
import { fetchDashboardMetrics } from "../services/backend/dashboardMetricsService";

const selectedPlanStorageKey = "gigshieldSelectedPlanId";
const backendPersistenceEnabled =
  import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

const predictivePolicyBaseline = createPredictivePolicyConfig({
  riskThreshold: {
    Low: 0.72,
    Medium: 0.79,
    High: 0.87,
  },
  advanceRatioByRisk: {
    Low: 0.35,
    Medium: 0.27,
    High: 0.2,
  },
});

const predictivePolicyPresets = {
  conservative: {
    riskThreshold: { Low: 82, Medium: 88, High: 93 },
    advanceRatioByRisk: { Low: 20, Medium: 14, High: 10 },
  },
  balanced: {
    riskThreshold: { Low: 72, Medium: 79, High: 87 },
    advanceRatioByRisk: { Low: 35, Medium: 27, High: 20 },
  },
  aggressive: {
    riskThreshold: { Low: 64, Medium: 71, High: 80 },
    advanceRatioByRisk: { Low: 45, Medium: 35, High: 25 },
  },
};

function toPercentDraft(policyConfig) {
  return {
    riskThreshold: {
      Low: Math.round((policyConfig.riskThreshold.Low || 0) * 100),
      Medium: Math.round((policyConfig.riskThreshold.Medium || 0) * 100),
      High: Math.round((policyConfig.riskThreshold.High || 0) * 100),
    },
    advanceRatioByRisk: {
      Low: Math.round((policyConfig.advanceRatioByRisk.Low || 0) * 100),
      Medium: Math.round((policyConfig.advanceRatioByRisk.Medium || 0) * 100),
      High: Math.round((policyConfig.advanceRatioByRisk.High || 0) * 100),
    },
  };
}

function toConfigFromPercentDraft(draft, currentPolicyConfig) {
  return createPredictivePolicyConfig({
    riskPenalty: currentPolicyConfig.riskPenalty,
    riskThreshold: {
      Low: Number(draft.riskThreshold.Low || 0) / 100,
      Medium: Number(draft.riskThreshold.Medium || 0) / 100,
      High: Number(draft.riskThreshold.High || 0) / 100,
    },
    advanceRatioByRisk: {
      Low: Number(draft.advanceRatioByRisk.Low || 0) / 100,
      Medium: Number(draft.advanceRatioByRisk.Medium || 0) / 100,
      High: Number(draft.advanceRatioByRisk.High || 0) / 100,
    },
  });
}

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
    if (!day) return;
    day.triggers += 1;
    if (item.status === "paid" || item.status === "capped")
      day.paidAmount += Number(item.payoutAmount || 0);
    if (
      item.lifecycleStatus === "pending-verification" ||
      item.lifecycleStatus === "processing"
    )
      day.pendingClaims += 1;
  });
  return days;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, setSession } = useHydratedSession();
  const { languageMode } = useSiteLanguage();

  // Core States
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "Swiggy",
    "Zomato",
    "Blinkit",
  ]);
  const [activePersonaKey, setActivePersonaKey] = useState("normal");
  const [lastPayoutAmount, setLastPayoutAmount] = useState(
    () => getPayoutHistory()[0]?.payoutAmount ?? userProfile.lastPayoutAmount,
  );
  const [paidTodayAmount, setPaidTodayAmount] = useState(0);
  const [payoutDayKey] = useState(new Date().toDateString());
  const [latestTriggerId, setLatestTriggerId] = useState("");
  const [, setTriggerAuditEvents] = useState(() =>
    getTriggerAuditEvents().slice(0, 8),
  );
  const [weeklyTrend, setWeeklyTrend] = useState(() =>
    getWeeklyTrend(getPayoutHistory()),
  );
  const [predictiveSummary, setPredictiveSummary] = useState(() =>
    getLatestPredictiveAssessment(),
  );
  const [predictiveHistory, setPredictiveHistory] = useState(() =>
    getPredictiveAssessments({ limit: 3 }),
  );
  const [predictivePolicyConfig, setPredictivePolicyConfig] = useState(() =>
    loadPredictivePolicyConfig(predictivePolicyBaseline),
  );
  const [policyDraft, setPolicyDraft] = useState(() =>
    toPercentDraft(loadPredictivePolicyConfig(predictivePolicyBaseline)),
  );
  const [policySavedAt, setPolicySavedAt] = useState(() =>
    getPredictivePolicySavedAt(),
  );
  const [predictiveSyncStatus, setPredictiveSyncStatus] = useState(() =>
    backendPersistenceEnabled ? "waiting" : "local-only",
  );
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

  const availablePlatforms = ["Swiggy", "Zomato", "Blinkit"];
  const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
  const resolvedPlanId =
    searchParams.get("plan") ||
    session?.selectedPlanId ||
    persistedPlanId ||
    userProfile.selectedPlanId;
  const selectedPlan =
    planDetails.find((p) => p.id === resolvedPlanId) ?? planDetails[0];

  // Derived Data for Dynamic UI
  const activeFraudProfile =
    fraudScores[activePersonaKey] ?? fraudScores.normal;
  const displayRiskLevel = getRiskLevelFromScore(activeFraudProfile.score);
  const displayRiskMultiplier = getRiskMultiplier(displayRiskLevel);
  const platformCount = selectedPlatforms.length;

  // Use the refined pricing utility
  const displayPremiumBreakdown = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount,
    riskLevel: displayRiskLevel,
  });
  const displayWeeklyPremium = displayPremiumBreakdown.adjustedPremium;

  const [latestPayoutMeta, setLatestPayoutMeta] = useState({
    status: "idle",
    reason: "",
    basePayout: 0,
    remainingCap: getDailyPayoutCap(selectedPlan.id),
    dailyCap: getDailyPayoutCap(selectedPlan.id),
  });

  const latestTrigger =
    triggerEvents.find((e) => e.id === latestTriggerId) ?? null;
  const dailyPayoutCap = getDailyPayoutCap(selectedPlan.id);

  useEffect(() => {
    let alive = true;

    const syncPredictiveHistory = async () => {
      const hydrated = await hydratePredictiveAssessments({
        workerId: session?.workerId,
        limit: 10,
      });

      if (!alive || hydrated.length === 0) {
        return;
      }

      setPredictiveSummary(hydrated[0] || null);
      setPredictiveHistory(hydrated.slice(0, 3));
    };

    syncPredictiveHistory();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  useEffect(() => {
    let alive = true;

    const syncTriggerAudit = async () => {
      const hydrated = await hydrateTriggerAuditEvents({
        city: session?.city || "New Delhi",
        limit: 25,
      });

      if (!alive || hydrated.length === 0) {
        return;
      }

      setTriggerAuditEvents(hydrated.slice(0, 8));
      setLatestTriggerId((current) => current || hydrated[0]?.triggerId || "");
    };

    syncTriggerAudit();

    return () => {
      alive = false;
    };
  }, [session?.city]);

  useEffect(() => {
    let alive = true;

    const syncPayoutHistory = async () => {
      const hydrated = await hydratePayoutHistory({ limit: 100 });
      if (!alive || hydrated.length === 0) {
        return;
      }

      setWeeklyTrend(getWeeklyTrend(hydrated));
      setLastPayoutAmount(Number(hydrated[0]?.payoutAmount || 0));

      const todayKey = new Date().toDateString();
      const paidToday = hydrated.reduce((sum, item) => {
        const createdAt = item?.createdAt
          ? new Date(item.createdAt).toDateString()
          : "";
        if (createdAt !== todayKey) {
          return sum;
        }

        if (item.status === "paid" || item.status === "capped") {
          return sum + Number(item.payoutAmount || 0);
        }

        return sum;
      }, 0);

      setPaidTodayAmount(paidToday);
    };

    syncPayoutHistory();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const syncDashboardMetrics = async () => {
      const metrics = await fetchDashboardMetrics({
        city: session?.city || "New Delhi",
      });

      if (!alive || !metrics) {
        return;
      }

      setDashboardMetrics(metrics);
      setLastPayoutAmount(metrics.latestPayoutAmount || 0);
      setPaidTodayAmount(metrics.supportToday || 0);
    };

    syncDashboardMetrics();

    return () => {
      alive = false;
    };
  }, [session?.city, session?.workerId]);

  // Simulation Logic
  const handleSimulateTrigger = async (triggerId, mode = "confirmed") => {
    if (mode === "forecast") {
      const compositeSignals = await getCompositeDisruptionSignals({
        city: session?.city || "New Delhi",
        platforms: selectedPlatforms,
      });

      const liveSignals = deriveLiveSignalsFromComposite({
        triggerId,
        compositeSignals,
      });

      const forecast = buildPredictiveAssessment({
        triggerEvents,
        triggerId,
        planId: selectedPlan.id,
        riskLevel: displayRiskLevel,
        paidTodayAmount,
        liveSignals,
        policyConfig: predictivePolicyConfig,
      });

      const syncResult = await savePredictiveAssessment(forecast, {
        workerId: session?.workerId,
        city: session?.city || "Unknown",
      });
      if (!backendPersistenceEnabled) {
        setPredictiveSyncStatus("local-only");
      } else if (syncResult?.ok && syncResult?.backend) {
        setPredictiveSyncStatus("synced");
      } else {
        setPredictiveSyncStatus("fallback");
      }
      setPredictiveSummary(forecast);
      setPredictiveHistory(getPredictiveAssessments({ limit: 3 }));
      setLatestTriggerId(triggerId);
      setLatestPayoutMeta({
        status: forecast.status,
        reason: forecast.reason,
        basePayout: forecast.expectedPayout,
        remainingCap: forecast.remainingCap,
        dailyCap: forecast.dailyCap,
        predictiveProbability: forecast.probabilityAdjustedPct,
        predictiveThreshold: forecast.thresholdPct,
        predictiveAdvanceAmount: forecast.advanceAmount,
        predictiveConfidenceLabel: forecast.confidenceLabel,
      });
      return;
    }

    const now = new Date();
    const triggerRules = evaluateTriggerRules({ triggerId, now });

    if (triggerRules.cooldownBlocked || triggerRules.dedupBlocked) {
      const blockedReason = triggerRules.cooldownBlocked
        ? selectLabel(
            languageMode,
            `Please wait ${triggerRules.cooldownRemainingSec}s, then check again.`,
            `${triggerRules.cooldownRemainingSec} सेकंड बाद फिर से जांचें।`,
          )
        : selectLabel(
            languageMode,
            "This emergency was already checked recently.",
            "इस इमरजेंसी की जांच अभी हाल में हो चुकी है।",
          );
      const status = triggerRules.cooldownBlocked
        ? "blocked-cooldown"
        : "blocked-dedup";
      setLatestPayoutMeta({
        status,
        reason: blockedReason,
        basePayout: 0,
        remainingCap: Math.max(0, dailyPayoutCap - paidTodayAmount),
        dailyCap: dailyPayoutCap,
      });
      setLatestTriggerId(triggerId);
      return;
    }

    const triggerConfidence = getTriggerConfidenceScore({
      triggerId,
      personaRiskLevel: displayRiskLevel,
    });
    const todayKey = now.toDateString();
    const effectivePaidToday = todayKey === payoutDayKey ? paidTodayAmount : 0;

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
      triggerConfidenceScore: Number(
        (triggerConfidence.score * 100).toFixed(0),
      ),
      triggerConfidenceLabel: triggerConfidence.label,
    };

    const receipt = createPayoutReceipt({
      createdAt: now.toISOString(),
      status: payoutResult.status,
      reason: payoutResult.reason,
      triggerId,
      triggerLabel:
        triggerEvents.find((e) => e.id === triggerId)?.label ?? triggerId,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      payoutAmount,
      basePayout: payoutResult.basePayout,
      dailyCap: payoutResult.dailyCap,
      remainingCap: payoutResult.remainingCap,
      isCoveredNow: true,
      coverageHours: selectedPlan.coverageHours,
      riskLevel: displayRiskLevel,
      triggerConfidenceScore: enrichedResult.triggerConfidenceScore,
    });
    savePayoutReceipt(receipt);

    appendTriggerAuditEvent({
      id: receipt?.payoutId || `${now.getTime()}`,
      createdAt: now.toISOString(),
      triggerId,
      decision: payoutResult.status,
      reason: payoutResult.reason,
      payoutAmount,
      confidence: enrichedResult.triggerConfidenceScore,
    }, {
      city: session?.city || "Unknown",
      source: mode === "forecast" ? "predictive_dashboard" : "dashboard_simulation",
    });

    setTriggerAuditEvents(getTriggerAuditEvents().slice(0, 8));
    setWeeklyTrend(getWeeklyTrend(getPayoutHistory()));
    setLastPayoutAmount(payoutAmount);
    setPaidTodayAmount(effectivePaidToday + payoutAmount);
    setLatestPayoutMeta(enrichedResult);
    setLatestTriggerId(triggerId);

    if (
      payoutAmount > 0 &&
      (payoutResult.status === "paid" || payoutResult.status === "capped")
    ) {
      navigate("/payout");
    }
  };

  const handlePolicyDraftChange = (sectionKey, riskKey, value) => {
    const normalizedValue = Number(value);
    setPolicyDraft((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [riskKey]: Number.isFinite(normalizedValue) ? normalizedValue : 0,
      },
    }));
  };

  const handleSavePolicyConfig = () => {
    const nextConfig = toConfigFromPercentDraft(
      policyDraft,
      predictivePolicyConfig,
    );
    const persisted = savePredictivePolicyConfig(nextConfig);
    setPredictivePolicyConfig(persisted);
    setPolicyDraft(toPercentDraft(persisted));
    setPolicySavedAt(getPredictivePolicySavedAt());
  };

  const handleResetPolicyConfig = () => {
    const resetConfig = savePredictivePolicyConfig(predictivePolicyBaseline);
    setPredictivePolicyConfig(resetConfig);
    setPolicyDraft(toPercentDraft(resetConfig));
    setPolicySavedAt(getPredictivePolicySavedAt());
  };

  const handleApplyPreset = (presetKey) => {
    const preset = predictivePolicyPresets[presetKey];
    if (!preset) {
      return;
    }

    setPolicyDraft({
      riskThreshold: { ...preset.riskThreshold },
      advanceRatioByRisk: { ...preset.advanceRatioByRisk },
    });
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const timelineEntries = useMemo(
    () => [
      {
        id: "1",
        premium: displayWeeklyPremium,
        reason: "Current weekly cost",
        changedAt: new Date().toISOString(),
        platformCount,
        riskLevel: displayRiskLevel,
        riskMultiplier: displayRiskMultiplier,
        deltaMeta: { label: "Active", classes: "bg-green-100 text-green-700" },
      },
    ],
    [
      displayWeeklyPremium,
      platformCount,
      displayRiskLevel,
      displayRiskMultiplier,
    ],
  );

  const timelineEntriesWithDelta = useMemo(
    () =>
      timelineEntries.map((e) => ({
        ...e,
        relativeTime: formatRelativeTime(e.changedAt),
      })),
    [timelineEntries],
  );

  const coverageActive = selectedPlatforms.length > 0;
  const weeklyPaidAmount = weeklyTrend.reduce(
    (sum, day) => sum + Number(day.paidAmount || 0),
    0,
  );
  const earningsProtectedThisWeek =
    dashboardMetrics?.supportThisWeek ||
    weeklyPaidAmount ||
    userProfile.earningsProtectedThisWeek;
  const weeklySupportCap = dailyPayoutCap * 7;
  const weeklySupportLeft = Math.max(0, weeklySupportCap - weeklyPaidAmount);
  const emergencyActive = Boolean(latestTrigger);
  const reputationProfile = useMemo(
    () =>
      computeReputationProfile({
        payoutHistory: getPayoutHistory(),
        predictiveHistory: getPredictiveAssessments({ limit: 100 }),
      }),
    [],
  );

  const planOptimizer = useMemo(
    () =>
      getPlanOptimizerRecommendation({
        selectedPlan,
        selectedPlatforms,
        riskLevel: displayRiskLevel,
        payoutHistory: getPayoutHistory().slice(0, 50),
        plans: planDetails,
      }),
    [selectedPlan, selectedPlatforms, displayRiskLevel],
  );

  const incomeRadar = useMemo(
    () =>
      buildIncomeRadar({
        city: session?.city || "New Delhi",
        riskLevel: displayRiskLevel,
        platformCount: selectedPlatforms.length,
        predictiveSummary,
      }),
    [
      session?.city,
      displayRiskLevel,
      selectedPlatforms.length,
      predictiveSummary,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const persistRadar = async () => {
      if (!backendPersistenceEnabled || !incomeRadar || !session?.workerId) {
        return;
      }

      const result = await saveIncomeRadarSnapshot(incomeRadar, {
        city: session?.city || "New Delhi",
        workerId: session.workerId,
      });

      if (!cancelled && !result?.ok) {
        console.warn("[IncomeRadar] Backend snapshot save failed");
      }
    };

    persistRadar();

    return () => {
      cancelled = true;
    };
  }, [incomeRadar, session?.city, session?.workerId]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] pb-24 font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14313b_0%,rgba(9,9,11,0.97)_38%,#09090b_75%)]" />
        <div className="absolute left-[-8%] top-[5%] h-[26rem] w-[26rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[24%] h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
      <div className="w-full px-4 pb-6 pt-32 sm:px-6 sm:pb-10 sm:pt-36 lg:px-10 xl:px-14">
        <header className="mb-12">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            {selectLabel(
              languageMode,
              "Income Protection Dashboard",
              "आय सुरक्षा डैशबोर्ड",
            )}
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4 sm:mb-6">
                {selectLabel(languageMode, "Welcome", "स्वागत है")},{" "}
                <span className="text-zinc-400">
                  {session?.name || "Rider"}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 sm:gap-8 sm:text-sm">
                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  {session?.city || "New Delhi"}
                </span>
                <span className="flex items-center gap-2">
                  <Fingerprint size={16} />
                  {session?.workerId || "GS-8.2k"}
                </span>
                <span
                  className={`flex items-center gap-2 transition-colors ${coverageActive ? "text-emerald-300" : "text-red-300"}`}
                >
                  <Clock size={16} />
                  {selectLabel(
                    languageMode,
                    "Protection Hours",
                    "सुरक्षा समय",
                  )}{" "}
                  : {selectedPlan.coverageHours}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Live
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    predictiveSyncStatus === "synced"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                      : predictiveSyncStatus === "fallback"
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
                        : predictiveSyncStatus === "local-only"
                          ? "border-white/10 bg-white/[0.04] text-zinc-400"
                          : "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                  }`}
                  title={
                    predictiveSyncStatus === "synced"
                      ? "Forecast writes are syncing to Supabase"
                      : predictiveSyncStatus === "fallback"
                        ? "Supabase write failed, local fallback active"
                        : predictiveSyncStatus === "local-only"
                          ? "Backend persistence is disabled"
                          : "Run a forecast to validate Supabase sync"
                  }
                >
                  {predictiveSyncStatus === "synced"
                    ? "Backend Sync: ON"
                    : predictiveSyncStatus === "fallback"
                      ? "Backend Sync: FALLBACK"
                      : predictiveSyncStatus === "local-only"
                        ? "Backend Sync: OFF"
                        : "Backend Sync: WAIT"}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.05] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {selectLabel(
                      languageMode,
                      "Your Weekly Cost",
                      "आपका साप्ताहिक खर्च",
                    )}
                  </p>
                  <p className="text-2xl font-black tracking-tighter text-white sm:text-3xl">
                    {formatCurrency(displayWeeklyPremium)}
                  </p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {selectLabel(languageMode, "Trust Status", "ट्रस्ट स्थिति")}
                  </p>
                  <p
                    className={`text-sm font-black uppercase ${displayRiskLevel === "High" ? "text-red-300" : "text-emerald-300"}`}
                  >
                    {displayRiskLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-10">
          <AppSurface className="border-cyan-300/20 bg-cyan-300/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
                  {selectLabel(
                    languageMode,
                    "Judge Demo Step 3",
                    "जज डेमो स्टेप 3",
                  )}
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  {selectLabel(
                    languageMode,
                    "This is the live product workspace.",
                    "यह लाइव प्रोडक्ट वर्कस्पेस है।",
                  )}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-cyan-50/90">
                  {selectLabel(
                    languageMode,
                    "Show Income Radar first, then trigger a disruption below to demonstrate how GigShield moves from prediction to automated income protection.",
                    "पहले इनकम रडार दिखाएं, फिर नीचे कोई ट्रिगर चलाकर बताएं कि GigShield प्रेडिक्शन से ऑटोमेटेड आय सुरक्षा तक कैसे जाता है।",
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/income-radar")}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.14]"
                >
                  {selectLabel(
                    languageMode,
                    "Reopen Income Radar",
                    "इनकम रडार खोलें",
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/payout")}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-950 transition hover:bg-zinc-200"
                >
                  {selectLabel(
                    languageMode,
                    "Go To Payout Flow",
                    "पेआउट फ्लो खोलें",
                  )}
                </button>
              </div>
            </div>
          </AppSurface>
        </section>

        <section className="mb-10 sm:mb-12 grid gap-3 sm:gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {selectLabel(languageMode, "Emergency Status", "इमरजेंसी स्थिति")}
            </p>
            <p
              className={`mt-2 text-xl font-black tracking-tight sm:text-2xl ${emergencyActive ? "text-emerald-300" : "text-zinc-100"}`}
            >
              {emergencyActive
                ? selectLabel(
                    languageMode,
                    "Emergency Detected",
                    "इमरजेंसी मिली",
                  )
                : selectLabel(
                    languageMode,
                    "No Emergency",
                    "कोई इमरजेंसी नहीं",
                  )}
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {selectLabel(languageMode, "You Get Today", "आज आपको मिलेगा")}
            </p>
            <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              {formatCurrency(Math.max(0, lastPayoutAmount))}
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {selectLabel(
                languageMode,
                "Support Left This Week",
                "इस सप्ताह बची सहायता",
              )}
            </p>
            <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              {formatCurrency(weeklySupportLeft)}
            </p>
          </article>
        </section>

        {/* Platform Manager Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {selectLabel(
                languageMode,
                "Where You Work",
                "जहां आप काम करते हैं",
              )}
            </p>
            <p className="text-xs font-bold text-zinc-500">
              {selectedPlatforms.length}{" "}
              {selectLabel(languageMode, "Apps connected", "ऐप्स जुड़े")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {availablePlatforms.map((p) => {
              const isActive = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                    isActive
                      ? "scale-[1.02] border-cyan-300/30 bg-white/[0.08] text-white shadow-lg shadow-cyan-950/30"
                      : "border-white/10 bg-white/[0.03] text-zinc-100 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-widest">
                      {p}
                    </span>
                    {isActive ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} className="text-zinc-500" />
                    )}
                  </div>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-white/60" : "text-zinc-500"}`}
                  >
                    {isActive ? "Connected" : "Connect"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Weather Surveillance Map ─────────────────────────────────────── */}
        <section className="mb-12">
          <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {selectLabel(
              languageMode,
              "Live Weather Surveillance",
              "लाइव मौसम निगरानी",
            )}
          </p>
          <WeatherRadarMap
            latitude={session?.latitude || 28.6139}
            longitude={session?.longitude || 77.209}
            city={session?.city || "New Delhi"}
          />
        </section>

        {/* ── n8n Automation Panel ─────────────────────────────────────── */}
        <section className="mb-12">
          <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {selectLabel(languageMode, "Live Risk Engine", "लाइव जोखिम इंजन")}
          </p>
          <AutomationPanel session={session} setSession={setSession} />
        </section>

        <section className="mb-12">
          <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {selectLabel(languageMode, "Income Radar", "इनकम रडार")}
          </p>
          <IncomeRadarPanel radar={incomeRadar} />
        </section>

        <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
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
              predictiveSummary={predictiveSummary}
              languageMode={languageMode}
            />

            <div className="grid md:grid-cols-2 gap-8">
              <EarningsSnapshot
                earningsProtectedThisWeek={earningsProtectedThisWeek}
                lastPayoutAmount={lastPayoutAmount}
                languageMode={languageMode}
              />
              <ActivityPanel
                activity={dashboardMetrics?.activitySummary || activityData}
                lastActiveTime={dashboardMetrics?.activitySummary?.lastActiveTime || userProfile.lastActiveTime}
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(
                  languageMode,
                  "Rider Reputation",
                  "राइडर रेपुटेशन",
                )}
              </p>
              <AppSurface className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    {selectLabel(
                      languageMode,
                      "Reliability Tier",
                      "रिलायबिलिटी टियर",
                    )}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      reputationProfile.tier === "Gold"
                        ? "bg-amber-500/10 text-amber-200"
                        : reputationProfile.tier === "Silver"
                          ? "bg-slate-500/10 text-slate-200"
                          : "bg-orange-500/10 text-orange-200"
                    }`}
                  >
                    {reputationProfile.tier}
                  </span>
                </div>
                <p className="text-3xl font-black tracking-tight text-white">
                  {reputationProfile.score}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {selectLabel(languageMode, "Settled", "सेटल्ड")}
                    </p>
                    <p className="text-sm font-black text-white">
                      {reputationProfile.settlementRatePct}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {selectLabel(
                        languageMode,
                        "Predictive Win",
                        "प्रेडिक्टिव विन",
                      )}
                    </p>
                    <p className="text-sm font-black text-white">
                      {reputationProfile.predictiveSuccessRatePct}%
                    </p>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  {reputationProfile.reviewNote}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Benefit", "बेनेफिट")}: +
                  {reputationProfile.benefits.advanceBoostPct}%{" "}
                  {selectLabel(languageMode, "advance edge", "एडवांस एज")}
                </p>
              </AppSurface>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(
                  languageMode,
                  "Plan Optimizer",
                  "प्लान ऑप्टिमाइजर",
                )}
              </p>
              <AppSurface className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {selectLabel(languageMode, "This week", "इस सप्ताह")}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {planOptimizer.recommendedPlan.name}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {planOptimizer.summary}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {selectLabel(languageMode, "Current", "करेंट")}
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {formatCurrency(planOptimizer.currentPremium)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {selectLabel(languageMode, "Suggested", "सुझाया")}
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {formatCurrency(planOptimizer.recommendedPremium)}
                    </p>
                  </div>
                </div>
                {planOptimizer.overpayAmount > 0 && (
                  <p className="text-xs font-black text-green-700">
                    {selectLabel(languageMode, "Potential save", "संभावित बचत")}
                    : {formatCurrency(planOptimizer.overpayAmount)}/week
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:border-gray-400 transition-colors"
                >
                  {planOptimizer.actionLabel}
                </button>
              </AppSurface>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(
                  languageMode,
                  "Early Protection Radar",
                  "अर्ली प्रोटेक्शन रडार",
                )}
              </p>
              <AppSurface className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    {selectLabel(
                      languageMode,
                      "Disruption Probability",
                      "डिसरप्शन संभावना",
                    )}
                  </p>
                  <span className="text-sm font-black text-white">
                    {predictiveSummary
                      ? `${predictiveSummary.probabilityAdjustedPct}%`
                      : "--"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{
                      width: `${predictiveSummary?.probabilityAdjustedPct ?? 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>
                    {selectLabel(languageMode, "Threshold", "थ्रेशहोल्ड")}:{" "}
                    {predictiveSummary?.thresholdPct ?? "--"}%
                  </span>
                  <span>
                    {selectLabel(languageMode, "Advance", "एडवांस")}:{" "}
                    {predictiveSummary
                      ? formatCurrency(predictiveSummary.advanceAmount)
                      : "--"}
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  {predictiveSummary
                    ? predictiveSummary.reason
                    : selectLabel(
                        languageMode,
                        "Run forecast on any emergency to start the radar.",
                        "रडार शुरू करने के लिए किसी भी इमरजेंसी पर फोरकास्ट चलाएं।",
                      )}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/predictive-history")}
                  className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                >
                  {selectLabel(
                    languageMode,
                    "Open Predictive History",
                    "प्रीडिक्टिव हिस्ट्री खोलें",
                  )}
                </button>
              </AppSurface>

              {predictiveHistory.length > 0 && (
                <div className="space-y-3">
                  {predictiveHistory.map((item) => (
                    <div
                      key={item.assessmentId}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-black uppercase tracking-wide text-white">
                          {item.triggerLabel}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          {item.probabilityAdjustedPct}%
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-zinc-300">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <AppSurface className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {selectLabel(
                      languageMode,
                      "Policy Controls",
                      "पॉलिसी कंट्रोल्स",
                    )}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {selectLabel(
                      languageMode,
                      "Admin Tuning",
                      "एडमिन ट्यूनिंग",
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("conservative")}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[9px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                  >
                    {selectLabel(languageMode, "Conservative", "कंजरवेटिव")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("balanced")}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[9px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                  >
                    {selectLabel(languageMode, "Balanced", "बैलेंस्ड")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("aggressive")}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[9px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                  >
                    {selectLabel(languageMode, "Aggressive", "अग्रेसिव")}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      key: "Low",
                      label: selectLabel(languageMode, "Low", "लो"),
                    },
                    {
                      key: "Medium",
                      label: selectLabel(languageMode, "Medium", "मीडियम"),
                    },
                    {
                      key: "High",
                      label: selectLabel(languageMode, "High", "हाई"),
                    },
                  ].map((risk) => (
                    <div key={`threshold-${risk.key}`} className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {risk.label}
                      </p>
                      <input
                        type="number"
                        min="40"
                        max="99"
                        step="1"
                        value={policyDraft.riskThreshold[risk.key]}
                        onChange={(event) =>
                          handlePolicyDraftChange(
                            "riskThreshold",
                            risk.key,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-white focus:border-white/30 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Threshold %", "थ्रेशहोल्ड %")}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      key: "Low",
                      label: selectLabel(languageMode, "Low", "लो"),
                    },
                    {
                      key: "Medium",
                      label: selectLabel(languageMode, "Medium", "मीडियम"),
                    },
                    {
                      key: "High",
                      label: selectLabel(languageMode, "High", "हाई"),
                    },
                  ].map((risk) => (
                    <div key={`advance-${risk.key}`} className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {risk.label}
                      </p>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        step="1"
                        value={policyDraft.advanceRatioByRisk[risk.key]}
                        onChange={(event) =>
                          handlePolicyDraftChange(
                            "advanceRatioByRisk",
                            risk.key,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-white focus:border-white/30 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Advance %", "एडवांस %")}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePolicyConfig}
                    className="h-10 rounded-xl bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200"
                  >
                    {selectLabel(
                      languageMode,
                      "Save Policy",
                      "पॉलिसी सेव करें",
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPolicyConfig}
                    className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                  >
                    {selectLabel(languageMode, "Reset", "रीसेट")}
                  </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-500">
                  {policySavedAt
                    ? `${selectLabel(languageMode, "Last saved", "आखिरी सेव")} : ${new Date(policySavedAt).toLocaleString()}`
                    : selectLabel(
                        languageMode,
                        "Not saved yet",
                        "अभी सेव नहीं हुआ",
                      )}
                </p>
              </AppSurface>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(
                  languageMode,
                  "Why This Weekly Cost",
                  "यह साप्ताहिक खर्च क्यों",
                )}
              </p>
              <div className="space-y-4">
                {timelineEntriesWithDelta.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-all hover:border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-black text-white">
                        {formatCurrency(e.premium)} — {e.reason}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${e.deltaMeta.classes}`}
                      >
                        {e.deltaMeta.label}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500">
                      {selectLabel(
                        languageMode,
                        "Connected apps",
                        "जुड़े ऐप्स",
                      )}
                      : {e.platformCount} |{" "}
                      {selectLabel(languageMode, "Trust", "ट्रस्ट")}:{" "}
                      {e.riskLevel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(
                  languageMode,
                  "Support Activity This Week",
                  "इस सप्ताह सहायता गतिविधि",
                )}
              </p>
              <AppSurface className="p-8">
                <div className="flex h-32 items-end justify-between gap-3">
                  {weeklyTrend.map((d) => (
                    <div
                      key={d.key}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-full bg-white/10">
                        <div
                          className="rounded-full bg-white transition-all duration-1000"
                          style={{
                            height: `${Math.min(100, d.triggers * 25)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-black uppercase text-zinc-500">
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </AppSurface>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(languageMode, "Growth Features", "ग्रोथ फीचर्स")}
              </p>
              <AppSurface className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate("/community-heatmap")}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                >
                  {selectLabel(
                    languageMode,
                    "Open Community Heatmap",
                    "कम्युनिटी हीटमैप खोलें",
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/team-protection")}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                >
                  {selectLabel(
                    languageMode,
                    "Open Team Protection",
                    "टीम प्रोटेक्शन खोलें",
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/trust-center")}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-100 transition-colors hover:border-white/20"
                >
                  {selectLabel(
                    languageMode,
                    "Open Trust Center",
                    "ट्रस्ट सेंटर खोलें",
                  )}
                </button>
              </AppSurface>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
