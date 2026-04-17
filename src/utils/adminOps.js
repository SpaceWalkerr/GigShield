const overrideLogStorageKey = "gigshieldOverrideLogs";

export function getOverrideLogs() {
  const raw = localStorage.getItem(overrideLogStorageKey);
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

export function appendOverrideLog(entry) {
  const current = getOverrideLogs();
  current.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: "admin",
    ...entry,
  });
  localStorage.setItem(overrideLogStorageKey, JSON.stringify(current.slice(0, 300)));
}

