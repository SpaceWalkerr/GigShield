const triggerCacheStorageKey = "gigshieldTriggerCache";
const triggerAuditStorageKey = "gigshieldTriggerAudit";

function readStorageObject(key) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fetchWeatherReliability({ lat, lon }) {
  const sources = [];

  const openMeteo = await fetchOpenMeteo(lat, lon);
  sources.push(openMeteo);

  if (!openMeteo.ok) {
    const backup = await fetchWttr(lat, lon);
    sources.push(backup);
  }

  const successful = sources.find((item) => item.ok) || null;
  const successCount = sources.filter((item) => item.ok).length;

  return {
    primary: successful,
    sources,
    confidence: Math.min(1, 0.5 + successCount * 0.25),
  };
}

async function fetchOpenMeteo(lat, lon) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,wind_speed_10m");

    const response = await fetch(url.toString());
    if (!response.ok) {
      return { ok: false, source: "open-meteo", error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      ok: true,
      source: "open-meteo",
      tempC: data?.current?.temperature_2m ?? null,
      windKmph: data?.current?.wind_speed_10m ?? null,
    };
  } catch {
    return { ok: false, source: "open-meteo", error: "Fetch failed" };
  }
}

async function fetchWttr(lat, lon) {
  try {
    const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
    if (!response.ok) {
      return { ok: false, source: "wttr", error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const current = Array.isArray(data?.current_condition) ? data.current_condition[0] : null;
    return {
      ok: true,
      source: "wttr",
      tempC: current?.temp_C != null ? Number(current.temp_C) : null,
      windKmph: current?.windspeedKmph != null ? Number(current.windspeedKmph) : null,
    };
  } catch {
    return { ok: false, source: "wttr", error: "Fetch failed" };
  }
}

export function evaluateTriggerRules({ triggerId, now = new Date() }) {
  const cache = readStorageObject(triggerCacheStorageKey);
  const entry = cache[triggerId] || { lastSeenAt: "", count: 0 };
  const nowMs = now.getTime();

  const cooldownMs = 2 * 60 * 1000;
  const dedupMs = 5 * 60 * 1000;

  const lastSeenMs = entry.lastSeenAt ? new Date(entry.lastSeenAt).getTime() : 0;
  const sinceLastMs = nowMs - lastSeenMs;

  const cooldownBlocked = lastSeenMs > 0 && sinceLastMs < cooldownMs;
  const dedupBlocked = lastSeenMs > 0 && sinceLastMs < dedupMs && entry.count >= 2;

  cache[triggerId] = {
    lastSeenAt: now.toISOString(),
    count: dedupBlocked ? entry.count : entry.count + 1,
  };
  writeStorageObject(triggerCacheStorageKey, cache);

  return {
    cooldownBlocked,
    dedupBlocked,
    cooldownRemainingSec: Math.max(0, Math.ceil((cooldownMs - sinceLastMs) / 1000)),
    dedupRemainingSec: Math.max(0, Math.ceil((dedupMs - sinceLastMs) / 1000)),
  };
}

export function getTriggerConfidenceScore({ triggerId, weatherReliability, personaRiskLevel }) {
  const triggerBase = {
    "heavy-rain": 0.88,
    heatwave: 0.84,
    "aqi-spike": 0.78,
    "platform-outage": 0.9,
    "curfew-lockdown": 0.82,
    "local-strike": 0.8,
    "zone-closure": 0.83,
  };

  const riskPenalty = personaRiskLevel === "High" ? 0.12 : personaRiskLevel === "Medium" ? 0.05 : 0;
  const weatherBoost = weatherReliability?.confidence ?? 0.5;
  const score = Math.max(0.05, Math.min(0.99, (triggerBase[triggerId] || 0.75) + weatherBoost * 0.1 - riskPenalty));

  return {
    score,
    label: score >= 0.85 ? "High" : score >= 0.65 ? "Medium" : "Low",
  };
}

export function appendTriggerAuditEvent(event) {
  const raw = localStorage.getItem(triggerAuditStorageKey);
  let existing = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {
      existing = [];
    }
  }

  existing.unshift(event);
  localStorage.setItem(triggerAuditStorageKey, JSON.stringify(existing.slice(0, 100)));
}

export function getTriggerAuditEvents() {
  const raw = localStorage.getItem(triggerAuditStorageKey);
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
