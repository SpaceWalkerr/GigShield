import { describe, expect, it } from "vitest";
import { getDailyPayoutCap, getPayoutForTrigger } from "./payout";

const triggerEvents = [
  {
    id: "heavy-rain",
    label: "Heavy Rain",
    domain: "environmental",
    payoutByPlan: {
      basic: 200,
      standard: 300,
      pro: 500,
    },
  },
];

describe("payout utils", () => {
  it("returns expected daily caps", () => {
    expect(getDailyPayoutCap("basic")).toBe(300);
    expect(getDailyPayoutCap("standard")).toBe(650);
    expect(getDailyPayoutCap("pro")).toBe(1000);
  });

  it("caps payout by remaining daily cap", () => {
    const result = getPayoutForTrigger(triggerEvents, "heavy-rain", "basic", {
      coverageHours: "24 x 7",
      paidTodayAmount: 250,
      atTime: new Date(),
    });

    expect(result.status).toBe("capped");
    expect(result.payoutAmount).toBe(50);
  });
});

