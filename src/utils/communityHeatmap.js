import { supabase } from "./supabase";
import { getPredictiveAssessments } from "./predictiveSafetyNet";

const backendEnabled = Boolean(import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true");
const fallbackCities = ["Bengaluru", "Delhi", "Mumbai", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function aggregateRows(rows) {
  const grouped = rows.reduce((acc, row) => {
    const city = row.city || row.payload?.city || "Unknown";
    if (!acc[city]) {
      acc[city] = {
        city,
        disruptionCount: 0,
        approvedCount: 0,
        confidenceSum: 0,
      };
    }

    acc[city].disruptionCount += 1;
    if (row.status === "predictive-approved") {
      acc[city].approvedCount += 1;
    }
    acc[city].confidenceSum += Number(row.probability_adjusted || row.payload?.probabilityAdjusted || 0);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => {
      const avgConfidence = item.disruptionCount > 0 ? item.confidenceSum / item.disruptionCount : 0;
      const disruptionScore = clamp(Math.round(avgConfidence * 100), 10, 98);
      const payoutActivity = clamp(Math.round((item.approvedCount / Math.max(1, item.disruptionCount)) * 100), 10, 98);
      const trustPulse = clamp(Math.round(disruptionScore * 0.45 + payoutActivity * 0.55), 10, 99);

      return {
        city: item.city,
        disruptionScore,
        payoutActivity,
        trustPulse,
        activeRiders: 80 + item.disruptionCount * 3,
      };
    })
    .sort((a, b) => b.trustPulse - a.trustPulse);
}

function buildFallbackRows() {
  const local = getPredictiveAssessments({ limit: 150 });
  if (local.length > 0) {
    return aggregateRows(local.map((item) => ({
      city: item.city,
      status: item.status,
      probability_adjusted: item.probabilityAdjusted,
      payload: item,
    })));
  }

  return fallbackCities.map((city, index) => ({
    city,
    disruptionScore: 35 + index * 6,
    payoutActivity: 30 + index * 5,
    trustPulse: 40 + index * 5,
    activeRiders: 90 + index * 37,
  }));
}

export async function getCommunityHeatmapRows(options = {}) {
  const { limit = 500 } = options;

  if (!backendEnabled) {
    return buildFallbackRows();
  }

  try {
    const { data, error } = await supabase
      .from("predictive_assessments")
      .select("city, status, probability_adjusted, payload")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data) || data.length === 0) {
      return buildFallbackRows();
    }

    return aggregateRows(data);
  } catch {
    return buildFallbackRows();
  }
}

