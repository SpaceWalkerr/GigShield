import { getDailyPayoutCap } from "./payout";
import { supabase } from "./supabase";
import {
  fetchPredictiveAssessmentsFromBackend,
  savePredictiveAssessmentToBackend,
} from "../services/backend/predictiveAssessmentService";

const predictiveAssessmentStorageKey = "gigshieldPredictiveAssessments";
const predictivePolicyStorageKey = "gigshieldPredictivePolicyConfig";
const backendEnabled = Boolean(import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true");

const scoreWeights = {
  weather: 0.28,
  outage: 0.22,
  traffic: 0.18,
  regional: 0.17,
  historical: 0.15,
};

const triggerSignalDefaults = {
  "heavy-rain": { weather: 0.92, outage: 0.32, traffic: 0.74, regional: 0.66, historical: 0.62 },
  heatwave: { weather: 0.89, outage: 0.26, traffic: 0.63, regional: 0.58, historical: 0.6 },
  "aqi-spike": { weather: 0.81, outage: 0.19, traffic: 0.56, regional: 0.54, historical: 0.57 },
  "platform-outage": { weather: 0.2, outage: 0.94, traffic: 0.34, regional: 0.79, historical: 0.52 },
  "curfew-lockdown": { weather: 0.1, outage: 0.62, traffic: 0.86, regional: 0.83, historical: 0.49 },
  "local-strike": { weather: 0.1, outage: 0.57, traffic: 0.8, regional: 0.85, historical: 0.55 },
  "zone-closure": { weather: 0.14, outage: 0.48, traffic: 0.77, regional: 0.81, historical: 0.51 },
};

const defaultRiskPenalty = {
  Low: 0,
  Medium: 0.05,
  High: 0.12,
};

const defaultRiskThreshold = {
  Low: 0.72,
  Medium: 0.78,
  High: 0.86,
};

const defaultAdvanceRatioByRisk = {
  Low: 0.35,
  Medium: 0.28,
  High: 0.2,
};

const defaultPolicyConfig = {
  riskPenalty: defaultRiskPenalty,
  riskThreshold: defaultRiskThreshold,
  advanceRatioByRisk: defaultAdvanceRatioByRisk,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function toPercent(score) {
  return Math.round(clamp01(score) * 100);
}

function computeConfidenceLabel(score) {
  if (score >= 0.85) return "Strong";
  if (score >= 0.65) return "Normal";
  return "Weak";
}

function readAssessments() {
  const raw = localStorage.getItem(predictiveAssessmentStorageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAssessments(value) {
  localStorage.setItem(predictiveAssessmentStorageKey, JSON.stringify(value));
}

function upsertLocalAssessment(assessment) {
  const existing = readAssessments();
  const index = existing.findIndex((item) => item?.assessmentId === assessment.assessmentId);
  if (index === -1) {
    existing.unshift(assessment);
  } else {
    existing[index] = assessment;
  }

  existing.sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  writeAssessments(existing.slice(0, 200));
}

function mapSupabaseRowToAssessment(row) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    ...payload,
    assessmentId: row.assessment_id,
    workerId: row.worker_id,
    triggerId: row.trigger_id,
    status: row.status,
    probabilityAdjusted: row.probability_adjusted,
    createdAt: row.created_at,
  };
}

export function calculateDisruptionProbability({ triggerId, riskLevel = "Low", signals = {} }) {
  return calculateDisruptionProbabilityWithConfig({
    triggerId,
    riskLevel,
    signals,
    policyConfig: defaultPolicyConfig,
  });
}

export function calculateDisruptionProbabilityWithConfig({
  triggerId,
  riskLevel = "Low",
  signals = {},
  policyConfig = defaultPolicyConfig,
}) {
  const baseline = triggerSignalDefaults[triggerId] ?? triggerSignalDefaults["heavy-rain"];
  const resolvedPenalty = policyConfig.riskPenalty ?? defaultRiskPenalty;
  const resolvedThreshold = policyConfig.riskThreshold ?? defaultRiskThreshold;
  const normalizedSignals = {
    weather: clamp01(signals.weather ?? baseline.weather),
    outage: clamp01(signals.outage ?? baseline.outage),
    traffic: clamp01(signals.traffic ?? baseline.traffic),
    regional: clamp01(signals.regional ?? baseline.regional),
    historical: clamp01(signals.historical ?? baseline.historical),
  };

  const rawProbability =
    normalizedSignals.weather * scoreWeights.weather +
    normalizedSignals.outage * scoreWeights.outage +
    normalizedSignals.traffic * scoreWeights.traffic +
    normalizedSignals.regional * scoreWeights.regional +
    normalizedSignals.historical * scoreWeights.historical;

  const adjustedProbability = clamp01(rawProbability - (resolvedPenalty[riskLevel] ?? 0));
  const threshold = resolvedThreshold[riskLevel] ?? resolvedThreshold.Low;

  return {
    rawProbability,
    adjustedProbability,
    threshold,
    confidenceLabel: computeConfidenceLabel(adjustedProbability),
    factors: normalizedSignals,
    decisionApproved: adjustedProbability >= threshold,
  };
}

export function buildPredictiveAssessment({
  triggerEvents,
  triggerId,
  planId,
  riskLevel,
  paidTodayAmount = 0,
  liveSignals,
  policyConfig = defaultPolicyConfig,
  now = new Date(),
}) {
  const triggerEvent = triggerEvents.find((event) => event.id === triggerId);
  const dailyCap = getDailyPayoutCap(planId);
  const remainingCap = Math.max(0, dailyCap - paidTodayAmount);

  if (!triggerEvent || !triggerEvent.payoutByPlan?.[planId]) {
    return {
      assessmentId: `predictive-${now.getTime()}`,
      createdAt: now.toISOString(),
      triggerId,
      triggerLabel: triggerId,
      planId,
      riskLevel,
      expectedPayout: 0,
      advanceAmount: 0,
      dailyCap,
      remainingCap,
      decisionApproved: false,
      probabilityRaw: 0,
      probabilityAdjusted: 0,
      probabilityRawPct: 0,
      probabilityAdjustedPct: 0,
      thresholdPct: 0,
      confidenceLabel: "Weak",
      factors: {},
      reason: "This emergency type is not available for predictive checks.",
      status: "predictive-invalid",
    };
  }

  const expectedPayout = Math.min(triggerEvent.payoutByPlan[planId], remainingCap);
  const probability = calculateDisruptionProbabilityWithConfig({
    triggerId,
    riskLevel,
    signals: liveSignals,
    policyConfig,
  });

  const approvedByScore = probability.decisionApproved;
  const hasCapRoom = expectedPayout > 0;
  const decisionApproved = approvedByScore && hasCapRoom;

  const resolvedAdvanceRatio = policyConfig.advanceRatioByRisk ?? defaultAdvanceRatioByRisk;
  const advanceRatio = resolvedAdvanceRatio[riskLevel] ?? resolvedAdvanceRatio.Low;
  const advanceAmount = decisionApproved ? Math.max(0, Math.round(expectedPayout * advanceRatio)) : 0;

  let reason = "Signals are still below threshold. Continue monitoring.";
  if (!hasCapRoom) {
    reason = "Daily support limit is already used, so no advance can be released.";
  } else if (decisionApproved) {
    reason = "Forecast confidence is high. Early support can be prepared now.";
  }

  return {
    assessmentId: `predictive-${now.getTime()}`,
    createdAt: now.toISOString(),
    triggerId,
    triggerLabel: triggerEvent.label,
    planId,
    riskLevel,
    expectedPayout,
    advanceAmount,
    dailyCap,
    remainingCap,
    decisionApproved,
    probabilityRaw: Number(probability.rawProbability.toFixed(3)),
    probabilityAdjusted: Number(probability.adjustedProbability.toFixed(3)),
    probabilityRawPct: toPercent(probability.rawProbability),
    probabilityAdjustedPct: toPercent(probability.adjustedProbability),
    thresholdPct: toPercent(probability.threshold),
    confidenceLabel: probability.confidenceLabel,
    factors: probability.factors,
    reason,
    status: decisionApproved ? "predictive-approved" : "predictive-pending",
  };
}

export async function savePredictiveAssessment(assessment, options = {}) {
  if (!assessment || typeof assessment !== "object") {
    return { ok: false, backend: false, error: "Invalid assessment" };
  }

  const enrichedAssessment = {
    ...assessment,
    city: options.city || assessment.city || "Unknown",
  };

  upsertLocalAssessment(enrichedAssessment);

  if (!backendEnabled) {
    return { ok: true, backend: false };
  }

  try {
    return await savePredictiveAssessmentToBackend(enrichedAssessment, options);
  } catch {
    return { ok: false, backend: false, error: "Backend persistence unavailable" };
  }
}

export function getPredictiveAssessments(options = {}) {
  const { limit = 20 } = options;
  return readAssessments().slice(0, limit);
}

export function getLatestPredictiveAssessment() {
  return getPredictiveAssessments({ limit: 1 })[0] ?? null;
}

export async function fetchPredictiveAssessmentsFromSupabase(options = {}) {
  const { workerId, limit = 50 } = options;

  if (!backendEnabled || !workerId) {
    return [];
  }

  try {
    const next = await fetchPredictiveAssessmentsFromBackend({ workerId, limit });
    if (next.length > 0) {
      return next;
    }

    const { data, error } = await supabase
      .from("predictive_assessments")
      .select("assessment_id, worker_id, trigger_id, status, probability_adjusted, payload, created_at")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(mapSupabaseRowToAssessment);
  } catch {
    return [];
  }
}

export async function hydratePredictiveAssessments(options = {}) {
  const { workerId, limit = 50 } = options;
  const remote = await fetchPredictiveAssessmentsFromSupabase({ workerId, limit });

  if (remote.length > 0) {
    remote.forEach((item) => upsertLocalAssessment(item));
  }

  return getPredictiveAssessments({ limit });
}

export function createPredictivePolicyConfig(overrides = {}) {
  return {
    riskPenalty: { ...defaultRiskPenalty, ...(overrides.riskPenalty || {}) },
    riskThreshold: { ...defaultRiskThreshold, ...(overrides.riskThreshold || {}) },
    advanceRatioByRisk: { ...defaultAdvanceRatioByRisk, ...(overrides.advanceRatioByRisk || {}) },
  };
}

function clampPolicyValue(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function sanitizePolicyConfig(policyConfig) {
  const merged = createPredictivePolicyConfig(policyConfig);
  return {
    riskPenalty: {
      Low: clampPolicyValue(merged.riskPenalty.Low, 0, 0.5),
      Medium: clampPolicyValue(merged.riskPenalty.Medium, 0, 0.5),
      High: clampPolicyValue(merged.riskPenalty.High, 0, 0.5),
    },
    riskThreshold: {
      Low: clampPolicyValue(merged.riskThreshold.Low, 0.4, 0.99),
      Medium: clampPolicyValue(merged.riskThreshold.Medium, 0.4, 0.99),
      High: clampPolicyValue(merged.riskThreshold.High, 0.4, 0.99),
    },
    advanceRatioByRisk: {
      Low: clampPolicyValue(merged.advanceRatioByRisk.Low, 0.05, 0.5),
      Medium: clampPolicyValue(merged.advanceRatioByRisk.Medium, 0.05, 0.5),
      High: clampPolicyValue(merged.advanceRatioByRisk.High, 0.05, 0.5),
    },
  };
}

export function getDefaultPredictivePolicyConfig() {
  return createPredictivePolicyConfig();
}

export function savePredictivePolicyConfig(policyConfig) {
  const sanitized = sanitizePolicyConfig(policyConfig);
  localStorage.setItem(
    predictivePolicyStorageKey,
    JSON.stringify({
      config: sanitized,
      savedAt: new Date().toISOString(),
    }),
  );
  return sanitized;
}

export function loadPredictivePolicyConfig(fallbackConfig = defaultPolicyConfig) {
  const raw = localStorage.getItem(predictivePolicyStorageKey);
  if (!raw) {
    return sanitizePolicyConfig(fallbackConfig);
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.config) {
      return sanitizePolicyConfig(parsed.config);
    }
    return sanitizePolicyConfig(parsed);
  } catch {
    return sanitizePolicyConfig(fallbackConfig);
  }
}

export function getPredictivePolicySavedAt() {
  const raw = localStorage.getItem(predictivePolicyStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.savedAt || null;
  } catch {
    return null;
  }
}

export function deriveLiveSignalsFromComposite({ triggerId, compositeSignals }) {
  if (!compositeSignals) {
    return undefined;
  }

  const trafficCongestion = Number(compositeSignals?.traffic?.congestion || 0);
  const reliability = clamp01(compositeSignals?.reliability ?? 0.5);
  const degradedCount = Number(compositeSignals?.degradedCount || 0);
  const platformCount = Number(compositeSignals?.platformSignals?.length || 0);
  const normalizedTraffic = clamp01(trafficCongestion / 100);
  const normalizedOutage = platformCount > 0 ? clamp01(degradedCount / platformCount) : 0;

  const outageFocused = triggerId === "platform-outage";
  const weather = outageFocused ? 0.28 : clamp01(0.58 + (reliability - 0.5) * 0.4);
  const outage = outageFocused ? clamp01(0.65 + normalizedOutage * 0.35) : clamp01(0.25 + normalizedOutage * 0.45);
  const traffic = clamp01(0.3 + normalizedTraffic * 0.7);
  const regional = clamp01((reliability + normalizedOutage + normalizedTraffic) / 3);
  const historical = clamp01(0.44 + normalizedTraffic * 0.18 + normalizedOutage * 0.12);

  return {
    weather,
    outage,
    traffic,
    regional,
    historical,
  };
}
