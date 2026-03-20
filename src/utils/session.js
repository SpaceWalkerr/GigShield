const sessionStorageKey = "gigshieldSession";

export function saveSession(sessionData) {
  localStorage.setItem(sessionStorageKey, JSON.stringify(sessionData));
}

export function getSession() {
  const rawSession = localStorage.getItem(sessionStorageKey);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

export function isSessionActive() {
  const session = getSession();
  return Boolean(session?.isAuthenticated);
}

export function clearSession() {
  localStorage.removeItem(sessionStorageKey);
}
