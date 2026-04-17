import { getApiUrl } from "../../utils/api";
import { getCityZones } from "../../utils/incomeRadar";
import { expireStaleTriggerEvents, syncTriggerEventToBackend } from "./triggerEventService";
import { generateAutomaticClaimsFromSweeps } from "./claimAutomationService";
import { generatePayoutCandidatesFromClaims } from "./payoutCandidateService";

const defaultCities = [
  { name: "New Delhi", latitude: 28.6139, longitude: 77.2090 },
  { name: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
  { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946 },
];

function resolveImpactedZone(scan) {
  const zones = getCityZones(scan.city);
  if (!Array.isArray(zones) || zones.length === 0) {
    return null;
  }

  const ranked = [...zones].sort((a, b) => {
    const aScore = (a.weatherBias || 0) + (a.payoutBias || 0);
    const bScore = (b.weatherBias || 0) + (b.payoutBias || 0);
    return bScore - aScore;
  });

  if (String(scan.severity || "").toLowerCase() === "critical") return ranked[0];
  if (String(scan.severity || "").toLowerCase() === "high") return ranked[0];
  return ranked[1] || ranked[0];
}

export async function runSignalIngestionSweep(options = {}) {
  const expiryResult = await expireStaleTriggerEvents({ maxAgeHours: 4 });

  const response = await fetch(getApiUrl("/api/automation/signal-sweep"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cities: options.cities || defaultCities,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Signal sweep failed ${response.status}${text ? `: ${text}` : ""}`);
  }

  const json = await response.json();
  if (!json?.success) {
    throw new Error(json?.error || "Signal sweep was unsuccessful");
  }

  const scans = Array.isArray(json?.data?.scans) ? json.data.scans : [];
  const enrichedScans = scans.map((scan) => {
    const impactedZone = resolveImpactedZone(scan);
    return {
      ...scan,
      zoneId: impactedZone?.id || "",
      zoneName: impactedZone?.name || "",
    };
  });

  const syncResults = await Promise.all(
    enrichedScans
      .filter((scan) => scan.triggerKey)
      .map((scan) =>
        syncTriggerEventToBackend(
          {
            id: `sweep-${scan.city}-${scan.scannedAt}`,
            createdAt: scan.scannedAt,
            triggerId: scan.triggerKey,
            decision: scan.claimStatus === "auto-generated" ? "paid" : "observed",
            reason: scan.explanation || scan.notification || "",
            payoutAmount: Number(scan.earningsProtected || 0),
            confidence: Number(scan.confidence || 0),
            city: scan.city,
            severity: scan.severity,
            source: "signal_sweep",
          },
          {
            city: scan.city,
            zoneId: scan.zoneId || null,
            zoneName: scan.zoneName || null,
            source: "signal_sweep",
          },
        ),
      ),
  );

  const syncedScans = enrichedScans
    .filter((scan) => scan.triggerKey)
    .map((scan, index) => ({
      ...scan,
      triggerEventId: syncResults[index]?.event?.id || null,
    }))
    .filter((scan) => scan.triggerEventId);

  const claimAutomationResult = await generateAutomaticClaimsFromSweeps({
    syncedScans,
  });

  const payoutCandidateResult = await generatePayoutCandidatesFromClaims({
    claimIds: (claimAutomationResult?.claims || []).map((claim) => claim.id),
  });

  return {
    scannedAt: json?.data?.scannedAt || new Date().toISOString(),
    scans: enrichedScans,
    syncedCount: syncResults.filter((result) => result?.ok && result?.backend).length,
    expiredCount: expiryResult?.expiredCount || 0,
    generatedClaimsCount: claimAutomationResult?.createdCount || 0,
    generatedClaims: claimAutomationResult?.claims || [],
    generatedPayoutsCount: payoutCandidateResult?.createdCount || 0,
    generatedPayouts: payoutCandidateResult?.payouts || [],
  };
}

