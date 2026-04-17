import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function buildPayoutId(claimId) {
  return `AUTO-PAYOUT-${String(claimId || "claim").slice(0, 8).toUpperCase()}`;
}

function mapClaimToPayoutCandidate(claim) {
  const evidence =
    claim?.evidence_payload && typeof claim.evidence_payload === "object"
      ? claim.evidence_payload
      : {};

  const payoutAmount = Number(
    claim?.approved_income_loss || claim?.estimated_income_loss || evidence?.earningsProtected || 0,
  );

  return {
    claim_id: claim.id,
    worker_profile_id: claim.worker_profile_id,
    payout_id: buildPayoutId(claim.id),
    status: "pending_verification",
    payout_amount: payoutAmount,
    currency: "INR",
    payout_channel: "simulated_upi",
    lifecycle_status: "pending-verification",
    verification_payload: {},
    payout_payload: {
      payoutId: buildPayoutId(claim.id),
      status: "paid",
      lifecycleStatus: "pending-verification",
      payoutAmount,
      basePayout: payoutAmount,
      planId: claim.policy_id || "",
      claimId: claim.id,
      claimNumber: claim.claim_number || "",
      triggerId: evidence.triggerKey || "",
      triggerLabel: evidence.triggerKey || "",
      reason: claim.notes || "Auto-generated from live disruption sweep",
      riskLevel: evidence.riskLevel || "",
      triggerConfidenceScore: Number(evidence.confidence || 0),
      coverageHours: "",
      createdAt: claim.created_at || new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };
}

export async function generatePayoutCandidatesFromClaims({ claimIds = [] } = {}) {
  if (!backendEnabled || !Array.isArray(claimIds) || claimIds.length === 0) {
    return {
      ok: true,
      backend: false,
      createdCount: 0,
      payouts: [],
    };
  }

  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select(
      "id, worker_profile_id, policy_id, status, estimated_income_loss, approved_income_loss, notes, evidence_payload, created_at",
    )
    .in("id", claimIds);

  if (claimsError) {
    return {
      ok: false,
      backend: true,
      createdCount: 0,
      payouts: [],
      error: claimsError.message,
    };
  }

  const eligibleClaims = (claims || []).filter((claim) =>
    ["initiated", "reviewing", "approved"].includes(claim.status),
  );

  if (eligibleClaims.length === 0) {
    return {
      ok: true,
      backend: true,
      createdCount: 0,
      payouts: [],
    };
  }

  const payoutRows = eligibleClaims.map(mapClaimToPayoutCandidate);

  const { data: insertedPayouts, error: payoutError } = await supabase
    .from("payouts")
    .upsert(payoutRows, { onConflict: "payout_id" })
    .select("id, payout_id, claim_id, worker_profile_id, status, payout_amount, created_at");

  if (payoutError) {
    return {
      ok: false,
      backend: true,
      createdCount: 0,
      payouts: [],
      error: payoutError.message,
    };
  }

  const { error: updateError } = await supabase
    .from("claims")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .in("id", eligibleClaims.map((claim) => claim.id));

  if (updateError) {
    return {
      ok: false,
      backend: true,
      createdCount: insertedPayouts?.length || 0,
      payouts: insertedPayouts || [],
      error: updateError.message,
    };
  }

  return {
    ok: true,
    backend: true,
    createdCount: insertedPayouts?.length || 0,
    payouts: insertedPayouts || [],
  };
}

