const extraPlatformFee = 12;

const riskMultiplierByLevel = {
  Low: 1,
  Medium: 1.1,
  High: 1.25,
};

export const supportedRiskLevels = Object.keys(riskMultiplierByLevel);

export function getRiskMultiplier(riskLevel) {
  return riskMultiplierByLevel[riskLevel] ?? riskMultiplierByLevel.Medium;
}

export function calculateWeeklyPremium({
  basePremium,
  platformCount,
  riskLevel,
}) {
  const safePlatformCount = Math.max(1, platformCount);
  const extraPlatforms = Math.max(0, safePlatformCount - 1);
  const platformLoadFee = extraPlatforms * extraPlatformFee;
  const subtotal = basePremium + platformLoadFee;
  const riskMultiplier = getRiskMultiplier(riskLevel);
  const adjustedPremium = Math.round(subtotal * riskMultiplier);

  return {
    basePremium,
    platformCount: safePlatformCount,
    extraPlatforms,
    platformLoadFee,
    subtotal,
    riskLevel,
    riskMultiplier,
    adjustedPremium,
  };
}

