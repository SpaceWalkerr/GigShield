import { supabase } from "../../utils/supabase";
import { syncTriggerEventToBackend } from "./triggerEventService";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function toTitleRiskLevel(value) {
  const normalized = String(value || "medium").toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  return "Medium";
}

function mapAssessmentStatus(result) {
  if (result?.claimStatus === "auto-generated") {
    return "approved";
  }

  if (result?.claimStatus === "pending-review") {
    return "scored";
  }

  return "scored";
}

function mapTriggerKey(triggerType) {
  const normalized = String(triggerType || "").toLowerCase();
  if (normalized === "heavy_rain") return "heavy-rain";
  if (normalized === "extreme_heat") return "heatwave";
  if (normalized === "poor_aqi") return "aqi-spike";
  if (normalized === "high_wind") return "zone-closure";
  return "";
}

function mapRowToAutomationResult(row) {
  const payload =
    row?.assessment_payload && typeof row.assessment_payload === "object"
      ? row.assessment_payload
      : {};

  return {
    ...payload,
    assessmentId: row.external_assessment_id || payload.assessmentId || row.id,
    riskLevel: String(payload.riskLevel || row.risk_level || "Medium").toLowerCase(),
    confidence: Number(payload.confidence || 0),
    premium: Number(payload.premium || 0),
    earningsProtected: Number(payload.earningsProtected || 0),
    _computedAt: payload._computedAt || row.assessed_at || row.created_at,
  };
}

export async function saveAutomationAssessmentToBackend(result, options = {}) {
  if (!backendEnabled || !result) {
    return { ok: true, backend: false };
  }

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    return { ok: false, backend: false, error: authError.message };
  }

  const authUser = session?.user;
  if (!authUser) {
    return { ok: false, backend: false, error: "Authenticated session required" };
  }

  const externalAssessmentId =
    result.assessmentId || `automation-${Date.now()}`;

  const row = {
    worker_profile_id: authUser.id,
    external_assessment_id: externalAssessmentId,
    risk_level: toTitleRiskLevel(result.riskLevel),
    status: mapAssessmentStatus(result),
    probability_raw: Number(result.riskScore || 0) / 100,
    probability_adjusted: Number(result.confidence || 0) / 100,
    threshold: Number(result.riskLevel === "high" ? 0.8 : result.riskLevel === "medium" ? 0.5 : 0.2),
    confidence_label:
      Number(result.confidence || 0) >= 85
        ? "Strong"
        : Number(result.confidence || 0) >= 65
          ? "Normal"
          : "Weak",
    factors: {
      liveWeather: result.liveWeather || null,
      claimStatus: result.claimStatus || "",
      coverageStatus: result.coverageStatus || "",
    },
    assessment_payload: {
      ...result,
      assessmentKind: "automation-risk-check",
      city: options.city || result?.worker?.zone || "Unknown",
      workerId: options.workerId || result?.worker?.id || null,
      persistedAt: new Date().toISOString(),
    },
    reason: result.explanation || result.notification || "",
    assessed_at: result._computedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("risk_assessments").upsert(row, {
    onConflict: "external_assessment_id",
  });

  if (error) {
    return { ok: false, backend: false, error: error.message };
  }

  const triggerKey = mapTriggerKey(result.lastTrigger);
  if (triggerKey) {
    await syncTriggerEventToBackend(
      {
        id: externalAssessmentId,
        createdAt: result._computedAt || new Date().toISOString(),
        triggerId: triggerKey,
        decision:
          result.claimStatus === "auto-generated"
            ? "paid"
            : result.claimStatus === "pending-review"
              ? "reviewing"
              : "observed",
        reason: result.notification || result.explanation || "",
        payoutAmount: Number(result.earningsProtected || 0),
        confidence: Number(result.confidence || 0),
        city: options.city || result?.worker?.zone || "Unknown",
        severity: String(result.riskLevel || "medium").toLowerCase(),
        source: "automation_risk_engine",
      },
      {
        city: options.city || result?.worker?.zone || "Unknown",
        source: "automation_risk_engine",
      },
    );
  }

  return { ok: true, backend: true, assessmentId: externalAssessmentId };
}

export async function fetchLatestAutomationAssessmentFromBackend() {
  if (!backendEnabled) {
    return null;
  }

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("risk_assessments")
      .select(
        "id, worker_profile_id, external_assessment_id, risk_level, assessment_payload, assessed_at, created_at",
      )
      .eq("worker_profile_id", session.user.id)
      .eq("assessment_payload->>assessmentKind", "automation-risk-check")
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRowToAutomationResult(data);
  } catch {
    return null;
  }
}

