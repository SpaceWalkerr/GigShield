import { describe, expect, it } from "vitest";
import {
  buildModerationQueue,
  computeAnomalyAlerts,
  computeTrustMetricsFromRows,
} from "./phase3Analytics";

describe("phase3 analytics", () => {
  it("computes trust metrics from payout and predictive rows", () => {
    const metrics = computeTrustMetricsFromRows({
      payoutRows: [
        { lifecycleStatus: "settled", createdAt: "2026-04-04T10:00:00Z", receivedAt: "2026-04-04T10:20:00Z" },
        { lifecycleStatus: "failed", basePayout: 320 },
      ],
      predictiveRows: [{}, {}, {}],
    });

    expect(metrics.payoutSuccessRatePct).toBe(50);
    expect(metrics.medianSettlementMins).toBeGreaterThan(0);
    expect(metrics.fraudBlockedAmount).toBe(320);
  });

  it("returns anomaly alerts on unusual patterns", () => {
    const now = Date.now();
    const predictiveRows = Array.from({ length: 10 }).map((_, i) => ({
      status: i < 2 ? "predictive-approved" : "predictive-pending",
      createdAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
    }));

    const alerts = computeAnomalyAlerts({
      predictiveRows,
      teamRows: [{ memberCount: 16 }],
    });

    expect(alerts.length).toBeGreaterThan(0);
  });

  it("builds moderation queue for high-risk team clusters", () => {
    const queue = buildModerationQueue({
      predictiveRows: [
        { workerId: "w1", status: "predictive-pending" },
        { workerId: "w1", status: "predictive-pending" },
        { workerId: "w1", status: "predictive-pending" },
        { workerId: "w1", status: "predictive-pending" },
      ],
      teamRows: [{ ownerWorkerId: "w1", inviteCode: "GS-TEST", memberCount: 16 }],
    });

    expect(queue.length).toBe(1);
    expect(queue[0].riskScore).toBeGreaterThan(44);
  });
});

