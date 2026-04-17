import { getPayoutHistory } from "./payoutReceipt";
import { getPredictiveAssessments } from "./predictiveSafetyNet";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getReliabilityTier(score) {
  if (score >= 80) {
    return "Gold";
  }
  if (score >= 60) {
    return "Silver";
  }
  return "Bronze";
}

export function getTierBenefits(tier) {
  if (tier === "Gold") {
    return {
      approvalSpeed: "Fast lane",
      advanceBoostPct: 12,
      weeklyPerks: "Priority verification",
    };
  }

  if (tier === "Silver") {
    return {
      approvalSpeed: "Standard+",
      advanceBoostPct: 6,
      weeklyPerks: "Lower friction checks",
    };
  }

  return {
    approvalSpeed: "Standard",
    advanceBoostPct: 0,
    weeklyPerks: "Base eligibility",
  };
}

export function computeReputationProfile(options = {}) {
  const payoutHistory = options.payoutHistory || getPayoutHistory();
  const predictiveHistory = options.predictiveHistory || getPredictiveAssessments({ limit: 100 });

  const totalPayouts = payoutHistory.length;
  const settledCount = payoutHistory.filter((item) => item?.lifecycleStatus === "settled").length;
  const failedCount = payoutHistory.filter((item) => item?.lifecycleStatus === "failed").length;
  const blockedPredictive = predictiveHistory.filter((item) => item?.status === "predictive-pending").length;
  const approvedPredictive = predictiveHistory.filter((item) => item?.status === "predictive-approved").length;

  const settlementRate = totalPayouts > 0 ? settledCount / totalPayouts : 0.7;
  const failureRate = totalPayouts > 0 ? failedCount / totalPayouts : 0.1;
  const predictiveSuccessRate =
    approvedPredictive + blockedPredictive > 0
      ? approvedPredictive / (approvedPredictive + blockedPredictive)
      : 0.65;

  const score = clamp(
    Math.round(45 + settlementRate * 35 + predictiveSuccessRate * 20 - failureRate * 25),
    35,
    98,
  );

  const tier = getReliabilityTier(score);
  const benefits = getTierBenefits(tier);

  return {
    score,
    tier,
    settlementRatePct: Math.round(settlementRate * 100),
    predictiveSuccessRatePct: Math.round(predictiveSuccessRate * 100),
    benefits,
    reviewNote:
      tier === "Gold"
        ? "Excellent consistency. Keep response quality high to preserve fast approvals."
        : tier === "Silver"
          ? "Strong reliability. Improve verification success to move into Gold tier."
          : "Build consistency this week to unlock faster approvals and higher predictive advances.",
  };
}

