import { supabase } from "./supabase";

const teamStorageKey = "gigshieldTeamProtection";
const backendEnabled = Boolean(import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true");

function defaultTeam() {
  return { teamName: "", inviteCode: "", members: [] };
}

function parseTeam(raw) {
  if (!raw) return defaultTeam();
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : defaultTeam();
  } catch {
    return defaultTeam();
  }
}

export function getLocalTeamState() {
  return parseTeam(localStorage.getItem(teamStorageKey));
}

function saveLocalTeamState(value) {
  localStorage.setItem(teamStorageKey, JSON.stringify(value));
}

export async function saveTeamState(value, options = {}) {
  saveLocalTeamState(value);

  if (!backendEnabled) {
    return { ok: true, backend: false };
  }

  try {
    const workerId = options.workerId || "unknown-worker";
    const payload = {
      owner_worker_id: workerId,
      invite_code: value.inviteCode || null,
      payload: value,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("team_protection_groups")
      .upsert(payload, { onConflict: "owner_worker_id" });

    if (error) {
      return { ok: false, backend: false, error: error.message };
    }

    return { ok: true, backend: true };
  } catch {
    return { ok: false, backend: false, error: "Backend persistence unavailable" };
  }
}

export async function hydrateTeamState(options = {}) {
  const workerId = options.workerId;
  const local = getLocalTeamState();

  if (!backendEnabled || !workerId) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from("team_protection_groups")
      .select("payload")
      .eq("owner_worker_id", workerId)
      .maybeSingle();

    if (error || !data?.payload) {
      return local;
    }

    saveLocalTeamState(data.payload);
    return data.payload;
  } catch {
    return local;
  }
}

