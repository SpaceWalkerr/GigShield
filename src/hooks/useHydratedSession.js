import { useEffect, useState } from "react";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
import { calculateWeeklyPremium } from "../utils/pricing";
import { getSession, saveSession } from "../utils/session";

function buildDirectSession() {
  const selectedPlanId = userProfile.selectedPlanId || planDetails[0].id;
  const selectedPlan = planDetails.find((plan) => plan.id === selectedPlanId) ?? planDetails[0];
  const premiumData = calculateWeeklyPremium({
    basePremium: selectedPlan.weeklyPremium,
    platformCount: 2,
    riskLevel: "Medium",
  });

  return {
    isAuthenticated: true,
    mode: "direct",
    role: "worker",
    authToken: "direct-login-token",
    name: userProfile.name || "Rider",
    email: "demo@gigshield.app",
    phone: "",
    city: userProfile.city || "New Delhi",
    workerId: userProfile.id || "worker-001",
    selectedPlanId,
    calculatedWeeklyPremium: premiumData.adjustedPremium,
    signedInAt: new Date().toISOString(),
    workPattern: "",
    weeklyEarningsBand: "",
    preferredZones: [],
    platforms: Array.isArray(userProfile.platforms) ? userProfile.platforms : [],
  };
}

export function useHydratedSession() {
  const [session, setSession] = useState(() => getSession() || buildDirectSession());

  useEffect(() => {
    if (!getSession()) {
      saveSession(session);
    }
  }, [session]);

  return { session, sessionReady: true, setSession };
}
