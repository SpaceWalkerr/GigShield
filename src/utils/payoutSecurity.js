import { payoutFailureReasonCodes } from "./payoutReceipt";

const payoutAttemptLogStorageKey = "gigshieldPayoutAttemptLog";
const fingerprintStorageKey = "gigshieldDeviceFingerprint";

const cityCoordinates = {
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Delhi: { lat: 28.6139, lon: 77.209 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Pune: { lat: 18.5204, lon: 73.8567 },
};

function readAttemptLog() {
  const raw = localStorage.getItem(payoutAttemptLogStorageKey);
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

function saveAttemptLog(log) {
  localStorage.setItem(payoutAttemptLogStorageKey, JSON.stringify(log));
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

export function getOrCreateDeviceFingerprint() {
  const existing = localStorage.getItem(fingerprintStorageKey);
  if (existing) {
    return existing;
  }

  const source = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    String(new Date().getTimezoneOffset()),
    String(window.screen?.width || ""),
    String(window.screen?.height || ""),
  ].join("|");

  const fingerprint = `FP-${hashString(source)}`;
  localStorage.setItem(fingerprintStorageKey, fingerprint);
  return fingerprint;
}

function trackAttemptAndCheckVelocity(fingerprint, nowIso) {
  const nowMs = new Date(nowIso).getTime();
  const windowMs = 10 * 60 * 1000;
  const maxAttemptsInWindow = 3;

  const log = readAttemptLog();
  const previous = Array.isArray(log[fingerprint]) ? log[fingerprint] : [];
  const recent = previous.filter((value) => nowMs - new Date(value).getTime() <= windowMs);
  recent.push(nowIso);
  log[fingerprint] = recent;
  saveAttemptLog(log);

  if (recent.length > maxAttemptsInWindow) {
    return {
      ok: false,
      reasonCode: payoutFailureReasonCodes.VELOCITY_LIMIT,
      reason: "Too many payout attempts in the last 10 minutes",
      attemptsInWindow: recent.length,
      windowMinutes: 10,
    };
  }

  return {
    ok: true,
    attemptsInWindow: recent.length,
    windowMinutes: 10,
  };
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);

  const aTerm =
    sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
  const c = 2 * Math.atan2(Math.sqrt(aTerm), Math.sqrt(1 - aTerm));
  return earthRadiusKm * c;
}

function checkGeoConsistency({ claimLocation, workerCity }) {
  if (!claimLocation || typeof claimLocation.lat !== "number" || typeof claimLocation.lon !== "number") {
    return {
      ok: false,
      reasonCode: payoutFailureReasonCodes.GEO_MISMATCH,
      reason: "Missing claim location for geo-consistency check",
      distanceKm: null,
      city: workerCity || "",
    };
  }

  const expectedCenter = cityCoordinates[workerCity] || cityCoordinates.Bengaluru;
  const distanceKm = haversineKm(
    { lat: claimLocation.lat, lon: claimLocation.lon },
    expectedCenter,
  );

  const maxDistanceKm = 80;
  if (distanceKm > maxDistanceKm) {
    return {
      ok: false,
      reasonCode: payoutFailureReasonCodes.GEO_MISMATCH,
      reason: `Claim location is ${distanceKm.toFixed(1)} km away from expected city zone`,
      distanceKm,
      city: workerCity || "Unknown",
    };
  }

  return {
    ok: true,
    distanceKm,
    city: workerCity || "",
  };
}

export function runPayoutSecurityChecks({ evidence, workerCity, strictVerification = true }) {
  const nowIso = new Date().toISOString();
  const fingerprint = getOrCreateDeviceFingerprint();

  const velocityResult = trackAttemptAndCheckVelocity(fingerprint, nowIso);
  if (!velocityResult.ok) {
    return {
      ok: false,
      fingerprint,
      checkedAt: nowIso,
      ...velocityResult,
    };
  }

  const geoResult = strictVerification
    ? checkGeoConsistency({
        claimLocation: evidence?.location,
        workerCity,
      })
    : { ok: true, distanceKm: null, city: workerCity || "" };
  if (!geoResult.ok) {
    return {
      ok: false,
      fingerprint,
      checkedAt: nowIso,
      ...geoResult,
    };
  }

  return {
    ok: true,
    fingerprint,
    checkedAt: nowIso,
    velocity: velocityResult,
    geo: geoResult,
  };
}

