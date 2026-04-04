import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPredictiveAssessment,
  calculateDisruptionProbability,
  getPredictivePolicySavedAt,
  loadPredictivePolicyConfig,
  savePredictivePolicyConfig,
} from "./predictiveSafetyNet";

const triggerEvents = [
  {
    id: "heavy-rain",
    label: "Heavy Rain",
    payoutByPlan: {
      basic: 280,
      standard: 430,
      pro: 620,
    },
  },
];

describe("predictive safety net", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adjusts probability with risk penalty", () => {
    const lowRisk = calculateDisruptionProbability({
      triggerId: "heavy-rain",
      riskLevel: "Low",
      signals: { weather: 0.9, outage: 0.7, traffic: 0.8, regional: 0.75, historical: 0.72 },
    });

    const highRisk = calculateDisruptionProbability({
      triggerId: "heavy-rain",
      riskLevel: "High",
      signals: { weather: 0.9, outage: 0.7, traffic: 0.8, regional: 0.75, historical: 0.72 },
    });

    expect(highRisk.adjustedProbability).toBeLessThan(lowRisk.adjustedProbability);
  });

  it("creates approved forecast when score crosses threshold", () => {
    const assessment = buildPredictiveAssessment({
      triggerEvents,
      triggerId: "heavy-rain",
      planId: "basic",
      riskLevel: "Low",
      paidTodayAmount: 0,
    });

    expect(["predictive-approved", "predictive-pending"]).toContain(assessment.status);
    expect(assessment.thresholdPct).toBeGreaterThan(0);
    expect(assessment.expectedPayout).toBeGreaterThan(0);
  });

  it("blocks advance when daily cap is exhausted", () => {
    const assessment = buildPredictiveAssessment({
      triggerEvents,
      triggerId: "heavy-rain",
      planId: "basic",
      riskLevel: "Low",
      paidTodayAmount: 300,
    });

    expect(assessment.decisionApproved).toBe(false);
    expect(assessment.advanceAmount).toBe(0);
    expect(assessment.reason).toContain("Daily support limit");
  });

  it("persists policy config in local storage", () => {
    const saved = savePredictivePolicyConfig({
      riskThreshold: { Low: 0.75, Medium: 0.8, High: 0.9 },
      advanceRatioByRisk: { Low: 0.34, Medium: 0.26, High: 0.19 },
    });
    const loaded = loadPredictivePolicyConfig();

    expect(saved.riskThreshold.Medium).toBe(0.8);
    expect(loaded.riskThreshold.Medium).toBe(0.8);
    expect(loaded.advanceRatioByRisk.High).toBe(0.19);
  });

  it("sanitizes out-of-range policy values", () => {
    const loaded = savePredictivePolicyConfig({
      riskThreshold: { Low: 1.4, Medium: 0.2, High: -1 },
      advanceRatioByRisk: { Low: 0.9, Medium: 0.01, High: -0.2 },
      riskPenalty: { Low: 1, Medium: -1, High: 0.3 },
    });

    expect(loaded.riskThreshold.Low).toBe(0.99);
    expect(loaded.riskThreshold.Medium).toBe(0.4);
    expect(loaded.riskThreshold.High).toBe(0.4);
    expect(loaded.advanceRatioByRisk.Low).toBe(0.5);
    expect(loaded.advanceRatioByRisk.Medium).toBe(0.05);
    expect(loaded.advanceRatioByRisk.High).toBe(0.05);
    expect(loaded.riskPenalty.Low).toBe(0.5);
    expect(loaded.riskPenalty.Medium).toBe(0);
  });

  it("returns saved timestamp after policy save", () => {
    expect(getPredictivePolicySavedAt()).toBeNull();

    savePredictivePolicyConfig({
      riskThreshold: { Low: 0.75, Medium: 0.81, High: 0.9 },
      advanceRatioByRisk: { Low: 0.33, Medium: 0.25, High: 0.18 },
    });

    const savedAt = getPredictivePolicySavedAt();
    expect(typeof savedAt).toBe("string");
    expect(savedAt.length).toBeGreaterThan(10);
  });
});
