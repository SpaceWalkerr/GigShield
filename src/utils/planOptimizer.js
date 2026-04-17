import { calculateWeeklyPremium } from "./pricing";

function countTriggerById(history) {
  const counts = {};
  history.forEach((item) => {
    const key = item?.triggerId || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export function getPlanOptimizerRecommendation({
  selectedPlan,
  selectedPlatforms,
  riskLevel,
  payoutHistory,
  plans,
}) {
  const platformCount = selectedPlatforms.length;
  const currentPremium = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount,
    riskLevel,
  }).adjustedPremium;

  const triggerCounts = countTriggerById(payoutHistory);
  const weatherLoad =
    (triggerCounts["heavy-rain"] || 0) +
    (triggerCounts["heatwave"] || 0) +
    (triggerCounts["aqi-spike"] || 0);

  const recentBlocked = payoutHistory.filter((item) => String(item?.status || "").startsWith("blocked")).length;

  let recommendedPlanId = selectedPlan.id;
  if (weatherLoad >= 3 || recentBlocked >= 2) {
    recommendedPlanId = selectedPlan.id === "basic" ? "standard" : selectedPlan.id;
  }
  if (weatherLoad >= 5 || recentBlocked >= 4) {
    recommendedPlanId = "pro";
  }

  const recommendedPlan = plans.find((plan) => plan.id === recommendedPlanId) || selectedPlan;
  const recommendedPremium = calculateWeeklyPremium({
    basePremium: recommendedPlan.weeklyPremium,
    platformCount,
    riskLevel,
  }).adjustedPremium;

  const premiumDelta = currentPremium - recommendedPremium;
  const overpayAmount = premiumDelta > 0 ? premiumDelta : 0;

  let summary = "Your current plan is aligned with recent trigger behavior.";
  if (recommendedPlan.id !== selectedPlan.id && recommendedPlan.weeklyPremium > selectedPlan.weeklyPremium) {
    summary = "Upgrade suggested for weather-heavy zone and frequent disruption windows.";
  } else if (overpayAmount > 0) {
    summary = `You may be overpaying by ${overpayAmount} this week for your current trigger profile.`;
  }

  return {
    recommendedPlan,
    currentPremium,
    recommendedPremium,
    overpayAmount,
    weatherLoad,
    blockedEvents: recentBlocked,
    summary,
    actionLabel:
      recommendedPlan.id === selectedPlan.id
        ? "Keep current plan"
        : `Switch to ${recommendedPlan.name}`,
  };
}

