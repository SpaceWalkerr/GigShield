import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek() {
  const value = new Date();
  const day = value.getDay();
  const diff = day === 0 ? 6 : day - 1;
  value.setDate(value.getDate() - diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isWithinHours(isoDate, hours) {
  if (!isoDate) {
    return false;
  }

  const diffMs = Date.now() - new Date(isoDate).getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

export async function fetchDashboardMetrics({ city } = {}) {
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

  const todayIso = startOfToday().toISOString();
  const weekIso = startOfWeek().toISOString();

  try {
    const [payoutsResult, automationResult, triggerResult] = await Promise.all([
      supabase
        .from("payouts")
        .select("payout_amount, status, lifecycle_status, created_at, settled_at, payout_payload")
        .eq("worker_profile_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("risk_assessments")
        .select("assessment_payload, assessed_at, created_at")
        .eq("worker_profile_id", session.user.id)
        .eq("assessment_payload->>assessmentKind", "automation-risk-check")
        .order("assessed_at", { ascending: false })
        .limit(50),
      supabase
        .from("trigger_events")
        .select("trigger_key, status, severity, city, created_at")
        .neq("status", "expired")
        .neq("status", "dismissed")
        .gte("created_at", weekIso)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const payouts = Array.isArray(payoutsResult.data) ? payoutsResult.data : [];
    const automationAssessments = Array.isArray(automationResult.data) ? automationResult.data : [];
    const triggerEvents = Array.isArray(triggerResult.data) ? triggerResult.data : [];

    const cityScopedTriggers = city
      ? triggerEvents.filter((item) => item.city === city)
      : triggerEvents;

    const payoutsThisWeek = payouts.filter((item) => {
      const at = item.settled_at || item.created_at;
      return at ? new Date(at).getTime() >= new Date(weekIso).getTime() : false;
    });

    const payoutsToday = payouts.filter((item) => {
      const at = item.settled_at || item.created_at;
      return at ? new Date(at).getTime() >= new Date(todayIso).getTime() : false;
    });

    const supportThisWeek = payoutsThisWeek.reduce(
      (sum, item) => sum + Number(item.payout_amount || 0),
      0,
    );

    const supportToday = payoutsToday.reduce(
      (sum, item) => sum + Number(item.payout_amount || 0),
      0,
    );

    const latestPayout = payouts[0] || null;
    const latestAutomation = automationAssessments[0] || null;
    const latestAutomationPayload =
      latestAutomation?.assessment_payload &&
      typeof latestAutomation.assessment_payload === "object"
        ? latestAutomation.assessment_payload
        : {};
    const latestAutomationAt =
      latestAutomationPayload?._computedAt ||
      latestAutomation?.assessed_at ||
      latestAutomation?.created_at ||
      "";

    const automationTodayCount = automationAssessments.filter((item) => {
      const at = item.assessed_at || item.created_at;
      return at ? new Date(at).getTime() >= new Date(todayIso).getTime() : false;
    }).length;

    return {
      supportThisWeek,
      supportToday,
      latestPayoutAmount: Number(latestPayout?.payout_amount || 0),
      latestPayoutStatus:
        latestPayout?.lifecycle_status || latestPayout?.status || "none",
      recentTriggerCount: cityScopedTriggers.length,
      automationTodayCount,
      latestAutomationAt,
      activitySummary: {
        signalsProcessedToday: automationTodayCount + cityScopedTriggers.filter((item) => {
          return item.created_at
            ? new Date(item.created_at).getTime() >= new Date(todayIso).getTime()
            : false;
        }).length,
        lastActiveTime: latestAutomationAt,
        movementStatus:
          isWithinHours(latestAutomationAt, 6) ||
          latestAutomationPayload?.coverageStatus === "active"
            ? "Active"
            : "Idle",
        activeCoverage:
          latestAutomationPayload?.coverageStatus === "active",
      },
    };
  } catch {
    return null;
  }
}

