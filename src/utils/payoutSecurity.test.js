import { beforeEach, describe, expect, it } from "vitest";
import { runPayoutSecurityChecks } from "./payoutSecurity";

describe("payout security", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("passes fast path checks for low risk mode", () => {
    const result = runPayoutSecurityChecks({
      evidence: null,
      workerCity: "Bengaluru",
      strictVerification: false,
    });

    expect(result.ok).toBe(true);
    expect(result.fingerprint).toBeTruthy();
  });

  it("fails strict checks without claim location evidence", () => {
    const result = runPayoutSecurityChecks({
      evidence: {},
      workerCity: "Bengaluru",
      strictVerification: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("GEO_MISMATCH");
  });
});

