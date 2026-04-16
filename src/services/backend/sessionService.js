import planDetails from "../../data/planDetails.json";
import { calculateWeeklyPremium } from "../../utils/pricing";
import { clearSession, getSession, saveSession } from "../../utils/session";
import { supabase } from "../../utils/supabase";

function buildFallbackWorkerId(authUserId) {
  return `GS-${String(authUserId || "worker").slice(0, 8).toUpperCase()}`;
}

export async function hydrateSessionFromSupabase() {
  const {
    data: { session: authSession },
    error,
  } = await supabase.auth.getSession();

  if (error || !authSession?.user) {
    return null;
  }

  const authUser = authSession.user;

  const [{ data: profile }, { data: workerProfile }, { data: policy }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, role").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("worker_profiles")
      .select("worker_id, city, work_pattern, weekly_earnings_band")
      .eq("profile_id", authUser.id)
      .maybeSingle(),
    supabase
      .from("weekly_policies")
      .select("plan_id, weekly_premium, status")
      .eq("worker_profile_id", authUser.id)
      .order("activated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const selectedPlanId = policy?.plan_id || getSession()?.selectedPlanId || planDetails[0].id;
  const selectedPlan = planDetails.find((plan) => plan.id === selectedPlanId) ?? planDetails[0];
  const resolvedWeeklyPremium =
    policy?.weekly_premium ||
    calculateWeeklyPremium({
      basePremium: selectedPlan.weeklyPremium,
      platformCount: 2,
      riskLevel: "Medium",
    }).adjustedPremium;

  const sessionPayload = {
    isAuthenticated: true,
    mode: "email",
    role: profile?.role || "worker",
    authToken: authSession.access_token || "",
    name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "Rider",
    email: authUser.email || "",
    phone: profile?.phone || authUser.phone || "",
    city: workerProfile?.city || "New Delhi",
    workerId: workerProfile?.worker_id || buildFallbackWorkerId(authUser.id),
    selectedPlanId,
    calculatedWeeklyPremium: resolvedWeeklyPremium,
    signedInAt: new Date().toISOString(),
    workPattern: workerProfile?.work_pattern || "",
    weeklyEarningsBand: workerProfile?.weekly_earnings_band || "",
  };

  saveSession(sessionPayload);
  return sessionPayload;
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  await hydrateSessionFromSupabase();
  return data;
}

export async function signUpWithEmail({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "worker",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data?.session) {
    await hydrateSessionFromSupabase();
  }

  return data;
}

export async function signOutSession() {
  await supabase.auth.signOut();
  clearSession();
}
