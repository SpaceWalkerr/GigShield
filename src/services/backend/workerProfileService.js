import { getCityZones } from "../../utils/incomeRadar";
import { getSession, saveSession } from "../../utils/session";
import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

export async function updateWorkerProfilePreferences({
  city,
  workPattern,
  weeklyEarningsBand,
  preferredZones,
} = {}) {
  if (!backendEnabled) {
    return { ok: false, backend: false, error: "Backend persistence disabled" };
  }

  const {
    data: { session: authSession },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    return { ok: false, backend: false, error: authError.message };
  }

  const authUser = authSession?.user;
  if (!authUser) {
    return { ok: false, backend: false, error: "Authenticated session required" };
  }

  const resolvedCity = city || getSession()?.city || "New Delhi";
  const fallbackZones = getCityZones(resolvedCity)
    .slice(0, 2)
    .map((zone) => ({
      id: zone.id,
      name: zone.name,
      corridor: zone.corridor,
    }));

  const nextZones =
    Array.isArray(preferredZones) && preferredZones.length > 0
      ? preferredZones.slice(0, 2)
      : fallbackZones;

  const payload = {
    city: resolvedCity,
    work_pattern: workPattern || null,
    weekly_earnings_band: weeklyEarningsBand || null,
    preferred_zones: nextZones,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("worker_profiles")
    .update(payload)
    .eq("profile_id", authUser.id)
    .select("city, work_pattern, weekly_earnings_band, preferred_zones")
    .single();

  if (error) {
    return { ok: false, backend: true, error: error.message };
  }

  const localSession = getSession();
  if (localSession) {
    saveSession({
      ...localSession,
      city: data?.city || resolvedCity,
      workPattern: data?.work_pattern || workPattern || localSession.workPattern,
      weeklyEarningsBand:
        data?.weekly_earnings_band ||
        weeklyEarningsBand ||
        localSession.weeklyEarningsBand,
      preferredZones: Array.isArray(data?.preferred_zones)
        ? data.preferred_zones
        : nextZones,
    });
  }

  return {
    ok: true,
    backend: true,
    profile: data,
  };
}

