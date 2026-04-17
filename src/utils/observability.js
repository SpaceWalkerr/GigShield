const logStorageKey = "gigshieldObservabilityLogs";

export function trackEvent(name, data = {}) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    data,
    at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(logStorageKey);
    const existing = raw ? JSON.parse(raw) : [];
    const safe = Array.isArray(existing) ? existing : [];
    safe.unshift(entry);
    localStorage.setItem(logStorageKey, JSON.stringify(safe.slice(0, 500)));
  } catch {
    // Ignore local storage failures in telemetry path.
  }
}

export function getTrackedEvents() {
  try {
    const raw = localStorage.getItem(logStorageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

