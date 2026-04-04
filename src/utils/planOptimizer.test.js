import { describe, expect, it } from "vitest";
import { getPlanOptimizerRecommendation } from "./planOptimizer";

const plans = [
  { id: "basic", name: "Basic", weeklyPremium: 99 },
  { id: "standard", name: "Standard", weeklyPremium: 129 },
  { id: "pro", name: "Pro", weeklyPremium: 179 },
];

describe("plan optimizer", () => {
  it("returns recommendation payload with current plan context", () => {
    const recommendation = getPlanOptimizerRecommendation({
      selectedPlan: plans[1],
      selectedPlatforms: ["Swiggy", "Zomato"],
      riskLevel: "Medium",
      payoutHistory: [],
      plans,
    });

    expect(recommendation.recommendedPlan).toBeDefined();
    expect(recommendation.currentPremium).toBeGreaterThan(0);
    expect(typeof recommendation.summary).toBe("string");
  });

  it("pushes toward stronger plan when weather disruptions are high", () => {
    const recommendation = getPlanOptimizerRecommendation({
      selectedPlan: plans[0],
      selectedPlatforms: ["Swiggy", "Zomato", "Blinkit"],
      riskLevel: "Low",
      payoutHistory: [
        { triggerId: "heavy-rain" },
        { triggerId: "heavy-rain" },
        { triggerId: "heatwave" },
        { triggerId: "aqi-spike" },
        { triggerId: "heavy-rain" },
      ],
      plans,
    });

    expect(["standard", "pro"]).toContain(recommendation.recommendedPlan.id);
  });
});
