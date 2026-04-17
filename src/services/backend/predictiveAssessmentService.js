import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function mapAssessmentStatus(status) {
  if (status === "predictive-approved") {
    return "approved";
  }

  if (status === "predictive-invalid") {
    return "rejected";
  }

  return "scored";
}

function mapRowToAssessment(row) {
  const payload =
    row?.assessment_payload && typeof row.assessment_payload === "object"
      ? row.assessment_payload
      : {};

  return {
    ...payload,
    assessmentId: row.external_assessment_id || payload.assessmentId || row.id,
    workerProfileId: row.worker_profile_id,
    triggerId: payload.triggerId || row.trigger_event_id || null,
    riskLevel: row.risk_level,
    status: payload.status || row.status,
    probabilityRaw: Number(row.probability_raw || payload.probabilityRaw || 0),
    probabilityAdjusted: Number(
      row.probability_adjusted || payload.probabilityAdjusted || 0,
    ),
    thresholdPct:
      payload.thresholdPct ??
      Math.round(Number(row.threshold || 0) * 100),
    confidenceLabel: row.confidence_label || payload.confidenceLabel || "Weak",
    factors: row.factors || payload.factors || {},
    reason: row.reason || payload.reason || "",
    createdAt: row.created_at || payload.createdAt,
    assessedAt: row.assessed_at || payload.createdAt,
  };
}

export async function savePredictiveAssessmentToBackend(assessment, options = {}) {
  if (!backendEnabled) {
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

  const row = {
    worker_profile_id: authUser.id,
    external_assessment_id:
      assessment.assessmentId || `predictive-${Date.now()}`,
    risk_level: assessment.riskLevel || options.riskLevel || "Medium",
    status: mapAssessmentStatus(assessment.status),
    probability_raw: Number(assessment.probabilityRaw || 0),
    probability_adjusted: Number(assessment.probabilityAdjusted || 0),
    threshold: Number(assessment.thresholdPct || 0) / 100,
    confidence_label: assessment.confidenceLabel || "Weak",
    factors: assessment.factors || {},
    assessment_payload: {
      ...assessment,
      city: options.city || assessment.city || "Unknown",
      workerId: options.workerId || assessment.workerId || null,
    },
    reason: assessment.reason || "",
    assessed_at: assessment.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("risk_assessments").upsert(row, {
    onConflict: "external_assessment_id",
  });

  if (error) {
    return { ok: false, backend: false, error: error.message };
  }

  return { ok: true, backend: true };
}

export async function fetchPredictiveAssessmentsFromBackend(options = {}) {
  const { workerId, limit = 50 } = options;

  if (!backendEnabled) {
    return [];
  }

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return [];
  }

  try {
    let query = supabase
      .from("risk_assessments")
      .select(
        "id, worker_profile_id, external_assessment_id, risk_level, status, probability_raw, probability_adjusted, threshold, confidence_label, factors, assessment_payload, reason, assessed_at, created_at",
      )
      .eq("worker_profile_id", session.user.id)
      .order("assessed_at", { ascending: false })
      .limit(limit);

    if (workerId) {
      query = query.eq(
        "assessment_payload->>workerId",
        String(workerId),
      );
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(mapRowToAssessment);
  } catch (err) {
    console.warn("[PredictiveService] Sync fetch failed:", err.message);
    return [];
  }
}
