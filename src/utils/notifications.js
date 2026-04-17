const notificationHistoryStorageKey = "gigshieldNotificationHistory";
const subscribers = new Set();

function parseHistory(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(
    notificationHistoryStorageKey,
    JSON.stringify(items.slice(0, 50)),
  );
}

export function subscribeNotifications(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function pushNotification(notification) {
  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: notification?.type || "info",
    category: notification?.category || "alerts",
    title: notification?.title || "Update",
    message: notification?.message || "",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const history = parseHistory(localStorage.getItem(notificationHistoryStorageKey));
  saveHistory([payload, ...history]);
  subscribers.forEach((callback) => callback(payload));

  return payload;
}

export function getNotificationHistory() {
  return parseHistory(localStorage.getItem(notificationHistoryStorageKey));
}

export function markNotificationRead(notificationId) {
  const next = getNotificationHistory().map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );
  saveHistory(next);
  return next;
}

export function markAllNotificationsRead() {
  const next = getNotificationHistory().map((item) => ({ ...item, read: true }));
  saveHistory(next);
  return next;
}

export function clearNotificationHistory() {
  localStorage.removeItem(notificationHistoryStorageKey);
  return [];
}

