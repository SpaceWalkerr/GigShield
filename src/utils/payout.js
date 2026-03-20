import { validateCoverageDomain } from "./policy";

const dailyPayoutCapByPlan = {
  basic: 300,
  standard: 650,
  pro: 1000,
};

function getClockMinutes(clockValue) {
  const [hours, minutes] = clockValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function isWithinCoverageWindow(coverageHours, atTime) {
  const normalizedCoverage = coverageHours.toLowerCase().replaceAll(" ", "");
  if (normalizedCoverage === "24x7") {
    return true;
  }

  const [startRaw, endRaw] = coverageHours.split("-").map((part) => part.trim());
  if (!startRaw || !endRaw) {
    return true;
  }

  const startMinutes = getClockMinutes(startRaw);
  const endMinutes = getClockMinutes(endRaw);
  const currentMinutes = atTime.getHours() * 60 + atTime.getMinutes();

  if (endMinutes >= startMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

export function getDailyPayoutCap(planId) {
  return dailyPayoutCapByPlan[planId] ?? 0;
}

export function getPayoutForTrigger(triggerEvents, triggerId, planId, options = {}) {
  const { coverageHours = "24 x 7", paidTodayAmount = 0, atTime = new Date() } = options;
  const triggerEvent = triggerEvents.find((event) => event.id === triggerId);

  if (!triggerEvent || !triggerEvent.payoutByPlan[planId]) {
    return {
      payoutAmount: 0,
      basePayout: 0,
      dailyCap: getDailyPayoutCap(planId),
      remainingCap: 0,
      status: "invalid-trigger",
      reason: "Trigger is not supported for this plan.",
      isCoveredNow: false,
      coverageHours,
    };
  }

  const policyValidation = validateCoverageDomain(triggerEvent.domain);
  if (!policyValidation.ok) {
    return {
      payoutAmount: 0,
      basePayout: 0,
      dailyCap: getDailyPayoutCap(planId),
      remainingCap: Math.max(0, getDailyPayoutCap(planId) - paidTodayAmount),
      status: "blocked-policy",
      reason: policyValidation.reason,
      reasonCode: policyValidation.reasonCode,
      isCoveredNow: false,
      coverageHours,
    };
  }

  const isCoveredNow = isWithinCoverageWindow(coverageHours, atTime);
  const dailyCap = getDailyPayoutCap(planId);
  const remainingCap = Math.max(0, dailyCap - paidTodayAmount);
  const basePayout = triggerEvent.payoutByPlan[planId];

  if (!isCoveredNow) {
    return {
      payoutAmount: 0,
      basePayout,
      dailyCap,
      remainingCap,
      status: "blocked-coverage",
      reason: `Coverage window closed. Active hours: ${coverageHours}.`,
      isCoveredNow,
      coverageHours,
    };
  }

  if (remainingCap <= 0) {
    return {
      payoutAmount: 0,
      basePayout,
      dailyCap,
      remainingCap,
      status: "blocked-cap",
      reason: "Daily payout cap has been reached.",
      isCoveredNow,
      coverageHours,
    };
  }

  const payoutAmount = Math.min(basePayout, remainingCap);
  const status = payoutAmount < basePayout ? "capped" : "paid";

  return {
    payoutAmount,
    basePayout,
    dailyCap,
    remainingCap,
    status,
    reason:
      status === "capped"
        ? "Payout partially applied due to daily cap."
        : "Payout applied successfully.",
    isCoveredNow,
    coverageHours,
  };
}

export function applyTriggerToEarnings(currentAmount, payoutAmount) {
  return currentAmount + payoutAmount;
}
