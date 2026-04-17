export const excludedCoverageTypes = [
  "health",
  "life",
  "accident",
  "vehicle-repair",
];

const allowedTriggerDomains = new Set([
  "environmental",
  "social",
  "platform",
]);

export function validateCoverageDomain(domain) {
  if (!domain) {
    return {
      ok: false,
      reasonCode: "POLICY_DOMAIN_MISSING",
      reason: "Emergency details are incomplete, so support cannot start yet.",
    };
  }

  if (excludedCoverageTypes.includes(domain)) {
    return {
      ok: false,
      reasonCode: "POLICY_EXCLUSION",
      reason: `This type of emergency (${domain}) is not included in your support plan.`,
    };
  }

  if (!allowedTriggerDomains.has(domain)) {
    return {
      ok: false,
      reasonCode: "POLICY_DOMAIN_UNSUPPORTED",
      reason: `This emergency category (${domain}) is not supported right now.`,
    };
  }

  return {
    ok: true,
    reasonCode: "",
    reason: "",
  };
}

