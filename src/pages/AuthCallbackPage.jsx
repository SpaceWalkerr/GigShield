import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { hydrateSessionFromSupabase } from "../services/backend/sessionService";
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
    const processCallback = async (session) => {
      if (handled.current || !session) return;
      handled.current = true;

      localStorage.setItem("gigshieldSelectedPlanId", selectedPlanId);

      const hydrated = await hydrateSessionFromSupabase();
      const resolvedRole = adminEmailAllowlist.includes(
        (session.user.email || "").toLowerCase(),
      )
        ? "admin"
        : hydrated?.role || "worker";

      if (hydrated) {
        navigate(
          resolvedRole === "admin"
            ? "/admin-ops"
            : `/dashboard?plan=${selectedPlanId}`,
          { replace: true },
        );
        return;
      }

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
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-white/15 border-t-cyan-300 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-zinc-400">
          Signing you in…
        </p>
      </div>
    </div>
  );
}

