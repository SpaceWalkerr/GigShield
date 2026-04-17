import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function startOfWeek() {
  const value = new Date();
  const day = value.getDay();
  const diff = day === 0 ? 6 : day - 1;
  value.setDate(value.getDate() - diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatTriggerLabel(triggerKey) {
  const map = {
    "heavy-rain": "Heavy Rain",
    heatwave: "Heatwave",
    "aqi-spike": "AQI Spike",
    "platform-outage": "Platform Outage",
    "zone-closure": "Zone Closure",
    "curfew-lockdown": "Curfew",
    "local-strike": "Local Strike",
  };

  return map[triggerKey] || triggerKey || "Unknown";
}

export async function fetchOperationsInsights({ city } = {}) {
  if (!backendEnabled) {
    return null;
  }

  const weekIso = startOfWeek().toISOString();

  try {
    const [triggerResult, automationResult, payoutsResult] = await Promise.all([
      supabase
        .from("trigger_events")
        .select("id, city, zone_name, trigger_key, severity, status, created_at, signal_payload")
        .neq("status", "expired")
        .neq("status", "dismissed")
        .gte("created_at", weekIso)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("risk_assessments")
        .select("external_assessment_id, risk_level, assessment_payload, assessed_at, created_at")
        .eq("assessment_payload->>assessmentKind", "automation-risk-check")
        .order("assessed_at", { ascending: false })
        .limit(50),
      supabase
        .from("payouts")
        .select("payout_amount, status, lifecycle_status, created_at, settled_at, failure_reason_code")
        .gte("created_at", weekIso)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const allTriggers = Array.isArray(triggerResult.data) ? triggerResult.data : [];
    const automationAssessments = Array.isArray(automationResult.data) ? automationResult.data : [];
    const payouts = Array.isArray(payoutsResult.data) ? payoutsResult.data : [];

    const triggers = city ? allTriggers.filter((item) => item.city === city) : allTriggers;

    const recentDisruptions = triggers.slice(0, 6).map((item) => ({
      id: item.id,
      triggerKey: item.trigger_key,
      label: formatTriggerLabel(item.trigger_key),
      severity: item.severity || "medium",
      status: item.status || "observed",
      city: item.city || "Unknown",
      zoneName: item.zone_name || item.signal_payload?.zoneName || "",
      createdAt: item.created_at,
      source: item.signal_payload?.source || "gigshield_app",
    }));

    const recentAutomationScans = automationAssessments.slice(0, 6).map((item) => {
      const payload =
        item?.assessment_payload && typeof item.assessment_payload === "object"
          ? item.assessment_payload
          : {};

      return {
        id: item.external_assessment_id || item.assessed_at,
        riskLevel: String(payload.riskLevel || item.risk_level || "Medium"),
        confidence: Number(payload.confidence || 0),
        trigger: payload.lastTrigger || "none",
        city: payload.worker?.zone || payload.city || "Unknown",
        explanation: payload.explanation || "",
        assessedAt: payload._computedAt || item.assessed_at || item.created_at,
      };
    });

    const settled = payouts.filter((item) => item.lifecycle_status === "settled" || item.status === "settled");
    const failed = payouts.filter((item) => item.lifecycle_status === "failed" || item.status === "failed");
    const successRatePct = payouts.length > 0 ? Math.round((settled.length / payouts.length) * 100) : 100;
    const blockedValue = failed.reduce((sum, item) => sum + Number(item.payout_amount || 0), 0);

    const settlementMinutes = settled
      .map((item) => {
        const start = item.created_at ? new Date(item.created_at).getTime() : 0;
        const end = item.settled_at ? new Date(item.settled_at).getTime() : 0;
        if (!start || !end || end < start) return null;
        return Math.round((end - start) / 60000);
      })
      .filter((value) => typeof value === "number");

    const medianSettlementMins =
      settlementMinutes.length > 0
        ? settlementMinutes.sort((a, b) => a - b)[Math.floor(settlementMinutes.length / 2)]
        : 0;

    return {
      trustMetrics: {
        payoutSuccessRatePct: successRatePct,
        medianSettlementMins,
        fraudBlockedAmount: blockedValue,
        auditsCompleted: recentAutomationScans.length + recentDisruptions.length,
      },
      recentDisruptions,
      recentAutomationScans,
    };
  } catch {
    return null;
  }
}

