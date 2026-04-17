export function getRiskLevelFromScore(score) {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}

export function getRiskBadgeClasses(riskLevel) {
  if (riskLevel === "High") {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  if (riskLevel === "Medium") {
    return "bg-signal-100 text-coal-900 ring-signal-600";
  }

  return "bg-moss-100 text-moss-600 ring-moss-500";
}

export function requiresVerification(riskLevel) {
  return riskLevel === "High";
}

