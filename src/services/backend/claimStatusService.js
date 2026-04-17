import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function mapClaimStatusToTone(status) {
  if (status === "paid" || status === "approved") return "positive";
  if (status === "reviewing" || status === "initiated") return "watch";
  return "neutral";
}

function mapRowToWorkerAlert(row) {
  const evidence =
    row?.evidence_payload && typeof row.evidence_payload === "object"
      ? row.evidence_payload
      : {};

  return {
    id: row.id,
    claimNumber: row.claim_number,
    status: row.status,
    tone: mapClaimStatusToTone(row.status),
    estimatedIncomeLoss: Number(row.estimated_income_loss || 0),
    approvedIncomeLoss: Number(row.approved_income_loss || 0),
    city: evidence.city || "",
    zoneId: evidence.zoneId || "",
    zoneName: evidence.zoneName || "",
    triggerKey: evidence.triggerKey || "",
    severity: evidence.severity || "",
    confidence: Number(evidence.confidence || 0),
    recommendation: evidence.recommendation || row.notes || "",
    nextRiskWindow: evidence.nextRiskWindow || "",
    source: evidence.source || "gigshield_app",
    createdAt: row.created_at,
  };
}

export async function fetchWorkerClaimAlerts({ limit = 6 } = {}) {
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
    const { data, error } = await supabase
      .from("claims")
      .select(
        "id, claim_number, status, estimated_income_loss, approved_income_loss, notes, evidence_payload, created_at",
      )
      .eq("worker_profile_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(mapRowToWorkerAlert);
  } catch {
    return [];
  }
}

