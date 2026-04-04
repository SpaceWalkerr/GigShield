import { supabase } from "./supabase";

const backendEnabled = Boolean(import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true");
const localModerationActionsKey = "gigshieldModerationActions";

function readLocalModerationActions() {
  const raw = localStorage.getItem(localModerationActionsKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalModerationAction(action) {
  const existing = readLocalModerationActions();
  existing.unshift(action);
  localStorage.setItem(localModerationActionsKey, JSON.stringify(existing.slice(0, 200)));
}

export async function persistAnomalyEvents(alerts = [], options = {}) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return { ok: true, backend: false, count: 0 };
  }

  if (!backendEnabled) {
    return { ok: true, backend: false, count: alerts.length };
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  const workerId = options.workerId || "unknown-worker";

  const rows = alerts.map((alert) => ({
    event_id: `${alert.id}-${dayKey}`,
    worker_id: workerId,
    event_type: alert.id,
    severity: alert.severity || "medium",
    title: alert.title || alert.id,
    detail: alert.detail || "",
    payload: alert,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase.from("anomaly_events").upsert(rows, { onConflict: "event_id" });
    if (error) {
      return { ok: false, backend: false, count: 0, error: error.message };
    }
    return { ok: true, backend: true, count: rows.length };
  } catch {
    return { ok: false, backend: false, count: 0, error: "Backend persistence unavailable" };
  }
}

export async function saveModerationAction(action, options = {}) {
  if (!action || typeof action !== "object") {
    return { ok: false, backend: false, error: "Invalid action" };
  }

  const entry = {
    actionId: action.actionId || `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actorWorkerId: options.actorWorkerId || action.actorWorkerId || "unknown-worker",
    targetWorkerId: action.targetWorkerId || "unknown-worker",
    actionType: action.actionType || "team-cluster-review",
    decision: action.decision || "review",
    reason: action.reason || "",
    payload: action.payload || {},
    createdAt: new Date().toISOString(),
  };

  saveLocalModerationAction(entry);

  if (!backendEnabled) {
    return { ok: true, backend: false, action: entry };
  }

  try {
    const row = {
      action_id: entry.actionId,
      actor_worker_id: entry.actorWorkerId,
      target_worker_id: entry.targetWorkerId,
      action_type: entry.actionType,
      decision: entry.decision,
      reason: entry.reason,
      payload: entry.payload,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("moderation_actions").upsert(row, { onConflict: "action_id" });
    if (error) {
      return { ok: false, backend: false, action: entry, error: error.message };
    }

    return { ok: true, backend: true, action: entry };
  } catch {
    return { ok: false, backend: false, action: entry, error: "Backend persistence unavailable" };
  }
}

export async function fetchModerationActions(options = {}) {
  const limit = options.limit || 50;

  if (!backendEnabled) {
    return readLocalModerationActions().slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from("moderation_actions")
      .select("action_id, actor_worker_id, target_worker_id, action_type, decision, reason, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) {
      return readLocalModerationActions().slice(0, limit);
    }

    return data.map((row) => ({
      actionId: row.action_id,
      actorWorkerId: row.actor_worker_id,
      targetWorkerId: row.target_worker_id,
      actionType: row.action_type,
      decision: row.decision,
      reason: row.reason,
      payload: row.payload,
      createdAt: row.created_at,
    }));
  } catch {
    return readLocalModerationActions().slice(0, limit);
  }
}
