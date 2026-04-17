import { supabase } from "./supabase";

const backendEnabled = Boolean(import.meta.env.VITE_ENABLE_BACKEND_PERSISTENCE === "true");

export async function persistWorkerState(key, value, fallback) {
  if (!backendEnabled) {
    fallback();
    return { ok: true, backend: false };
  }

  try {
    const payload = {
      state_key: key,
      state_value: value,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("worker_state").upsert(payload, {
      onConflict: "state_key",
    });

    if (error) {
      fallback();
      return { ok: false, backend: false, error: error.message };
    }

    return { ok: true, backend: true };
  } catch {
    fallback();
    return { ok: false, backend: false, error: "Backend persistence unavailable" };
  }
}

