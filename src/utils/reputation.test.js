import { describe, expect, it } from "vitest";
import { computeReputationProfile, getReliabilityTier } from "./reputation";

describe("reputation utils", () => {
  it("maps scores to expected tiers", () => {
    expect(getReliabilityTier(85)).toBe("Gold");
    expect(getReliabilityTier(65)).toBe("Silver");
    expect(getReliabilityTier(50)).toBe("Bronze");
  });

  it("builds a stable profile from history", () => {
    const profile = computeReputationProfile({
      payoutHistory: [
        { lifecycleStatus: "settled" },
        { lifecycleStatus: "settled" },
        { lifecycleStatus: "failed" },
      ],
      predictiveHistory: [
        { status: "predictive-approved" },
        { status: "predictive-pending" },
      ],
    });

    expect(profile.score).toBeGreaterThan(0);
    expect(["Gold", "Silver", "Bronze"]).toContain(profile.tier);
    expect(profile.settlementRatePct).toBeGreaterThan(0);
  });
});

