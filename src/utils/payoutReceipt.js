import { persistWorkerState } from "./persistence";

const payoutReceiptStorageKey = "gigshieldLatestPayoutReceipt";
const payoutHistoryStorageKey = "gigshieldPayoutHistory";
const payableStatuses = new Set(["paid", "capped"]);

export const payoutFailureReasonCodes = {
  TRIGGER_BLOCKED: "TRIGGER_BLOCKED",
  POLICY_EXCLUSION: "POLICY_EXCLUSION",
  POLICY_DOMAIN_MISSING: "POLICY_DOMAIN_MISSING",
  POLICY_DOMAIN_UNSUPPORTED: "POLICY_DOMAIN_UNSUPPORTED",
  AUTH_TOKEN_REQUIRED: "AUTH_TOKEN_REQUIRED",
  CAP_REACHED: "CAP_REACHED",
  COVERAGE_INACTIVE: "COVERAGE_INACTIVE",
  VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
  INVALID_TRIGGER: "INVALID_TRIGGER",
  ZERO_PAYOUT: "ZERO_PAYOUT",
  LIVENESS_FAILED: "LIVENESS_FAILED",
  VELOCITY_LIMIT: "VELOCITY_LIMIT",
  GEO_MISMATCH: "GEO_MISMATCH",
  RETRY_LIMIT_EXCEEDED: "RETRY_LIMIT_EXCEEDED",
};

const statusToReasonCode = {
  "blocked-policy": payoutFailureReasonCodes.POLICY_EXCLUSION,
  "blocked-cap": payoutFailureReasonCodes.CAP_REACHED,
  "blocked-coverage": payoutFailureReasonCodes.COVERAGE_INACTIVE,
  "blocked-verification": payoutFailureReasonCodes.VERIFICATION_REQUIRED,
  "invalid-trigger": payoutFailureReasonCodes.INVALID_TRIGGER,
};

function generatePayoutId() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `GS-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function appendLifecycleEvent(receipt, lifecycleStatus, note) {
  const eventAt = new Date().toISOString();
  const timeline = Array.isArray(receipt.lifecycleTimeline)
    ? receipt.lifecycleTimeline
    : [];

  return {
    ...receipt,
    lifecycleStatus,
    lifecycleUpdatedAt: eventAt,
    lifecycleTimeline: [
      ...timeline,
      {
        status: lifecycleStatus,
        at: eventAt,
        note,
      },
    ],
  };
}

function parseHistory(raw) {
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

function upsertHistoryRecord(receipt) {
  const history = parseHistory(localStorage.getItem(payoutHistoryStorageKey));
  const index = history.findIndex((item) => item?.payoutId && item.payoutId === receipt.payoutId);

  if (index === -1) {
    history.unshift(receipt);
  } else {
    history[index] = receipt;
  }

  history.sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  localStorage.setItem(payoutHistoryStorageKey, JSON.stringify(history.slice(0, 300)));
}

function sanitizeVerificationEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") {
    return evidence;
  }

  const next = { ...evidence };
  if (typeof next.selfieDataUrl === "string" && next.selfieDataUrl.length > 0) {
    // Avoid storing large base64 payloads in localStorage; keep metadata only.
    next.selfieDataUrl = "";
    next.selfieStored = false;
  }

  return next;
}

function sanitizeReceiptForStorage(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return receipt;
  }

  const timeline = Array.isArray(receipt.lifecycleTimeline)
    ? receipt.lifecycleTimeline.slice(-25)
    : receipt.lifecycleTimeline;

  return {
    ...receipt,
    lifecycleTimeline: timeline,
    receivedWithVerification: sanitizeVerificationEvidence(receipt.receivedWithVerification),
  };
}

export function createPayoutReceipt(baseReceipt) {
  if (!baseReceipt || typeof baseReceipt !== "object") {
    return null;
  }

  const createdAt = baseReceipt.createdAt || new Date().toISOString();
  const payable = payableStatuses.has(baseReceipt.status) && (baseReceipt.payoutAmount ?? 0) > 0;
  const initialLifecycleStatus = payable ? "pending-verification" : "failed";
  const reasonCode = payable
    ? ""
    : statusToReasonCode[baseReceipt.status] || payoutFailureReasonCodes.TRIGGER_BLOCKED;
  const initialNote = payable
    ? "Awaiting selfie verification"
    : "Payout could not proceed due to trigger or coverage rules";

  return appendLifecycleEvent(
    {
      ...baseReceipt,
      payoutId: baseReceipt.payoutId || generatePayoutId(),
      createdAt,
      failureReason: baseReceipt.failureReason || "",
      failureReasonCode: baseReceipt.failureReasonCode || reasonCode,
      retryCount: Number(baseReceipt.retryCount || 0),
    },
    initialLifecycleStatus,
    initialNote,
  );
}

export function transitionPayoutLifecycle(receipt, nextStatus, note, extra = {}) {
  if (!receipt || typeof receipt !== "object") {
    return receipt;
  }

  return appendLifecycleEvent(
    {
      ...receipt,
      ...extra,
    },
    nextStatus,
    note,
  );
}

export function savePayoutReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return;
  }
  const sanitized = sanitizeReceiptForStorage(receipt);
  persistWorkerState(payoutReceiptStorageKey, sanitized, () => {
    localStorage.setItem(payoutReceiptStorageKey, JSON.stringify(sanitized));
  });
  upsertHistoryRecord(sanitized);
}

export function getPayoutReceipt() {
  const raw = localStorage.getItem(payoutReceiptStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPayoutReceipt() {
  localStorage.removeItem(payoutReceiptStorageKey);
}

export function getPayoutHistory() {
  return parseHistory(localStorage.getItem(payoutHistoryStorageKey));
}

export function getPayoutById(payoutId) {
  if (!payoutId) {
    return null;
  }

  const history = getPayoutHistory();
  return history.find((item) => item?.payoutId === payoutId) || null;
}

export function getFailureReasonLabel(code) {
  const labels = {
    [payoutFailureReasonCodes.TRIGGER_BLOCKED]: "Trigger not eligible for payout",
    [payoutFailureReasonCodes.POLICY_EXCLUSION]: "Policy excludes this disruption type",
    [payoutFailureReasonCodes.POLICY_DOMAIN_MISSING]: "Trigger domain metadata is missing",
    [payoutFailureReasonCodes.POLICY_DOMAIN_UNSUPPORTED]: "Trigger domain is unsupported by policy",
    [payoutFailureReasonCodes.AUTH_TOKEN_REQUIRED]: "Authenticated token is required for payout requests",
    [payoutFailureReasonCodes.CAP_REACHED]: "Daily payout cap reached",
    [payoutFailureReasonCodes.COVERAGE_INACTIVE]: "Coverage window is not active",
    [payoutFailureReasonCodes.VERIFICATION_REQUIRED]: "Verification is required",
    [payoutFailureReasonCodes.INVALID_TRIGGER]: "Trigger is invalid",
    [payoutFailureReasonCodes.ZERO_PAYOUT]: "Payout amount is zero",
    [payoutFailureReasonCodes.LIVENESS_FAILED]: "Liveness checks did not pass",
    [payoutFailureReasonCodes.VELOCITY_LIMIT]: "Too many payout attempts in a short window",
    [payoutFailureReasonCodes.GEO_MISMATCH]: "Claim location is outside expected operating zone",
    [payoutFailureReasonCodes.RETRY_LIMIT_EXCEEDED]: "Retry limit exceeded",
  };

  return labels[code] || "Unknown payout failure reason";
}

export function downloadReceiptJson(receipt) {
  if (!receipt) {
    return;
  }

  const fileName = `gigshield-receipt-${receipt.payoutId || "latest"}.json`;
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadReceiptPdf(receipt) {
  if (!receipt) {
    return;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const lines = [
    "GigShield Payout Receipt",
    "",
    `Payout ID: ${receipt.payoutId || "N/A"}`,
    `Lifecycle Status: ${receipt.lifecycleStatus || "N/A"}`,
    `Amount: ${receipt.payoutAmount ?? 0}`,
    `Trigger: ${receipt.triggerLabel || receipt.triggerId || "N/A"}`,
    `Plan: ${receipt.planName || receipt.planId || "N/A"}`,
    `Created At: ${receipt.createdAt || "N/A"}`,
    `Updated At: ${receipt.lifecycleUpdatedAt || "N/A"}`,
    `Received At: ${receipt.receivedAt || "N/A"}`,
    "",
    `Reason: ${receipt.reason || "N/A"}`,
    receipt.failureReason ? `Failure Reason: ${receipt.failureReason}` : "",
  ].filter(Boolean);

  let y = 20;
  lines.forEach((line) => {
    doc.text(String(line), 16, y);
    y += 8;
  });

  doc.save(`gigshield-receipt-${receipt.payoutId || "latest"}.pdf`);
}
