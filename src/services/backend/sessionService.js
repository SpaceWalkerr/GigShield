import planDetails from "../../data/planDetails.json";
import { calculateWeeklyPremium } from "../../utils/pricing";
import { clearSession, getSession, saveSession } from "../../utils/session";
import { supabase } from "../../utils/supabase";

function buildFallbackWorkerId(authUserId) {
  return `GS-${String(authUserId || "worker").slice(0, 8).toUpperCase()}`;
}

export async function hydrateSessionFromSupabase() {
  try {
    // Add a race condition to prevent indefinite hanging if Supabase is unreachable
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Supabase timeout")), 5000)
    );

    const {
      data: { session: authSession },
      error,
    } = await Promise.race([supabase.auth.getSession(), timeoutPromise]);

    if (error || !authSession?.user) {
      return null;
    }

    const authUser = authSession.user;

    const safeQuery = async (query) => {
      try {
        return await query;
      } catch (err) {
        console.warn("[Session] Query failed:", err.message);
        return { data: null, error: err };
      }
    };

    const fetchAll = Promise.all([
      safeQuery(supabase.from("profiles").select("full_name, phone, role").eq("id", authUser.id).maybeSingle()),
      safeQuery(
        supabase
          .from("worker_profiles")
          .select("worker_id, city, work_pattern, weekly_earnings_band")
          .eq("profile_id", authUser.id)
          .maybeSingle()
      ),
      safeQuery(
        supabase
          .from("weekly_policies")
          .select("plan_id, weekly_premium, status")
          .eq("worker_profile_id", authUser.id)
          .order("activated_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ),
    ]);

    const results = await Promise.race([
      fetchAll,
      new Promise((res) => setTimeout(() => res([{ data: null }, { data: null }, { data: null }]), 3500))
    ]);

    const [{ data: profile }, { data: workerProfile }, { data: policy }] = results;

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
  } catch (err) {
    console.warn("[Session] Failed to hydrate from Supabase:", err.message);
    return null;
  }
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Return the fully hydrated session payload instead of the raw Supabase data
  const hydrated = await hydrateSessionFromSupabase();
  return hydrated || getSession();
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
    const hydrated = await hydrateSessionFromSupabase();
    return hydrated || getSession();
  }

  return data;
}

export async function signOutSession() {
  await supabase.auth.signOut();
  clearSession();
}
