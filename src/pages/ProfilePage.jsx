import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";
import { useHydratedSession } from "../hooks/useHydratedSession";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { selectLabel } from "../utils/i18n";
import {
  clearNotificationHistory,
  getNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "../utils/notifications";
import { getCityZones } from "../utils/incomeRadar";
import { computeReputationProfile } from "../utils/reputation";
import { hydratePayoutHistory, getPayoutHistory } from "../utils/payoutReceipt";
import {
  getPredictiveAssessments,
  hydratePredictiveAssessments,
} from "../utils/predictiveSafetyNet";
import { updateWorkerProfilePreferences } from "../services/backend/workerProfileService";

const workPatterns = [
  { id: "full_time", label: "Full-time rider" },
  { id: "peak_hours", label: "Peak-hours rider" },
  { id: "flexible", label: "Flexible rider" },
  { id: "weekends", label: "Weekend-heavy rider" },
];

const weeklyEarningsBands = [
  { id: "under_6000", label: "Under ₹6,000 / week" },
  { id: "6000_10000", label: "₹6,000 - ₹10,000 / week" },
  { id: "10000_15000", label: "₹10,000 - ₹15,000 / week" },
  { id: "above_15000", label: "₹15,000+ / week" },
];

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function normalizeNotificationCategory(item) {
  if (item?.category) return item.category;

  const haystack = `${item?.title || ""} ${item?.message || ""}`.toLowerCase();
  if (haystack.includes("claim")) return "claims";
  if (haystack.includes("payout") || haystack.includes("verification")) return "payouts";
  return "alerts";
}

export default function ProfilePage() {
  const { session, setSession } = useHydratedSession();
  const { languageMode } = useSiteLanguage();
  const [notificationCenterItems, setNotificationCenterItems] = useState(() =>
    getNotificationHistory().slice(0, 20),
  );
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [reputationInputs, setReputationInputs] = useState({
    payoutHistory: getPayoutHistory(),
    predictiveHistory: getPredictiveAssessments({ limit: 100 }),
  });
  const [profileDraft, setProfileDraft] = useState({
    workPattern: session?.workPattern || "peak_hours",
    weeklyEarningsBand: session?.weeklyEarningsBand || "6000_10000",
    preferredZones: Array.isArray(session?.preferredZones) ? session.preferredZones : [],
  });
  const [saveState, setSaveState] = useState({
    loading: false,
    message: "",
    error: "",
  });

  const zoneSuggestions = getCityZones(session?.city || "New Delhi");

  useEffect(() => {
    let alive = true;

    const hydrate = async () => {
      const [payoutHistory, predictiveHistory] = await Promise.all([
        hydratePayoutHistory({ limit: 100 }),
        hydratePredictiveAssessments({ workerId: session?.workerId, limit: 100 }),
      ]);

      if (!alive) return;
      setReputationInputs({
        payoutHistory,
        predictiveHistory,
      });
    };

    hydrate();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications((notification) => {
      setNotificationCenterItems((current) => [notification, ...current].slice(0, 20));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfileDraft({
        workPattern: session?.workPattern || "peak_hours",
        weeklyEarningsBand: session?.weeklyEarningsBand || "6000_10000",
        preferredZones: Array.isArray(session?.preferredZones) ? session.preferredZones : [],
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session]);

  const reputationProfile = useMemo(
    () =>
      computeReputationProfile({
        payoutHistory: reputationInputs.payoutHistory,
        predictiveHistory: reputationInputs.predictiveHistory,
      }),
    [reputationInputs],
  );

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "all") {
      return notificationCenterItems;
    }

    return notificationCenterItems.filter(
      (item) => normalizeNotificationCategory(item) === notificationFilter,
    );
  }, [notificationCenterItems, notificationFilter]);

  const toggleZone = (zone) => {
    setProfileDraft((current) => {
      const exists = current.preferredZones.some((item) => item.id === zone.id);
      if (exists) {
        return {
          ...current,
          preferredZones: current.preferredZones.filter((item) => item.id !== zone.id),
        };
      }

      return {
        ...current,
        preferredZones: [
          ...current.preferredZones,
          { id: zone.id, name: zone.name, corridor: zone.corridor },
        ].slice(0, 2),
      };
    });
  };

  const handleMarkNotificationRead = (notificationId) => {
    setNotificationCenterItems(markNotificationRead(notificationId).slice(0, 20));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotificationCenterItems(markAllNotificationsRead().slice(0, 20));
  };

  const handleClearNotifications = () => {
    setNotificationCenterItems(clearNotificationHistory());
  };

  const handleSaveProfile = async () => {
    setSaveState({
      loading: true,
      message: "",
      error: "",
    });

    const result = await updateWorkerProfilePreferences({
      city: session?.city,
      workPattern: profileDraft.workPattern,
      weeklyEarningsBand: profileDraft.weeklyEarningsBand,
      preferredZones: profileDraft.preferredZones,
    });

    if (!result?.ok) {
      setSaveState({
        loading: false,
        message: "",
        error: result?.error || "Profile update failed",
      });
      return;
    }

    setSession((current) => ({
      ...current,
      city: result.profile?.city || current?.city,
      workPattern: result.profile?.work_pattern || profileDraft.workPattern,
      weeklyEarningsBand:
        result.profile?.weekly_earnings_band || profileDraft.weeklyEarningsBand,
      preferredZones: Array.isArray(result.profile?.preferred_zones)
        ? result.profile.preferred_zones
        : profileDraft.preferredZones,
    }));

    setSaveState({
      loading: false,
      message: "Profile updated",
      error: "",
    });
  };

  return (
    <AppPageShell
      title={selectLabel(languageMode, "Worker Profile", "वर्कर प्रोफाइल")}
      description={selectLabel(
        languageMode,
        "Review your rider identity, preferred zones, trust reputation, and every protection notification in one place.",
        "अपनी राइडर पहचान, पसंदीदा ज़ोन, ट्रस्ट रेपुटेशन और सभी सुरक्षा नोटिफिकेशन एक जगह देखें।",
      )}
    >
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <AppSurface className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {selectLabel(languageMode, "Identity", "पहचान")}
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {session?.name || "Rider"}
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  {session?.email || session?.phone || "No contact details available"}
                </p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.08]"
              >
                {selectLabel(languageMode, "Back to Dashboard", "डैशबोर्ड पर लौटें")}
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Home City", "होम सिटी")}
                </p>
                <p className="mt-2 text-sm font-black text-white">{session?.city || "New Delhi"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Worker ID", "वर्कर आईडी")}
                </p>
                <p className="mt-2 text-sm font-black text-white">{session?.workerId || "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Work Pattern", "वर्क पैटर्न")}
                </p>
                <p className="mt-2 text-sm font-black text-white">{session?.workPattern || "peak_hours"}</p>
              </div>
            </div>
          </AppSurface>

          <AppSurface className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {selectLabel(languageMode, "Preferred Zones", "पसंदीदा ज़ोन")}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {selectLabel(
                    languageMode,
                    "These zones determine whether a live disruption should create protection for you automatically.",
                    "ये ज़ोन तय करते हैं कि लाइव डिसरप्शन आपके लिए ऑटोमैटिक सुरक्षा बनाए या नहीं।",
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saveState.loading}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
              >
                {saveState.loading
                  ? selectLabel(languageMode, "Saving...", "सेव हो रहा है...")
                  : selectLabel(languageMode, "Save Preferences", "प्रेफरेंस सेव करें")}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Work Pattern", "वर्क पैटर्न")}
                </p>
                <div className="mt-3 grid gap-2">
                  {workPatterns.map((pattern) => {
                    const selected = profileDraft.workPattern === pattern.id;
                    return (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() =>
                          setProfileDraft((current) => ({
                            ...current,
                            workPattern: pattern.id,
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                            : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        {pattern.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Weekly Earnings", "साप्ताहिक कमाई")}
                </p>
                <div className="mt-3 grid gap-2">
                  {weeklyEarningsBands.map((band) => {
                    const selected = profileDraft.weeklyEarningsBand === band.id;
                    return (
                      <button
                        key={band.id}
                        type="button"
                        onClick={() =>
                          setProfileDraft((current) => ({
                            ...current,
                            weeklyEarningsBand: band.id,
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                            : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        {band.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {profileDraft.preferredZones.length === 0 ? (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "No preferred zones set", "कोई पसंदीदा ज़ोन सेट नहीं")}
                </span>
              ) : (
                profileDraft.preferredZones.map((zone) => (
                  <div
                    key={zone.id || zone.name}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3"
                  >
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-200">
                      {zone.name}
                    </p>
                    {zone.corridor ? (
                      <p className="mt-1 text-xs font-medium text-emerald-100/80">{zone.corridor}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {zoneSuggestions.map((zone) => {
                const selected = profileDraft.preferredZones.some((item) => item.id === zone.id);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{zone.name}</p>
                    <p className={`mt-1 text-xs ${selected ? "text-emerald-100/70" : "text-zinc-500"}`}>
                      {zone.corridor} · {zone.disruptionTag}
                    </p>
                  </button>
                );
              })}
            </div>

            {saveState.message ? (
              <p className="text-sm font-semibold text-emerald-300">{saveState.message}</p>
            ) : null}
            {saveState.error ? (
              <p className="text-sm font-semibold text-red-300">{saveState.error}</p>
            ) : null}
          </AppSurface>
        </div>

        <div className="space-y-8">
          <AppSurface className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {selectLabel(languageMode, "Rider Reputation", "राइडर रेपुटेशन")}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                {selectLabel(languageMode, "Reliability Tier", "रिलायबिलिटी टियर")}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                  reputationProfile.tier === "Gold"
                    ? "bg-amber-500/10 text-amber-200"
                    : reputationProfile.tier === "Silver"
                      ? "bg-slate-500/10 text-slate-200"
                      : "bg-orange-500/10 text-orange-200"
                }`}
              >
                {reputationProfile.tier}
              </span>
            </div>
            <p className="text-4xl font-black tracking-tight text-white">{reputationProfile.score}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Settled", "सेटल्ड")}
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  {reputationProfile.settlementRatePct}%
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {selectLabel(languageMode, "Predictive Win", "प्रेडिक्टिव विन")}
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  {reputationProfile.predictiveSuccessRatePct}%
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300">{reputationProfile.reviewNote}</p>
          </AppSurface>

          <AppSurface className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {selectLabel(languageMode, "Notification Center", "नोटिफिकेशन सेंटर")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition hover:text-white"
                >
                  {selectLabel(languageMode, "Mark all read", "सभी पढ़े गए")}
                </button>
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition hover:text-white"
                >
                  {selectLabel(languageMode, "Clear", "क्लियर")}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "claims", label: "Claims" },
                { id: "payouts", label: "Payouts" },
                { id: "alerts", label: "Alerts" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setNotificationFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                    notificationFilter === filter.id
                      ? "bg-cyan-300 text-zinc-950"
                      : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <p className="text-sm font-medium text-zinc-400">
                  {selectLabel(
                    languageMode,
                    "Notifications from claims, payouts, and protection activity will appear here.",
                    "क्लेम, पेआउट और सुरक्षा गतिविधि से जुड़ी नोटिफिकेशन यहां दिखाई देंगी।",
                  )}
                </p>
              ) : (
                filteredNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMarkNotificationRead(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      item.read
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-cyan-400/20 bg-cyan-500/[0.06]"
                    }`}
                  >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          {normalizeNotificationCategory(item)}
                        </p>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-white">{item.title}</p>
                    {item.message ? (
                      <p className="mt-1 text-xs font-medium text-zinc-300">{item.message}</p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </AppSurface>
        </div>
      </div>
    </AppPageShell>
  );
}

