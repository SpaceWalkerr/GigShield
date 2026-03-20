const payoutReceiptStorageKey = "gigshieldLatestPayoutReceipt";

export function savePayoutReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return;
  }
  localStorage.setItem(payoutReceiptStorageKey, JSON.stringify(receipt));
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
