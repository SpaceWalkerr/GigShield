export async function fetchTrafficSignal({ city }) {
  // Mockable traffic adapter for hackathon environments.
  const congestion = Math.max(0, Math.min(100, Math.round(45 + Math.random() * 40)));
  return {
    ok: true,
    source: "traffic-mock",
    city,
    congestion,
    timestamp: new Date().toISOString(),
  };
}

export async function fetchPlatformSignal({ platform }) {
  // Simulated platform status adapter. Replace with platform webhook/API later.
  const outageRoll = Math.random();
  const status = outageRoll > 0.92 ? "degraded" : "healthy";
  return {
    ok: true,
    source: "platform-mock",
    platform,
    status,
    score: status === "healthy" ? 0.95 : 0.58,
    timestamp: new Date().toISOString(),
  };
}

export async function getCompositeDisruptionSignals({ city, platforms }) {
  const traffic = await fetchTrafficSignal({ city });
  const platformSignals = await Promise.all(
    (platforms || []).map((platform) => fetchPlatformSignal({ platform })),
  );

  const degradedCount = platformSignals.filter((item) => item.status !== "healthy").length;
  const reliability = Math.max(
    0,
    Math.min(1, 0.55 + (traffic.congestion > 75 ? 0.15 : 0) + degradedCount * 0.08),
  );

  return {
    traffic,
    platformSignals,
    reliability,
    degradedCount,
  };
}
