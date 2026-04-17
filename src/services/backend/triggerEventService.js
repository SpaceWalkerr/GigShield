import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function mapTriggerType(triggerId) {
  if (triggerId === "heavy-rain" || triggerId === "heatwave") return "weather";
  if (triggerId === "aqi-spike") return "aqi";
  if (triggerId === "platform-outage") return "platform_outage";
  if (triggerId === "zone-closure") return "regional_disruption";
  if (triggerId === "curfew-lockdown" || triggerId === "local-strike") return "regional_disruption";
  return "regional_disruption";
}

function mapSeverity({ decision, confidence, triggerId }) {
  if (decision === "paid" || decision === "capped") return "high";
  if (triggerId === "platform-outage") return "critical";
  if (Number(confidence || 0) >= 85) return "high";
  if (Number(confidence || 0) >= 65) return "medium";
  return "low";
}

function mapRowToAuditEvent(row) {
  const payload = row?.signal_payload && typeof row.signal_payload === "object" ? row.signal_payload : {};

  return {
    id: row.id || payload.id || `${row.trigger_key}-${row.created_at}`,
    createdAt: row.created_at || payload.createdAt || new Date().toISOString(),
    triggerId: row.trigger_key || payload.triggerId || "",
    decision: payload.decision || row.status || "observed",
    reason: payload.reason || "",
    payoutAmount: Number(payload.payoutAmount || 0),
    confidence: Number(payload.confidence || 0),
    city: row.city || payload.city || "",
    severity: row.severity || payload.severity || "",
    source: row.source || payload.source || "",
  };
}

export async function syncTriggerEventToBackend(event, context = {}) {
  if (!backendEnabled || !event?.triggerId) {
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
    city: context.city || event.city || "Unknown",
    zone_id: context.zoneId || null,
    zone_name: context.zoneName || null,
    source: context.source || "gigshield_app",
    trigger_type: mapTriggerType(event.triggerId),
    trigger_key: event.triggerId,
    severity: mapSeverity({
      decision: event.decision,
      confidence: event.confidence,
      triggerId: event.triggerId,
    }),
    status: event.decision === "paid" || event.decision === "capped" ? "confirmed" : "observed",
    starts_at: event.createdAt || new Date().toISOString(),
    signal_payload: {
      ...event,
      workerProfileId: authUser.id,
      syncedAt: new Date().toISOString(),
    },
  };

  const { data, error } = await supabase
    .from("trigger_events")
    .insert(row)
    .select("id, city, trigger_key, severity, created_at")
    .single();
  if (error) {
    return { ok: false, backend: false, error: error.message };
  }

  return { ok: true, backend: true, event: data || null };
}

export async function fetchRecentTriggerEventsFromBackend({ city, limit = 50 } = {}) {
  if (!backendEnabled) {
    return [];
  }

  const query = supabase
    .from("trigger_events")
    .select("id, city, source, trigger_type, trigger_key, severity, status, signal_payload, created_at")
    .neq("status", "expired")
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(limit);

  const scoped = city ? query.eq("city", city) : query;
  const { data, error } = await scoped;

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map(mapRowToAuditEvent);
}

export async function expireStaleTriggerEvents({ maxAgeHours = 4 } = {}) {
  if (!backendEnabled) {
    return { ok: true, backend: false, expiredCount: 0 };
  }

  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("trigger_events")
    .update({
      status: "expired",
      ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("status", ["observed", "confirmed"])
    .lt("starts_at", cutoff)
    .select("id");

  if (error) {
    return { ok: false, backend: true, expiredCount: 0, error: error.message };
  }

  return {
    ok: true,
    backend: true,
    expiredCount: Array.isArray(data) ? data.length : 0,
  };
}

