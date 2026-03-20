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
      reason: "Trigger domain is not specified.",
    };
  }

  if (excludedCoverageTypes.includes(domain)) {
    return {
      ok: false,
      reasonCode: "POLICY_EXCLUSION",
      reason: `Coverage is excluded for ${domain} events.`,
    };
  }

  if (!allowedTriggerDomains.has(domain)) {
    return {
      ok: false,
      reasonCode: "POLICY_DOMAIN_UNSUPPORTED",
      reason: `Coverage domain ${domain} is unsupported.`,
    };
  }

  return {
    ok: true,
    reasonCode: "",
    reason: "",
  };
}
