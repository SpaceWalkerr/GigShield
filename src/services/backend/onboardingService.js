import planDetails from "../../data/planDetails.json";
import { getPersonaRiskProfile } from "../../utils/onboardingProfile";
import { calculateWeeklyPremium } from "../../utils/pricing";
import { getSession, saveSession } from "../../utils/session";
import { supabase } from "../../utils/supabase";

const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true";

function buildWorkerId(authUserId, fallbackRiderId) {
  if (fallbackRiderId) {
    return fallbackRiderId;
  }

  return `GS-${String(authUserId || "worker").slice(0, 8).toUpperCase()}`;
}

function resolvePlatforms(platformValue) {
  if (platformValue === "both") {
    return ["zomato", "swiggy"];
  }

  if (platformValue) {
    return [platformValue];
  }

  return [];
}

function normalizeCoverageTriggers(triggers) {
  return Array.isArray(triggers) ? triggers : [];
}

function parseCoverageHours(value) {
  if (!value) {
    return null;
  }

  if (value.toLowerCase().includes("24 x 7")) {
    return 168;
  }

  const match = value.match(/^(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}$/);
  if (!match) {
    return null;
  }

  const startHour = Number(match[1]);
  const endHour = Number(match[2]);

  if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
    return null;
  }

  return endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;
}

export async function syncOnboardingToBackend(formData) {
  if (!backendEnabled) {
    return { ok: true, backend: false, reason: "Backend persistence disabled" };
  }

  try {
    const {
      data: { session: authSession },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      return { ok: false, backend: false, error: authError.message };
    }

    const authUser = authSession?.user;
    if (!authUser) {
      return { ok: false, backend: false, error: "Authenticated session required" };
    }

    const selectedPlan =
      planDetails.find((plan) => plan.id === formData.selectedPlanId) ?? planDetails[0];
    const riskProfile = getPersonaRiskProfile(formData);
    const platformCount = formData.platform === "both" ? 2 : 1;
    const premium = calculateWeeklyPremium({
      basePremium: selectedPlan.weeklyPremium,
      platformCount,
      riskLevel: riskProfile.riskLevel,
    });

    const workerId = buildWorkerId(authUser.id, formData.riderId);
    const coverageTriggers = normalizeCoverageTriggers(formData.coverageTriggers);
    const platforms = resolvePlatforms(formData.platform);

    const profileRow = {
      id: authUser.id,
      full_name: formData.fullName || authUser.user_metadata?.full_name || "",
      phone: formData.phone || authUser.phone || authUser.user_metadata?.phone || "",
      role: "worker",
      is_demo_account: false,
      updated_at: new Date().toISOString(),
    };

    const workerProfileRow = {
      profile_id: authUser.id,
      worker_id: workerId,
      city: formData.city || "New Delhi",
      age: formData.age ? Number(formData.age) : null,
      vehicle_type: formData.vehicleType || null,
      work_pattern: formData.workPattern || null,
      weekly_earnings_band: formData.weeklyEarningsBand || null,
      preferred_language: "en",
      onboarding_status: "active",
      rider_id: formData.riderId || workerId,
      preferred_zones: [],
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from("profiles").upsert(profileRow, {
      onConflict: "id",
    });
    if (profileError) {
      throw profileError;
    }

    const { error: workerProfileError } = await supabase
      .from("worker_profiles")
      .upsert(workerProfileRow, { onConflict: "profile_id" });
    if (workerProfileError) {
      throw workerProfileError;
    }

    if (platforms.length > 0) {
      const platformRows = platforms.map((platformName, index) => ({
        worker_profile_id: authUser.id,
        platform_name: platformName,
        platform_worker_ref: `${workerId}-${platformName}`,
        is_primary: index === 0,
        verification_status: "verified",
        metadata: {
          source: "onboarding",
        },
        updated_at: new Date().toISOString(),
      }));

      const { error: platformError } = await supabase
        .from("worker_platform_accounts")
        .upsert(platformRows, {
          onConflict: "worker_profile_id,platform_name",
        });

      if (platformError) {
        throw platformError;
      }
    }

    const policyRow = {
      worker_profile_id: authUser.id,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      status: "active",
      coverage_hours: parseCoverageHours(selectedPlan.coverageHours),
      weekly_premium: premium.adjustedPremium,
      weekly_payout_cap: Number(selectedPlan.weeklyPayoutCap || selectedPlan.payoutCap || 0),
      coverage_triggers: coverageTriggers,
      starts_on: new Date().toISOString().slice(0, 10),
      activated_at: new Date().toISOString(),
    };

    const { data: policyData, error: policyError } = await supabase
      .from("weekly_policies")
      .insert(policyRow)
      .select("id, plan_id, plan_name, weekly_premium, status")
      .single();

    if (policyError) {
      throw policyError;
    }

    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - dayOfWeek);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const pricingRow = {
      policy_id: policyData.id,
      pricing_week_start: start.toISOString().slice(0, 10),
      pricing_week_end: end.toISOString().slice(0, 10),
      base_premium: premium.basePremium,
      risk_adjustment: premium.adjustedPremium - premium.subtotal,
      ai_discount: 0,
      final_premium: premium.adjustedPremium,
      pricing_inputs: {
        riskLevel: riskProfile.riskLevel,
        riskScore: riskProfile.score,
        drivers: riskProfile.drivers,
        platformCount: premium.platformCount,
        extraPlatforms: premium.extraPlatforms,
        platformLoadFee: premium.platformLoadFee,
        coverageTriggers,
      },
    };

    const { error: pricingError } = await supabase
      .from("weekly_policy_pricing")
      .upsert(pricingRow, {
        onConflict: "policy_id,pricing_week_start",
      });

    if (pricingError) {
      throw pricingError;
    }

    const localSession = getSession();
    if (localSession) {
      saveSession({
        ...localSession,
        name: formData.fullName || localSession.name,
        city: formData.city || localSession.city,
        workerId,
        selectedPlanId: selectedPlan.id,
        coverageTriggers,
        weeklyPremium: premium.adjustedPremium,
        workPattern: formData.workPattern || localSession.workPattern,
        weeklyEarningsBand: formData.weeklyEarningsBand || localSession.weeklyEarningsBand,
      });
    }

    return {
      ok: true,
      backend: true,
      workerProfile: workerProfileRow,
      policy: policyData,
      pricing: pricingRow,
    };
  } catch (err) {
    console.error("[OnboardingService] Sync failed:", err.message);
    return { ok: false, backend: false, error: err.message };
  }
}
