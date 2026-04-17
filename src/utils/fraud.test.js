import { describe, expect, it } from "vitest";
import { getRiskLevelFromScore, requiresVerification } from "./fraud";

describe("fraud utils", () => {
  it("maps scores to risk levels", () => {
    expect(getRiskLevelFromScore(20)).toBe("Low");
    expect(getRiskLevelFromScore(45)).toBe("Medium");
    expect(getRiskLevelFromScore(80)).toBe("High");
  });

  it("requires verification only for high risk", () => {
    expect(requiresVerification("Low")).toBe(false);
    expect(requiresVerification("Medium")).toBe(false);
    expect(requiresVerification("High")).toBe(true);
  });
});

