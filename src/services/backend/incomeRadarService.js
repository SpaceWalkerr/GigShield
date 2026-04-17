import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function mapRowToRadar(row) {
  return {
    city: row.city,
    headline: `${row.city} next-shift radar`,
    safestZone: {
      id: row.safest_zone_id,
      name: row.safest_zone_name,
      ...(Array.isArray(row.zones)
        ? row.zones.find((zone) => zone.id === row.safest_zone_id) || {}
        : {}),
    },
    highestRiskZone: {
      id: row.highest_risk_zone_id,
      name: row.highest_risk_zone_name,
      ...(Array.isArray(row.zones)
        ? row.zones.find((zone) => zone.id === row.highest_risk_zone_id) || {}
        : {}),
    },
    bestWindow: row.best_window,
    recommendation: row.recommendation,
    confidenceScore: row.confidence_score,
    zones: Array.isArray(row.zones) ? row.zones : [],
    tomorrowOutlook: Array.isArray(row.tomorrow_outlook) ? row.tomorrow_outlook : [],
    demoStory:
      row.demo_story && typeof row.demo_story === "object"
        ? row.demo_story
        : { title: "Judge demo story", setup: "", move: "", fallback: "" },
  };
}

export async function saveIncomeRadarSnapshot(radar, options = {}) {
  if (!backendEnabled || !radar) {
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
    worker_profile_id: authUser.id,
    city: radar.city || options.city || "New Delhi",
    safest_zone_id: radar.safestZone?.id || null,
    safest_zone_name: radar.safestZone?.name || null,
    highest_risk_zone_id: radar.highestRiskZone?.id || null,
    highest_risk_zone_name: radar.highestRiskZone?.name || null,
    best_window: radar.bestWindow || null,
    recommendation: radar.recommendation || null,
    confidence_score: Number(radar.confidenceScore || 0),
    zones: radar.zones || [],
    tomorrow_outlook: radar.tomorrowOutlook || [],
    demo_story: radar.demoStory || {},
    snapshot_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("income_radar_snapshots").insert(row);

  if (error) {
    return { ok: false, backend: false, error: error.message };
  }

  return { ok: true, backend: true };
}

export async function fetchLatestIncomeRadarSnapshot(options = {}) {
  const { city } = options;

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

  try {
    let query = supabase
      .from("income_radar_snapshots")
      .select(
        "city, safest_zone_id, safest_zone_name, highest_risk_zone_id, highest_risk_zone_name, best_window, recommendation, confidence_score, zones, tomorrow_outlook, demo_story, snapshot_at",
      )
      .eq("worker_profile_id", session.user.id)
      .order("snapshot_at", { ascending: false })
      .limit(1);

    if (city) {
      query = query.eq("city", city);
    }

    let data, error;
    try {
      const response = await query.maybeSingle();
      data = response.data;
      error = response.error;
    } catch (err) {
      console.warn("[IncomeRadar] Fetch failed:", err.message);
      return null;
    }

    if (error || !data) {
      return null;
    }

    return mapRowToRadar(data);
  } catch {
    return null;
  }
}
