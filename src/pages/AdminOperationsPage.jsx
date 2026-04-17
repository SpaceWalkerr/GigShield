import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { selectLabel } from "../utils/i18n";

import {
  getPayoutHistory,
  getFailureReasonLabel,
  hydratePayoutHistory,
  savePayoutReceipt,
  transitionPayoutLifecycle,
} from "../utils/payoutReceipt";
import { getTrackedEvents } from "../utils/observability";
import { getOverrideLogs, appendOverrideLog } from "../utils/adminOps";
import {
  getTriggerAuditEvents,
  hydrateTriggerAuditEvents,
} from "../utils/triggerEngine";
import { fetchPhase3OpsSnapshot } from "../utils/phase3Analytics";
import {
  fetchModerationActions,
  persistAnomalyEvents,
  saveModerationAction,
} from "../utils/phase3Persistence";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";
import { useHydratedSession } from "../hooks/useHydratedSession";
import { fetchOperationsInsights } from "../services/backend/operationsInsightsService";
import { runSignalIngestionSweep } from "../services/backend/signalIngestionService";
import { pushNotification } from "../utils/notifications";

function AdminOperationsPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const { session } = useHydratedSession();
  const [history, setHistory] = useState(() => getPayoutHistory());
  const [overrideLogs, setOverrideLogs] = useState(() => getOverrideLogs());
  const [triggerAudit, setTriggerAudit] = useState(() =>
    getTriggerAuditEvents(),
  );
  const [moderationActions, setModerationActions] = useState([]);
  const [dismissedModerationIds, setDismissedModerationIds] = useState([]);
  const [phase3Snapshot, setPhase3Snapshot] = useState({
    trustMetrics: null,
    anomalyAlerts: [],
    moderationQueue: [],
  });
  const [recentDisruptions, setRecentDisruptions] = useState([]);
  const [recentAutomationScans, setRecentAutomationScans] = useState([]);
  const [signalSweepState, setSignalSweepState] = useState({
    loading: false,
    scannedAt: "",
    syncedCount: 0,
    expiredCount: 0,
    generatedClaimsCount: 0,
    generatedClaims: [],
    generatedPayoutsCount: 0,
    generatedPayouts: [],
    scans: [],
    error: "",
  });
  const [autoSweepEnabled, setAutoSweepEnabled] = useState(true);

  const flaggedQueue = useMemo(
    () =>
      history.filter(
        (item) => item.lifecycleStatus === "failed" || item.failureReasonCode,
      ),
    [history],
  );

  const trackedEvents = getTrackedEvents();
  const fraudAnalytics = useMemo(() => {
    const failed = history.filter((item) => item.lifecycleStatus === "failed");
    const settled = history.filter(
      (item) => item.lifecycleStatus === "settled",
    );
    const falsePositives = failed.filter(
      (item) =>
        item.retryCount > 0 &&
        item.lifecycleTimeline?.some((x) => x.status === "settled"),
    );

    const turnaroundValues = settled
      .map((item) => {
        const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        const received = item.receivedAt
          ? new Date(item.receivedAt).getTime()
          : 0;
        if (!created || !received || received < created) {
          return null;
        }
        return Math.round((received - created) / 1000);
      })
      .filter((value) => typeof value === "number");

    const avgTurnaroundSec =
      turnaroundValues.length > 0
        ? Math.round(
            turnaroundValues.reduce((a, b) => a + b, 0) /
              turnaroundValues.length,
          )
        : 0;

    const riskBuckets = history.reduce((acc, item) => {
      const key = item.riskLevel || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      failedCount: failed.length,
      settledCount: settled.length,
      falsePositiveRate:
        failed.length > 0
          ? ((falsePositives.length / failed.length) * 100).toFixed(1)
          : "0.0",
      avgTurnaroundSec,
      riskBuckets,
    };
  }, [history]);

  const slaTracker = useMemo(() => {
    const verificationDurations = [];
    const settlementDurations = [];

    history.forEach((item) => {
      const timeline = Array.isArray(item.lifecycleTimeline)
        ? item.lifecycleTimeline
        : [];
      const pending = timeline.find(
        (step) => step.status === "pending-verification",
      );
      const verified = timeline.find((step) => step.status === "verified");
      const processing = timeline.find((step) => step.status === "processing");
      const settled = timeline.find((step) => step.status === "settled");

      if (pending && verified) {
        const sec = Math.round(
          (new Date(verified.at).getTime() - new Date(pending.at).getTime()) /
            1000,
        );
        if (sec >= 0) {
          verificationDurations.push(sec);
        }
      }

      if (processing && settled) {
        const sec = Math.round(
          (new Date(settled.at).getTime() - new Date(processing.at).getTime()) /
            1000,
        );
        if (sec >= 0) {
          settlementDurations.push(sec);
        }
      }
    });

    const avg = (values) =>
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;

    return {
      avgVerificationSec: avg(verificationDurations),
      avgSettlementSec: avg(settlementDurations),
    };
  }, [history]);

  const refresh = () => {
    setHistory(getPayoutHistory());
    setOverrideLogs(getOverrideLogs());
  };

  useEffect(() => {
    let alive = true;

    const hydratePhase3 = async () => {
      const hydratedHistory = await hydratePayoutHistory({ limit: 200 });
      if (!alive) return;
      setHistory(hydratedHistory);

      const hydratedTriggerAudit = await hydrateTriggerAuditEvents({
        city: session?.city,
        limit: 100,
      });
      if (!alive) return;
      setTriggerAudit(hydratedTriggerAudit);

      const snapshot = await fetchPhase3OpsSnapshot();
      if (!alive) return;
      setPhase3Snapshot(snapshot);
      await persistAnomalyEvents(snapshot.anomalyAlerts, {
        workerId: session?.workerId,
      });

      const insights = await fetchOperationsInsights({ city: session?.city });
      if (!alive || !insights) return;
      setRecentDisruptions(insights.recentDisruptions || []);
      setRecentAutomationScans(insights.recentAutomationScans || []);

      const recentActions = await fetchModerationActions({ limit: 20 });
      if (!alive) return;
      setModerationActions(recentActions);
    };

    hydratePhase3();

    return () => {
      alive = false;
    };
  }, [history.length, session?.city, session?.workerId]);

  const moderationQueueVisible = useMemo(
    () =>
      phase3Snapshot.moderationQueue.filter(
        (item) => !dismissedModerationIds.includes(item.id),
      ),
    [phase3Snapshot.moderationQueue, dismissedModerationIds],
  );

  const handleModerationAction = async (item, decision) => {
    const result = await saveModerationAction(
      {
        targetWorkerId: item.workerId,
        actionType: "team-cluster-review",
        decision,
        reason: item.reason,
        payload: item,
      },
      { actorWorkerId: session?.workerId },
    );

    setDismissedModerationIds((prev) => [...prev, item.id]);
    if (result?.action) {
      setModerationActions((prev) => [result.action, ...prev].slice(0, 20));
    }
  };

  const applyOverride = (item, decision) => {
    const nextStatus = decision === "approve" ? "settled" : "failed";
    const next = transitionPayoutLifecycle(
      item,
      nextStatus,
      `Admin ${decision} override`,
      {
        manualOverride: {
          decision,
          at: new Date().toISOString(),
        },
        receivedAt:
          decision === "approve"
            ? new Date().toISOString()
            : item.receivedAt || "",
      },
    );

    savePayoutReceipt(next);
    appendOverrideLog({
      payoutId: item.payoutId,
      decision,
      reasonCode: item.failureReasonCode || "MANUAL_OVERRIDE",
      details: item.failureReason || item.reason || "",
    });
    refresh();
  };

  const handleRunSignalSweep = useCallback(
    async (source = "manual") => {
      setSignalSweepState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        const result = await runSignalIngestionSweep();
        setSignalSweepState({
          loading: false,
          scannedAt: result.scannedAt,
          syncedCount: result.syncedCount,
          expiredCount: result.expiredCount || 0,
          generatedClaimsCount: result.generatedClaimsCount || 0,
          generatedClaims: result.generatedClaims || [],
          generatedPayoutsCount: result.generatedPayoutsCount || 0,
          generatedPayouts: result.generatedPayouts || [],
          scans: result.scans,
          error: "",
        });

        if (
          source === "manual" ||
          result.generatedClaimsCount > 0 ||
          result.generatedPayoutsCount > 0
        ) {
          pushNotification({
            type: "info",
            title:
              source === "manual"
                ? "Live sweep completed"
                : "Background sweep updated",
            message: `Synced ${result.syncedCount} disruptions, ${result.generatedClaimsCount || 0} claims, ${result.generatedPayoutsCount || 0} payout candidates.`,
          });
        }

        const insights = await fetchOperationsInsights({ city: session?.city });
        if (insights) {
          setRecentDisruptions(insights.recentDisruptions || []);
          setRecentAutomationScans(insights.recentAutomationScans || []);
        }
      } catch (error) {
        setSignalSweepState((current) => ({
          ...current,
          loading: false,
          error: error?.message || "Signal sweep failed",
        }));
      }
    },
    [session?.city],
  );

  useEffect(() => {
    if (!autoSweepEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void handleRunSignalSweep("interval");
    }, 120000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoSweepEnabled, handleRunSignalSweep]);

  return (
    <AppPageShell
      badge="Admin Ops"
      backTo="/dashboard"
      backLabel={selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
      actions={
        <LanguageToggle
          languageMode={languageMode}
          setLanguageMode={setLanguageMode}
        />
      }
    >
      <div className="w-full px-0 py-4">
        <header className="mb-10">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            {selectLabel(languageMode, "Operations Console", "ऑपरेशन्स कंसोल")}
          </p>
          <h1 className="mb-6 text-4xl font-black leading-none tracking-tighter text-white sm:text-5xl">
            Ops Panel
          </h1>
        </header>

        <div className="space-y-12">
          {/* Flagged Queue */}
          <section>
            <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Flagged claims queue
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {flaggedQueue.length === 0 ? (
                <p className="text-xs font-bold italic text-zinc-500">
                  No flagged claims.
                </p>
              ) : null}
              {flaggedQueue.map((item) => (
                <AppSurface key={item.payoutId} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {item.payoutId}
                    </p>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <p className="mb-4 text-xs font-black text-white">
                    {item.failureReasonCode || "-"} |{" "}
                    {item.failureReasonCode
                      ? getFailureReasonLabel(item.failureReasonCode)
                      : item.reason}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200"
                      onClick={() => applyOverride(item, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                      onClick={() => applyOverride(item, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </AppSurface>
              ))}
            </div>
          </section>

          {/* Analytics Grid */}
          <section className="grid gap-8 lg:grid-cols-3">
            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Fraud Analytics
              </p>
              <div className="space-y-4">
                {[
                  { label: "Failed Claims", value: fraudAnalytics.failedCount },
                  {
                    label: "Settled Claims",
                    value: fraudAnalytics.settledCount,
                  },
                  {
                    label: "False Positive Rate",
                    value: `${fraudAnalytics.falsePositiveRate}%`,
                  },
                  {
                    label: "Avg Turnaround",
                    value: `${fraudAnalytics.avgTurnaroundSec}s`,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-bold text-zinc-500">
                      {stat.label}
                    </span>
                    <span className="text-sm font-black text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </AppSurface>

            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Risk Buckets
              </p>
              <div className="space-y-4">
                {Object.entries(fraudAnalytics.riskBuckets).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="text-xs font-bold text-zinc-500">
                        {key}
                      </span>
                      <span className="text-sm font-black text-white">
                        {value}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </AppSurface>

            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                SLA Tracker
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Avg Verification",
                    value: `${slaTracker.avgVerificationSec}s`,
                  },
                  {
                    label: "Avg Settlement",
                    value: `${slaTracker.avgSettlementSec}s`,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-bold text-zinc-500">
                      {stat.label}
                    </span>
                    <span className="text-sm font-black text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </AppSurface>
          </section>

          <section>
            <AppSurface className="p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Signal Sweep
                  </p>
                  <p className="text-sm font-medium text-zinc-300">
                    Run a live multi-city weather and AQI sweep, then write
                    detected disruptions into backend trigger events.
                  </p>
                  {signalSweepState.scannedAt ? (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Last run:{" "}
                      {new Date(signalSweepState.scannedAt).toLocaleString()} ·
                      Synced {signalSweepState.syncedCount} events · Expired{" "}
                      {signalSweepState.expiredCount} stale events · Created{" "}
                      {signalSweepState.generatedClaimsCount} claim candidates ·
                      Queued {signalSweepState.generatedPayoutsCount} payout
                      candidates
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleRunSignalSweep("manual")}
                  disabled={signalSweepState.loading}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {signalSweepState.loading
                    ? "Running Sweep..."
                    : "Run Live Signal Sweep"}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Auto Sweep While Open
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-300">
                    Runs every 2 minutes while this admin page stays open.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSweepEnabled((current) => !current)}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                    autoSweepEnabled
                      ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                      : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {autoSweepEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              {signalSweepState.error ? (
                <p className="mt-4 text-sm font-semibold text-red-300">
                  {signalSweepState.error}
                </p>
              ) : null}

              {signalSweepState.scans.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {signalSweepState.scans.map((scan) => (
                    <div
                      key={`${scan.city}-${scan.scannedAt}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-white">
                          {scan.city}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {scan.riskLevel}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-zinc-300">
                        {scan.notification}
                      </p>
                      {scan.zoneName ? (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Zone: {scan.zoneName}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Trigger: {scan.triggerKey || "none"} · Confidence:{" "}
                        {scan.confidence}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {signalSweepState.generatedClaims.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Auto Claim Candidates
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {signalSweepState.generatedClaims
                      .slice(0, 6)
                      .map((claim) => (
                        <div
                          key={claim.id}
                          className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                            {claim.claim_number}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-white">
                            Worker {String(claim.worker_profile_id).slice(0, 8)}{" "}
                            · {claim.status}
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Trigger {String(claim.trigger_event_id).slice(0, 8)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {signalSweepState.generatedPayouts.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Payout Candidates
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {signalSweepState.generatedPayouts
                      .slice(0, 6)
                      .map((payout) => (
                        <div
                          key={payout.id}
                          className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">
                            {payout.payout_id}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-white">
                            Ready for verification · {payout.status}
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Amount pending {Number(payout.payout_amount || 0)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </AppSurface>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Anomaly Alerts
              </p>
              <div className="space-y-3">
                {phase3Snapshot.anomalyAlerts.length === 0 ? (
                  <p className="text-xs font-bold italic text-zinc-500">
                    No anomaly alerts right now.
                  </p>
                ) : (
                  phase3Snapshot.anomalyAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-white">
                          {alert.title}
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${alert.severity === "high" ? "text-red-600" : "text-amber-600"}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-300">
                        {alert.detail}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </AppSurface>

            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Moderation Queue
              </p>
              <div className="space-y-3">
                {moderationQueueVisible.length === 0 ? (
                  <p className="text-xs font-bold italic text-zinc-500">
                    No suspicious team clusters.
                  </p>
                ) : (
                  moderationQueueVisible.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-white">
                          {item.workerId}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                          risk {item.riskScore}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-300">
                        {item.reason}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        members {item.memberCount} | pending{" "}
                        {item.pendingRatePct}%
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleModerationAction(item, "approved")
                          }
                          className="h-8 rounded-lg bg-white px-3 text-[9px] font-black uppercase tracking-widest text-zinc-950"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleModerationAction(item, "escalated")
                          }
                          className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[9px] font-black uppercase tracking-widest text-zinc-100"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AppSurface>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Recent Disruptions
              </p>
              <div className="space-y-3">
                {recentDisruptions.length === 0 ? (
                  <p className="text-xs font-bold italic text-zinc-500">
                    No recent disruption records.
                  </p>
                ) : (
                  recentDisruptions.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-white">
                          {item.label}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-300">
                        {item.city} · {item.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </AppSurface>

            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Automation Scan Memory
              </p>
              <div className="space-y-3">
                {recentAutomationScans.length === 0 ? (
                  <p className="text-xs font-bold italic text-zinc-500">
                    No automation scans recorded.
                  </p>
                ) : (
                  recentAutomationScans.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-white">
                          {item.riskLevel} risk
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {item.confidence}%
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-300">
                        {item.city} · {item.trigger}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-zinc-400">
                        {item.explanation}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </AppSurface>
          </section>

          {/* Logs */}
          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Manual Override Logs
              </p>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                {overrideLogs.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-white/10 p-6 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-white">
                        {item.payoutId} — {item.decision}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {new Date(item.at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {item.reasonCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <AppSurface className="p-8">
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Audit + Observability
              </p>
              <div className="space-y-8">
                <div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {triggerAudit.length}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Trigger audit events
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {trackedEvents.length}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Tracked app events
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {phase3Snapshot.trustMetrics?.payoutSuccessRatePct ??
                      fraudAnalytics.settledCount}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Phase 3 trust score pulse
                  </p>
                </div>
              </div>
            </AppSurface>
          </section>

          <section>
            <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Recent Moderation Actions
            </p>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {moderationActions.length === 0 ? (
                <div className="p-6">
                  <p className="text-xs font-bold italic text-zinc-500">
                    No moderation actions yet.
                  </p>
                </div>
              ) : (
                moderationActions.slice(0, 8).map((item) => (
                  <div
                    key={item.actionId}
                    className="border-b border-white/10 p-6 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-white">
                        {item.targetWorkerId} — {item.decision}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {item.actionType}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-zinc-300">
                      {item.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AppPageShell>
  );
}

export default AdminOperationsPage;

