import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function buildClaimNumber(triggerEventId, workerProfileId) {
  return `AUTO-${String(triggerEventId || "event").slice(0, 8)}-${String(workerProfileId || "worker").slice(0, 8)}`;
}

function deriveEstimatedLoss(scan, workerProfile, policy) {
  const protectedAmount = Number(scan?.earningsProtected || 0);
  const weeklyEstimate = Number(workerProfile?.weekly_earnings_estimate || 0);
  const payoutCap = Number(policy?.weekly_payout_cap || 0);

  const baseline =
    protectedAmount ||
    (weeklyEstimate > 0 ? Math.round(weeklyEstimate / 6) : 0);

  if (payoutCap > 0 && baseline > 0) {
    return Math.min(baseline, payoutCap);
  }

  return baseline;
}

function normalizePreferredZones(value) {
  return Array.isArray(value) ? value : [];
}

function doesWorkerMatchScanZone(worker, scan) {
  if (!scan?.zoneId && !scan?.zoneName) {
    return true;
  }

  const preferredZones = normalizePreferredZones(worker?.preferred_zones);
  if (preferredZones.length === 0) {
    return false;
  }

  return preferredZones.some((zone) => {
    const zoneId = String(zone?.id || "").toLowerCase();
    const zoneName = String(zone?.name || "").toLowerCase();

    return (
      (scan.zoneId && zoneId === String(scan.zoneId).toLowerCase()) ||
      (scan.zoneName && zoneName === String(scan.zoneName).toLowerCase())
    );
  });
}

export async function generateAutomaticClaimsFromSweeps({ syncedScans = [] } = {}) {
  if (!backendEnabled || !Array.isArray(syncedScans) || syncedScans.length === 0) {
    return {
      ok: true,
      backend: false,
      createdCount: 0,
      claims: [],
    };
  }

  const confirmedScans = syncedScans.filter(
    (scan) => scan?.triggerEventId && scan?.triggerKey && scan?.city,
  );

  if (confirmedScans.length === 0) {
    return {
      ok: true,
      backend: true,
      createdCount: 0,
      claims: [],
    };
  }

  const uniqueCities = [...new Set(confirmedScans.map((scan) => scan.city))];
  const { data: workers, error: workersError } = await supabase
    .from("worker_profiles")
    .select("profile_id, worker_id, city, weekly_earnings_estimate, weekly_earnings_band, preferred_zones")
    .in("city", uniqueCities);

  if (workersError) {
    return {
      ok: false,
      backend: true,
      createdCount: 0,
      claims: [],
      error: workersError.message,
    };
  }

  const workerIds = (workers || []).map((worker) => worker.profile_id);
  if (workerIds.length === 0) {
    return {
      ok: true,
      backend: true,
      createdCount: 0,
      claims: [],
    };
  }

  const { data: policies, error: policiesError } = await supabase
    .from("weekly_policies")
    .select("id, worker_profile_id, plan_id, plan_name, status, weekly_payout_cap")
    .in("worker_profile_id", workerIds)
    .eq("status", "active");

  if (policiesError) {
    return {
      ok: false,
      backend: true,
      createdCount: 0,
      claims: [],
      error: policiesError.message,
    };
  }

  const workersByCity = new Map();
  (workers || []).forEach((worker) => {
    const entries = workersByCity.get(worker.city) || [];
    entries.push(worker);
    workersByCity.set(worker.city, entries);
  });

  const activePolicyByWorker = new Map(
    (policies || []).map((policy) => [policy.worker_profile_id, policy]),
  );

  const claimRows = [];
  confirmedScans.forEach((scan) => {
    const cityWorkers = workersByCity.get(scan.city) || [];
    cityWorkers.forEach((worker) => {
      if (!doesWorkerMatchScanZone(worker, scan)) return;

      const policy = activePolicyByWorker.get(worker.profile_id);
      if (!policy?.id) return;

      const estimatedLoss = deriveEstimatedLoss(scan, worker, policy);
      claimRows.push({
        worker_profile_id: worker.profile_id,
        policy_id: policy.id,
        trigger_event_id: scan.triggerEventId,
        claim_number: buildClaimNumber(scan.triggerEventId, worker.profile_id),
        status: "initiated",
        claim_mode: "automatic",
        estimated_income_loss: estimatedLoss,
        approved_income_loss: null,
        notes: scan.explanation || scan.notification || "Auto-generated from live disruption sweep",
        evidence_payload: {
          source: "signal_sweep",
          city: scan.city,
          zoneId: scan.zoneId || "",
          zoneName: scan.zoneName || "",
          triggerKey: scan.triggerKey,
          severity: scan.severity || "",
          confidence: Number(scan.confidence || 0),
          riskLevel: scan.riskLevel || "",
          recommendation: scan.recommendedAction || "",
          nextRiskWindow: scan.nextRiskWindow || "",
          sweepScannedAt: scan.scannedAt || new Date().toISOString(),
          earningsProtected: Number(scan.earningsProtected || 0),
        },
      });
    });
  });

  if (claimRows.length === 0) {
    return {
      ok: true,
      backend: true,
      createdCount: 0,
      claims: [],
    };
  }

  const { data: insertedClaims, error: claimsError } = await supabase
    .from("claims")
    .upsert(claimRows, { onConflict: "claim_number" })
    .select("id, claim_number, worker_profile_id, trigger_event_id, status, created_at");

  if (claimsError) {
    return {
      ok: false,
      backend: true,
      createdCount: 0,
      claims: [],
      error: claimsError.message,
    };
  }

  return {
    ok: true,
    backend: true,
    createdCount: insertedClaims?.length || 0,
    claims: insertedClaims || [],
  };
}

