import { getCompositeDisruptionSignals } from "./integrations";

export function startRealtimeTriggerMonitor({ city, platforms, onSnapshot, intervalMs = 20000 }) {
  let timer = 0;
  let stopped = false;

  const tick = async () => {
    if (stopped) {
      return;
    }

    const snapshot = await getCompositeDisruptionSignals({ city, platforms });
    onSnapshot?.(snapshot);
  };

  tick();
  timer = window.setInterval(tick, intervalMs);

  return () => {
    stopped = true;
    if (timer) {
      window.clearInterval(timer);
    }
  };
}

