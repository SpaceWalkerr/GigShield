export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(isoDateTime) {
  return new Date(isoDateTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

