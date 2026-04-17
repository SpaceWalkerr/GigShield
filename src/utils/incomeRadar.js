const zoneCatalog = {
  "New Delhi": [
    { id: "connaught-place", name: "Connaught Place", corridor: "Central Delhi", weatherBias: 0.66, demandBias: 0.88, payoutBias: 0.54, disruptionTag: "AQI + traffic" },
    { id: "dwarka", name: "Dwarka", corridor: "South-West", weatherBias: 0.52, demandBias: 0.74, payoutBias: 0.43, disruptionTag: "Rain pockets" },
    { id: "rohini", name: "Rohini", corridor: "North-West", weatherBias: 0.47, demandBias: 0.68, payoutBias: 0.35, disruptionTag: "Heat exposure" },
    { id: "noida-sector-18", name: "Noida Sector 18", corridor: "East NCR", weatherBias: 0.72, demandBias: 0.92, payoutBias: 0.58, disruptionTag: "Outage heavy" },
  ],
  Mumbai: [
    { id: "lower-parel", name: "Lower Parel", corridor: "Central", weatherBias: 0.79, demandBias: 0.94, payoutBias: 0.65, disruptionTag: "Waterlogging" },
    { id: "andheri-west", name: "Andheri West", corridor: "West", weatherBias: 0.61, demandBias: 0.86, payoutBias: 0.52, disruptionTag: "Platform saturation" },
    { id: "thane", name: "Thane", corridor: "North-East", weatherBias: 0.55, demandBias: 0.72, payoutBias: 0.41, disruptionTag: "Storm cells" },
    { id: "navi-mumbai", name: "Navi Mumbai", corridor: "Harbour", weatherBias: 0.49, demandBias: 0.7, payoutBias: 0.32, disruptionTag: "Heat pockets" },
  ],
  Bengaluru: [
    { id: "koramangala", name: "Koramangala", corridor: "Core South", weatherBias: 0.44, demandBias: 0.89, payoutBias: 0.36, disruptionTag: "Traffic bottlenecks" },
    { id: "whitefield", name: "Whitefield", corridor: "East", weatherBias: 0.58, demandBias: 0.84, payoutBias: 0.49, disruptionTag: "Storm delay" },
    { id: "indiranagar", name: "Indiranagar", corridor: "Central East", weatherBias: 0.41, demandBias: 0.83, payoutBias: 0.34, disruptionTag: "Late-night surge" },
    { id: "electronic-city", name: "Electronic City", corridor: "South", weatherBias: 0.52, demandBias: 0.69, payoutBias: 0.45, disruptionTag: "Wind exposure" },
  ],
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function getCityZones(city) {
  return zoneCatalog[city] || zoneCatalog["New Delhi"];
}

function getTomorrowOutlook(zones, probability, riskLevel) {
  return zones.slice(0, 3).map((zone, index) => {
    const swing = clamp(zone.disruptionScore + index * 6 - (riskLevel === "Low" ? 8 : 0));
    return {
      id: `${zone.id}-tomorrow`,
      zone: zone.name,
      outlook: swing >= 72 ? "High disruption pressure" : swing >= 56 ? "Watch conditions closely" : "Stable earning outlook",
      earningMove:
        swing >= 72
          ? `Start early, then move away from ${zone.name} before ${zone.protectionWindow}.`
          : swing >= 56
            ? `Stay flexible around ${zone.name} and keep cover active after ${zone.protectionWindow}.`
            : `Use ${zone.name} as a stable base through ${zone.earningWindow}.`,
      riskScore: swing,
    };
  });
}

function buildDemoStory(safestZone, highestRiskZone) {
  return {
    title: "Protection flow",
    setup: `A rider begins the day in ${highestRiskZone.name}, where disruption pressure is rising fast.`,
    move: `Income Radar redirects the rider toward ${safestZone.name} for a stronger earning window.`,
    fallback: `If disruption still expands, GigShield already knows when the protection window opens and can release support automatically.`,
  };
}

export function buildIncomeRadar({
  city = "New Delhi",
  riskLevel = "Medium",
  platformCount = 2,
  predictiveSummary = null,
}) {
  const probability = Number(predictiveSummary?.probabilityAdjustedPct || 62);
  const demandBoost = platformCount * 4;
  const riskPenalty = riskLevel === "High" ? 16 : riskLevel === "Medium" ? 8 : 2;
  const zones = getCityZones(city)
    .map((zone, index) => {
      const incomeSafetyScore = clamp(
        zone.demandBias * 62 + (100 - probability) * 0.28 - zone.weatherBias * 18 - riskPenalty + demandBoost,
      );
      const disruptionScore = clamp(probability * 0.62 + zone.weatherBias * 34 + zone.payoutBias * 18);
      const advice =
        incomeSafetyScore >= 72
          ? "Shift here for stable orders and lower disruption drag."
          : incomeSafetyScore >= 58
            ? "Work short bursts here and keep payout-ready protection active."
            : "Avoid long shifts here unless payout triggers are already building.";

      return {
        ...zone,
        incomeSafetyScore,
        disruptionScore,
        earningWindow: index % 2 === 0 ? "11:30 AM - 2:30 PM" : "6:00 PM - 9:00 PM",
        protectionWindow: index % 2 === 0 ? "2 PM - 5 PM" : "7 PM - 10 PM",
        advice,
      };
    })
    .sort((a, b) => b.incomeSafetyScore - a.incomeSafetyScore);

  const safestZone = zones[0];
  const highestRiskZone = [...zones].sort((a, b) => b.disruptionScore - a.disruptionScore)[0];

  return {
    city,
    headline: `${city} next-shift radar`,
    safestZone,
    highestRiskZone,
    confidenceScore: clamp(72 + platformCount * 3 - (riskLevel === "High" ? 6 : 0)),
    recommendation:
      safestZone.incomeSafetyScore >= 72
        ? `Start in ${safestZone.name}, then leave ${highestRiskZone.name} for payout-protected hours.`
        : `Keep shifts tighter, stay near ${safestZone.name}, and rely on early protection if ${highestRiskZone.name} deteriorates.`,
    bestWindow: safestZone.earningWindow,
    tomorrowOutlook: getTomorrowOutlook(zones, probability, riskLevel),
    demoStory: buildDemoStory(safestZone, highestRiskZone),
    zones,
  };
}

