import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { saveSession } from "../utils/session";
import { calculateWeeklyPremium } from "../utils/pricing";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";

const validPlanIds = new Set(planDetails.map((p) => p.id));
const adminEmailAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

/**
 * AuthCallbackPage — handles the Google OAuth redirect.
 *
 * Supabase redirects here after the user picks their Google account.
 * The URL will contain a hash fragment with the access token, which
 * the Supabase client exchanges automatically. We listen for the
 * SIGNED_IN event exactly once and then navigate to the dashboard.
 *
 * Having a dedicated callback route (instead of redirecting back to
 * /signin) prevents the double-fire glitch caused by both getSession()
 * and onAuthStateChange triggering simultaneously on the same component.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handled = useRef(false); // guard — process the callback only once

  const requestedPlanId = searchParams.get("plan");
  const selectedPlanId =
    (requestedPlanId && validPlanIds.has(requestedPlanId) && requestedPlanId) ||
    localStorage.getItem("gigshieldSelectedPlanId") ||
    userProfile.selectedPlanId;

  useEffect(() => {
    const processCallback = (session) => {
      if (handled.current || !session) return;
      handled.current = true;

      const userMeta = session.user.user_metadata || {};
      const resolvedRole = adminEmailAllowlist.includes(
        (session.user.email || "").toLowerCase()
      )
        ? "admin"
        : "worker";

      const selectedPlan =
        planDetails.find((p) => p.id === selectedPlanId) ?? planDetails[0];

      const premium = calculateWeeklyPremium({
        basePremium: selectedPlan.weeklyPremium,
        platformCount: 2,
        riskLevel: "Medium",
      });

      saveSession({
        isAuthenticated: true,
        mode: "oauth",
        role: resolvedRole,
        authToken: session.access_token,
        name: userMeta.full_name || userProfile.name,
        email: session.user.email,
        city: userMeta.city || "Bangalore",
        workerId: "RIDER-" + session.user.id.substring(0, 6).toUpperCase(),
        platforms: ["Zomato", "Swiggy"],
        selectedPlanId,
        riskLevel: "Medium",
        calculatedWeeklyPremium: premium.adjustedPremium,
        premiumBreakdown: premium,
        premiumHistory: [],
        signedInAt: new Date().toISOString(),
      });

      navigate(`/dashboard?plan=${selectedPlanId}`, { replace: true });
    };

    // Check if Supabase has already exchanged the token (session already available)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processCallback(session);
      }
    });

    // Also listen for the auth state change in case the token exchange
    // completes asynchronously after mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        processCallback(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, selectedPlanId]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#1a2229] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500 tracking-wide">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
