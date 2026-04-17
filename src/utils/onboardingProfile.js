const cityRiskWeight = {
  delhi: 18,
  gurugram: 14,
  noida: 13,
  mumbai: 12,
  bengaluru: 10,
  bangalore: 10,
  chennai: 8,
  hyderabad: 9,
  pune: 7,
  kolkata: 11,
  ahmedabad: 8,
};

const workPatternWeight = {
  full_time: 14,
  peak_hours: 10,
  flexible: 7,
  weekends: 6,
};

const earningsBandWeight = {
  under_6000: 6,
  "6000_10000": 9,
  "10000_15000": 12,
  above_15000: 15,
};

const vehicleWeight = {
  Cycle: 5,
  Bike: 9,
  Scooter: 8,
  EV: 7,
};

const triggerWeight = {
  heavy_rain: 8,
  heatwave: 7,
  aqi_spike: 9,
  platform_outage: 6,
};

export function getPersonaRiskProfile(formData = {}) {
  const cityKey = String(formData.city || "").trim().toLowerCase();
  const cityScore = cityRiskWeight[cityKey] ?? 8;
  const platformScore = formData.platform === "both" ? 10 : formData.platform ? 6 : 4;
  const workPatternScore = workPatternWeight[formData.workPattern] ?? 7;
  const earningsScore = earningsBandWeight[formData.weeklyEarningsBand] ?? 8;
  const vehicleScore = vehicleWeight[formData.vehicleType] ?? 6;
  const triggerScore = (formData.coverageTriggers || []).reduce(
    (sum, triggerId) => sum + (triggerWeight[triggerId] ?? 5),
    0,
  );

  const rawScore = cityScore + platformScore + workPatternScore + earningsScore + vehicleScore + triggerScore;
  const score = Math.max(22, Math.min(92, rawScore));

  const riskLevel = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  const recommendedPlanId = riskLevel === "High" ? "pro" : riskLevel === "Medium" ? "standard" : "basic";

  const driver = [];
  if ((formData.coverageTriggers || []).includes("aqi_spike")) driver.push("AQI volatility");
  if ((formData.coverageTriggers || []).includes("heavy_rain")) driver.push("rain exposure");
  if ((formData.coverageTriggers || []).includes("platform_outage")) driver.push("platform dependency");
  if (formData.platform === "both") driver.push("multi-app activity");
  if (["delhi", "gurugram", "noida"].includes(cityKey)) driver.push("high disruption city");
  if (formData.workPattern === "full_time") driver.push("long weekly exposure");

  return {
    score,
    riskLevel,
    recommendedPlanId,
    drivers: driver.slice(0, 3),
  };
}

