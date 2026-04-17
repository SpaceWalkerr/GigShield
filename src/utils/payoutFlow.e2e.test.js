import { beforeEach, describe, expect, it } from "vitest";
import triggerEvents from "../data/triggerEvents.json";
import { getPayoutForTrigger } from "./payout";
import {
  createPayoutReceipt,
  getFailureReasonLabel,
  getPayoutHistory,
  payoutFailureReasonCodes,
  savePayoutReceipt,
  transitionPayoutLifecycle,
} from "./payoutReceipt";
import { runPayoutSecurityChecks } from "./payoutSecurity";

describe("payout flow e2e", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("enforces policy exclusions for non-allowed domains", () => {
    const fakeTriggers = [
      {
        id: "accident-claim",
        label: "Accident Claim",
        domain: "accident",
        payoutByPlan: { basic: 200 },
      },
    ];

    const result = getPayoutForTrigger(fakeTriggers, "accident-claim", "basic", {
      coverageHours: "24 x 7",
      paidTodayAmount: 0,
      atTime: new Date(),
    });

    expect(result.status).toBe("blocked-policy");
    expect(result.reasonCode).toBe("POLICY_EXCLUSION");
  });

  it("runs full trigger -> verification -> settlement path", () => {
    const result = getPayoutForTrigger(triggerEvents, "heavy-rain", "standard", {
      coverageHours: "24 x 7",
      paidTodayAmount: 0,
      atTime: new Date(),
    });

    const receipt = createPayoutReceipt({
      createdAt: new Date().toISOString(),
      status: result.status,
      reason: result.reason,
      triggerId: "heavy-rain",
      triggerLabel: "Heavy Rain",
      planId: "standard",
      planName: "Standard Shield",
      payoutAmount: result.payoutAmount,
      basePayout: result.basePayout,
      dailyCap: result.dailyCap,
      remainingCap: result.remainingCap,
      coverageHours: "24 x 7",
      riskLevel: "High",
    });

    expect(receipt.lifecycleStatus).toBe("pending-verification");

    const verified = transitionPayoutLifecycle(receipt, "verified", "Verification passed", {
      receivedWithVerification: {
        liveness: { passed: true },
        location: { lat: 12.97, lon: 77.59 },
      },
    });

    const security = runPayoutSecurityChecks({
      strictVerification: true,
      workerCity: "Bengaluru",
      evidence: verified.receivedWithVerification,
    });

    expect(security.ok).toBe(true);

    const settled = transitionPayoutLifecycle(verified, "settled", "Settled", {
      receivedAt: new Date().toISOString(),
    });

    savePayoutReceipt(settled);
    const history = getPayoutHistory();
    expect(history.length).toBe(1);
    expect(history[0].lifecycleStatus).toBe("settled");
  });

  it("exposes clear reason labels for failure codes", () => {
    expect(getFailureReasonLabel(payoutFailureReasonCodes.POLICY_EXCLUSION)).toContain("Policy excludes");
  });
});

