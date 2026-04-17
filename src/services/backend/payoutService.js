import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function mapLifecycleStatus(status) {
  if (status === "settled") return "settled";
  if (status === "processing") return "processing";
  if (status === "verified") return "verified";
  if (status === "failed") return "failed";
  if (status === "pending-verification") return "pending_verification";
  return "blocked";
}

function mapClaimStatus(receipt) {
  if (receipt?.lifecycleStatus === "settled") return "paid";
  if (receipt?.lifecycleStatus === "failed") return "rejected";
  if (receipt?.lifecycleStatus === "processing") return "approved";
  return "reviewing";
}

function mapRowToReceipt(row) {
  const payload =
    row?.payout_payload && typeof row.payout_payload === "object"
      ? row.payout_payload
      : {};

  return {
    ...payload,
    payoutId: row.payout_id || payload.payoutId,
    payoutAmount: Number(row.payout_amount || payload.payoutAmount || 0),
    lifecycleStatus:
      payload.lifecycleStatus || row.status?.replaceAll("_", "-") || "pending-verification",
    failureReasonCode: row.failure_reason_code || payload.failureReasonCode || "",
    failureReason: row.failure_reason || payload.failureReason || "",
    receivedAt: row.settled_at || payload.receivedAt || "",
    createdAt: row.created_at || payload.createdAt,
    lifecycleUpdatedAt: row.updated_at || payload.lifecycleUpdatedAt || payload.createdAt,
  };
}

async function getActivePolicyForWorker(workerProfileId, planId) {
  let query = supabase
    .from("weekly_policies")
    .select("id, plan_id, status, activated_at, created_at")
    .eq("worker_profile_id", workerProfileId)
    .order("activated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (planId) {
    query = query.eq("plan_id", planId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return null;
  }

  return data || null;
}

export async function syncPayoutReceiptToBackend(receipt) {
  if (!backendEnabled || !receipt?.payoutId) {
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

  const policy = await getActivePolicyForWorker(authUser.id, receipt.planId);
  if (!policy?.id) {
    return { ok: false, backend: false, error: "Active weekly policy not found" };
  }

  const claimPayload = {
    worker_profile_id: authUser.id,
    policy_id: policy.id,
    claim_number: `CLM-${receipt.payoutId}`,
    status: mapClaimStatus(receipt),
    claim_mode: "automatic",
    estimated_income_loss: Number(
      receipt.basePayout || receipt.payoutAmount || 0,
    ),
    approved_income_loss: Number(receipt.payoutAmount || 0),
    notes: receipt.reason || "",
    evidence_payload: {
      triggerId: receipt.triggerId || "",
      triggerLabel: receipt.triggerLabel || "",
      riskLevel: receipt.riskLevel || "",
      coverageHours: receipt.coverageHours || "",
      triggerConfidenceScore: receipt.triggerConfidenceScore || null,
      receivedWithVerification: receipt.receivedWithVerification || null,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: claimData, error: claimError } = await supabase
    .from("claims")
    .upsert(claimPayload, { onConflict: "claim_number" })
    .select("id")
    .single();

  if (claimError || !claimData?.id) {
    return { ok: false, backend: false, error: claimError?.message || "Claim sync failed" };
  }

  const payoutPayload = {
    claim_id: claimData.id,
    worker_profile_id: authUser.id,
    payout_id: receipt.payoutId,
    status: mapLifecycleStatus(receipt.lifecycleStatus),
    payout_amount: Number(receipt.payoutAmount || 0),
    currency: "INR",
    payout_channel: "simulated_upi",
    lifecycle_status: receipt.lifecycleStatus || null,
    failure_reason_code: receipt.failureReasonCode || null,
    failure_reason: receipt.failureReason || null,
    verification_payload: receipt.receivedWithVerification || {},
    payout_payload: receipt,
    settled_at:
      receipt.lifecycleStatus === "settled"
        ? receipt.receivedAt || new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error: payoutError } = await supabase
    .from("payouts")
    .upsert(payoutPayload, { onConflict: "payout_id" });

  if (payoutError) {
    return { ok: false, backend: false, error: payoutError.message };
  }

  return { ok: true, backend: true };
}

export async function fetchPayoutHistoryFromBackend({ limit = 100 } = {}) {
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
      .from("payouts")
      .select(
        "payout_id, status, payout_amount, payout_payload, created_at, updated_at, settled_at, failure_reason_code, failure_reason",
      )
      .eq("worker_profile_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(mapRowToReceipt);
  } catch (err) {
    console.warn("[PayoutService] Sync fetch failed:", err.message);
    return [];
  }
}
