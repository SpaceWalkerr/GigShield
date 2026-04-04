import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import {
  getPayoutHistory,
  getFailureReasonLabel,
  savePayoutReceipt,
  transitionPayoutLifecycle,
} from "../utils/payoutReceipt";
import { getTrackedEvents } from "../utils/observability";
import { getOverrideLogs, appendOverrideLog } from "../utils/adminOps";
import { getTriggerAuditEvents } from "../utils/triggerEngine";
import { fetchPhase3OpsSnapshot } from "../utils/phase3Analytics";
import { fetchModerationActions, persistAnomalyEvents, saveModerationAction } from "../utils/phase3Persistence";
import { getSession } from "../utils/session";

function AdminOperationsPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [session] = useState(() => getSession());
  const [history, setHistory] = useState(() => getPayoutHistory());
  const [overrideLogs, setOverrideLogs] = useState(() => getOverrideLogs());
  const [moderationActions, setModerationActions] = useState([]);
  const [dismissedModerationIds, setDismissedModerationIds] = useState([]);
  const [phase3Snapshot, setPhase3Snapshot] = useState({
    trustMetrics: null,
    anomalyAlerts: [],
    moderationQueue: [],
  });

  const flaggedQueue = useMemo(
    () => history.filter((item) => item.lifecycleStatus === "failed" || item.failureReasonCode),
    [history],
  );

  const trackedEvents = getTrackedEvents();
  const triggerAudit = getTriggerAuditEvents();

  const fraudAnalytics = useMemo(() => {
    const failed = history.filter((item) => item.lifecycleStatus === "failed");
    const settled = history.filter((item) => item.lifecycleStatus === "settled");
    const falsePositives = failed.filter((item) => item.retryCount > 0 && item.lifecycleTimeline?.some((x) => x.status === "settled"));

    const turnaroundValues = settled
      .map((item) => {
        const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        const received = item.receivedAt ? new Date(item.receivedAt).getTime() : 0;
        if (!created || !received || received < created) {
          return null;
        }
        return Math.round((received - created) / 1000);
      })
      .filter((value) => typeof value === "number");

    const avgTurnaroundSec =
      turnaroundValues.length > 0
        ? Math.round(turnaroundValues.reduce((a, b) => a + b, 0) / turnaroundValues.length)
        : 0;

    const riskBuckets = history.reduce(
      (acc, item) => {
        const key = item.riskLevel || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      failedCount: failed.length,
      settledCount: settled.length,
      falsePositiveRate: failed.length > 0 ? ((falsePositives.length / failed.length) * 100).toFixed(1) : "0.0",
      avgTurnaroundSec,
      riskBuckets,
    };
  }, [history]);

  const slaTracker = useMemo(() => {
    const verificationDurations = [];
    const settlementDurations = [];

    history.forEach((item) => {
      const timeline = Array.isArray(item.lifecycleTimeline) ? item.lifecycleTimeline : [];
      const pending = timeline.find((step) => step.status === "pending-verification");
      const verified = timeline.find((step) => step.status === "verified");
      const processing = timeline.find((step) => step.status === "processing");
      const settled = timeline.find((step) => step.status === "settled");

      if (pending && verified) {
        const sec = Math.round((new Date(verified.at).getTime() - new Date(pending.at).getTime()) / 1000);
        if (sec >= 0) {
          verificationDurations.push(sec);
        }
      }

      if (processing && settled) {
        const sec = Math.round((new Date(settled.at).getTime() - new Date(processing.at).getTime()) / 1000);
        if (sec >= 0) {
          settlementDurations.push(sec);
        }
      }
    });

    const avg = (values) =>
      values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

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
      const snapshot = await fetchPhase3OpsSnapshot();
      if (!alive) return;
      setPhase3Snapshot(snapshot);
      await persistAnomalyEvents(snapshot.anomalyAlerts, { workerId: session?.workerId });

      const recentActions = await fetchModerationActions({ limit: 20 });
      if (!alive) return;
      setModerationActions(recentActions);
    };

    hydratePhase3();

    return () => {
      alive = false;
    };
  }, [history.length, session?.workerId]);

  const moderationQueueVisible = useMemo(
    () => phase3Snapshot.moderationQueue.filter((item) => !dismissedModerationIds.includes(item.id)),
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
        receivedAt: decision === "approve" ? new Date().toISOString() : item.receivedAt || "",
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

  return (
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200">
            Admin Ops
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
            {selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <header className="mb-10">
          <p className="kicker mb-2">{selectLabel(languageMode, "Operations Console", "ऑपरेशन्स कंसोल")}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
            Ops Panel
          </h1>
        </header>

        <div className="space-y-12">
          {/* Flagged Queue */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Flagged claims queue</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {flaggedQueue.length === 0 ? <p className="text-xs font-bold text-gray-400 italic">No flagged claims.</p> : null}
              {flaggedQueue.map((item) => (
                <div key={item.payoutId} className="bg-white border-2 border-gray-900 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.payoutId}</p>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <p className="text-xs font-black mb-4">{item.failureReasonCode || "-"} | {item.failureReasonCode ? getFailureReasonLabel(item.failureReasonCode) : item.reason}</p>
                  <div className="flex gap-2">
                    <button type="button" className="primary-btn w-full py-2" onClick={() => applyOverride(item, "approve")}>Approve</button>
                    <button type="button" className="secondary-btn w-full py-2" onClick={() => applyOverride(item, "reject")}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics Grid */}
          <section className="grid gap-8 lg:grid-cols-3">
            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Fraud Analytics</p>
              <div className="space-y-4">
                {[
                  { label: "Failed Claims", value: fraudAnalytics.failedCount },
                  { label: "Settled Claims", value: fraudAnalytics.settledCount },
                  { label: "False Positive Rate", value: `${fraudAnalytics.falsePositiveRate}%` },
                  { label: "Avg Turnaround", value: `${fraudAnalytics.avgTurnaroundSec}s` }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-gray-500">{stat.label}</span>
                    <span className="text-sm font-black text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Risk Buckets</p>
              <div className="space-y-4">
                {Object.entries(fraudAnalytics.riskBuckets).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-gray-500">{key}</span>
                    <span className="text-sm font-black text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">SLA Tracker</p>
              <div className="space-y-4">
                {[
                  { label: "Avg Verification", value: `${slaTracker.avgVerificationSec}s` },
                  { label: "Avg Settlement", value: `${slaTracker.avgSettlementSec}s` }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-gray-500">{stat.label}</span>
                    <span className="text-sm font-black text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Anomaly Alerts</p>
              <div className="space-y-3">
                {phase3Snapshot.anomalyAlerts.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 italic">No anomaly alerts right now.</p>
                ) : (
                  phase3Snapshot.anomalyAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-gray-900">{alert.title}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${alert.severity === "high" ? "text-red-600" : "text-amber-600"}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-600">{alert.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Moderation Queue</p>
              <div className="space-y-3">
                {moderationQueueVisible.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 italic">No suspicious team clusters.</p>
                ) : (
                  moderationQueueVisible.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-gray-900">{item.workerId}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600">risk {item.riskScore}</span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-600">{item.reason}</p>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                        members {item.memberCount} | pending {item.pendingRatePct}%
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => handleModerationAction(item, "approved")}
                          className="h-8 rounded-lg bg-gray-900 px-3 text-[9px] font-black uppercase tracking-widest text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerationAction(item, "escalated")}
                          className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-gray-700"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Logs */}
          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Manual Override Logs</p>
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
                {overrideLogs.slice(0, 5).map((item, i) => (
                  <div key={item.id} className="border-b border-gray-50 p-6 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black">{item.payoutId} — {item.decision}</p>
                      <span className="text-[10px] font-bold text-gray-400">{new Date(item.at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.reasonCode}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Audit + Observability</p>
              <div className="space-y-8">
                <div>
                  <p className="text-3xl font-black tracking-tighter">{triggerAudit.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trigger audit events</p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tighter">{trackedEvents.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tracked app events</p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tighter">{phase3Snapshot.trustMetrics?.payoutSuccessRatePct ?? fraudAnalytics.settledCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phase 3 trust score pulse</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Recent Moderation Actions</p>
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
              {moderationActions.length === 0 ? (
                <div className="p-6">
                  <p className="text-xs font-bold text-gray-400 italic">No moderation actions yet.</p>
                </div>
              ) : (
                moderationActions.slice(0, 8).map((item) => (
                  <div key={item.actionId} className="border-b border-gray-50 p-6 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black">{item.targetWorkerId} — {item.decision}</p>
                      <span className="text-[10px] font-bold text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.actionType}</p>
                    <p className="text-[11px] font-medium text-gray-600 mt-1">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminOperationsPage;
