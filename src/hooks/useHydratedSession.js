import { useEffect, useState } from "react";
import { clearSession, getSession } from "../utils/session";
import { supabase } from "../utils/supabase";
import { hydrateSessionFromSupabase } from "../services/backend/sessionService";

export function useHydratedSession() {
  const [session, setSession] = useState(() => getSession());
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let alive = true;

    const syncSession = async () => {
      const nextSession = await hydrateSessionFromSupabase().catch(() => getSession());
      if (!alive) {
        return;
      }

      setSession(nextSession || getSession());
      setSessionReady(true);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!alive) {
        return;
      }

      if (!authSession?.user) {
        clearSession();
        setSession(null);
        setSessionReady(true);
        return;
      }

      const nextSession = await hydrateSessionFromSupabase().catch(() => getSession());
      if (!alive) {
        return;
      }

      setSession(nextSession || getSession());
      setSessionReady(true);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, sessionReady, setSession };
}

