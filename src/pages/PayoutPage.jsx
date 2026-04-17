import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import SelfieVerificationPanel from "../components/SelfieVerificationPanel";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getAuthToken } from "../utils/session";
import userProfile from "../data/userProfile.json";
import { runPayoutSecurityChecks } from "../utils/payoutSecurity";
import { pushNotification } from "../utils/notifications";
import { trackEvent } from "../utils/observability";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";
import {
  clearPayoutReceipt,
  createPayoutReceipt,
  getFailureReasonLabel,
  getPayoutReceipt,
  payoutFailureReasonCodes,
  savePayoutReceipt,
  transitionPayoutLifecycle,
} from "../utils/payoutReceipt";
import { useHydratedSession } from "../hooks/useHydratedSession";
import { fetchLatestOpenPayoutCandidateFromBackend } from "../services/backend/payoutService";

function getLifecycleLabel(languageMode, status) {
  const labels = {
    "pending-verification": selectLabel(languageMode, "Pending Verification", "सत्यापन लंबित"),
    verified: selectLabel(languageMode, "Verified", "सत्यापित"),
    processing: selectLabel(languageMode, "Processing", "प्रोसेसिंग"),
    settled: selectLabel(languageMode, "Settled", "सेटल्ड"),
    failed: selectLabel(languageMode, "Failed", "विफल"),
  };

  return labels[status] || status;
}

function getStatusStyles(status) {
  const styles = {
    paid: "border-moss-300 bg-moss-50 text-coal-900",
    capped: "border-signal-600 bg-signal-50 text-coal-900",
    "blocked-cap": "border-red-300 bg-red-50 text-red-800",
    "blocked-coverage": "border-red-300 bg-red-50 text-red-800",
    "blocked-verification": "border-red-300 bg-red-50 text-red-800",
    "blocked-policy": "border-red-300 bg-red-50 text-red-800",
    "invalid-trigger": "border-red-300 bg-red-50 text-red-800",
  };

  return styles[status] || "border-coal-200 bg-white text-coal-900";
}

function hasCompletedSelfieChecks(evidence) {
  if (!evidence) {
    return false;
  }

  const gesturePassed = Boolean(evidence?.gestureKey) && Number(evidence?.handHoldMs || 0) >= 3000;
  return gesturePassed;
}

function PayoutPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const { session } = useHydratedSession();
  const strictTokenDefault = import.meta.env.VITE_STRICT_TOKEN_ENFORCEMENT === "true";
  const workerCity = session?.city || userProfile.city;
  const [strictTokenEnforcement] = useState(() => {
    const stored = localStorage.getItem("gigshieldStrictTokenEnforced");
    if (stored === "true") {
      return true;
    }
    if (stored === "false") {
      return false;
    }
    return strictTokenDefault;
  });
  const [receiptState, setReceiptState] = useState(() => getPayoutReceipt());
  const [verificationState, setVerificationState] = useState(() => {
    const initialReceipt = getPayoutReceipt();
    const alreadyVerified = initialReceipt?.lifecycleStatus === "verified";
    return {
      status: alreadyVerified ? "verified" : "idle",
      gesture: "",
      gestureKey: "",
      issuedAt: "",
      verifiedAt: alreadyVerified ? (initialReceipt?.lifecycleUpdatedAt || "") : "",
      evidence: initialReceipt?.receivedWithVerification || null,
    };
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let alive = true;

    const hydrateBackendPayoutCandidate = async () => {
      const candidate = await fetchLatestOpenPayoutCandidateFromBackend();
      if (!alive || !candidate?.payoutId) {
        return;
      }

      const localReceipt = getPayoutReceipt();
      const localUpdatedAt = new Date(
        localReceipt?.lifecycleUpdatedAt || localReceipt?.createdAt || 0,
      ).getTime();
      const remoteUpdatedAt = new Date(
        candidate?.lifecycleUpdatedAt || candidate?.createdAt || 0,
      ).getTime();

      if (localReceipt?.payoutId === candidate.payoutId && localUpdatedAt >= remoteUpdatedAt) {
        return;
      }

      const hydratedReceipt =
        candidate.lifecycleStatus || candidate.createdAt
          ? candidate
          : createPayoutReceipt(candidate);

      savePayoutReceipt(hydratedReceipt);
      setReceiptState(hydratedReceipt);

      setVerificationState((current) => {
        const alreadyVerified = hydratedReceipt?.lifecycleStatus === "verified";
        return {
          status: alreadyVerified ? "verified" : current.status === "verified" ? "verified" : "idle",
          gesture: current.gesture || "",
          gestureKey: current.gestureKey || "",
          issuedAt: current.issuedAt || "",
          verifiedAt: alreadyVerified ? hydratedReceipt?.lifecycleUpdatedAt || "" : current.verifiedAt || "",
          evidence: hydratedReceipt?.receivedWithVerification || current.evidence || null,
        };
      });

      pushNotification({
        type: "info",
        title: "Payout candidate ready",
        message: `GigShield queued ${formatCurrency(hydratedReceipt.payoutAmount || 0)} for verification.`,
      });
    };

    hydrateBackendPayoutCandidate();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  const receipt = receiptState;
  const verificationRequiredForPayout = true;
  const isLifecycleVerified = receipt?.lifecycleStatus === "verified";
  const gestureOptions = useMemo(
    () => [
      { key: "open_palm", label: "Show an open palm (hold 3 seconds)" },
      { key: "fist", label: "Show a closed fist (hold 3 seconds)" },
      { key: "thumbs_up", label: "Show a thumbs up (hold 3 seconds)" },
      { key: "peace", label: "Show a peace sign (hold 3 seconds)" },
      { key: "point_up", label: "Point up with index finger (hold 3 seconds)" },
      { key: "ok", label: "Make an OK sign (hold 3 seconds)" },
      { key: "three", label: "Show three fingers (hold 3 seconds)" },
      { key: "four", label: "Show four fingers (hold 3 seconds)" },
      { key: "both_hands", label: "Hold both hands in frame (hold 3 seconds)" },
      { key: "wave", label: "Wave (move left-right twice, then hold)" },
      { key: "move_closer", label: "Move hand closer to camera, then hold" },
      { key: "move_farther", label: "Move hand farther from camera, then hold" },
    ],
    [],
  );
  const selfieVerified = verificationState.status === "verified";
  const verificationEvidence = verificationState.evidence || receipt?.receivedWithVerification || null;
  const checksCompleted = hasCompletedSelfieChecks(verificationEvidence);

  const handleGenerateChallenge = () => {
    const randomGesture = gestureOptions[Math.floor(Math.random() * gestureOptions.length)];
    setVerificationState({
      status: "pending",
      gesture: randomGesture.label,
      gestureKey: randomGesture.key,
      issuedAt: new Date().toISOString(),
      verifiedAt: "",
      evidence: null,
    });
  };

  const handleApproveVerification = (evidence) => {
    const verifiedAt = new Date().toISOString();
    setVerificationState((current) => ({
      ...current,
      status: "verified",
      verifiedAt,
      evidence: evidence ?? null,
    }));

    if (receipt && receipt.lifecycleStatus === "pending-verification") {
      const verifiedReceipt = transitionPayoutLifecycle(
        receipt,
        "verified",
        "Selfie verification passed",
        {
          verifiedAt,
          receivedWithVerification: evidence ?? null,
        },
      );
      savePayoutReceipt(verifiedReceipt);
      setReceiptState(verifiedReceipt);
    }
  };

  const handleResetVerification = () => {
    setVerificationState({
      status: "idle",
      gesture: "",
      gestureKey: "",
      issuedAt: "",
      verifiedAt: "",
      evidence: null,
    });

    if (receipt && receipt.lifecycleStatus === "verified" && !receipt.receivedAt) {
      const pendingReceipt = transitionPayoutLifecycle(
        receipt,
        "pending-verification",
        "Verification reset by user",
        {
          verifiedAt: "",
        },
      );
      savePayoutReceipt(pendingReceipt);
      setReceiptState(pendingReceipt);
    }
  };

  const canReceive = useMemo(() => {
    if (!receipt) {
      return false;
    }
    if (receipt.receivedAt) {
      return false;
    }
    if (receipt.status !== "paid" && receipt.status !== "capped") {
      return false;
    }
    if ((receipt.payoutAmount ?? 0) <= 0) {
      return false;
    }
    return (selfieVerified || isLifecycleVerified) && checksCompleted;
  }, [receipt, selfieVerified, isLifecycleVerified, checksCompleted]);

  const canRetry = useMemo(() => {
    if (!receipt) {
      return false;
    }

    if (receipt.lifecycleStatus !== "failed") {
      return false;
    }

    if (Number(receipt.retryCount || 0) >= 3) {
      return false;
    }

    return true;
  }, [receipt]);

  const handleRetryFailedPayout = () => {
    if (!receipt) {
      return;
    }

    const nextRetryCount = Number(receipt.retryCount || 0) + 1;
    if (nextRetryCount > 3) {
      const blockedRetry = transitionPayoutLifecycle(
        receipt,
        "failed",
        "Retry limit exceeded",
        {
          retryCount: Number(receipt.retryCount || 0),
          failureReasonCode: payoutFailureReasonCodes.RETRY_LIMIT_EXCEEDED,
          failureReason: getFailureReasonLabel(payoutFailureReasonCodes.RETRY_LIMIT_EXCEEDED),
        },
      );
      savePayoutReceipt(blockedRetry);
      setReceiptState(blockedRetry);
      return;
    }

    const resetReceipt = transitionPayoutLifecycle(
      receipt,
      "pending-verification",
      `Retry attempt ${nextRetryCount}`,
      {
        retryCount: nextRetryCount,
        failureReasonCode: "",
        failureReason: "",
        receivedAt: "",
      },
    );

    savePayoutReceipt(resetReceipt);
    setReceiptState(resetReceipt);
    setVerificationState({
      status: "idle",
      gesture: "",
      gestureKey: "",
      issuedAt: "",
      verifiedAt: "",
      evidence: null,
    });
  };

  const handleReceive = () => {
    if (!receipt || !canReceive || isProcessing) {
      return;
    }

    if (!(selfieVerified || isLifecycleVerified) || !checksCompleted) {
      pushNotification({
        type: "warning",
        category: "payouts",
        title: "Verification needed",
        message: "Complete both liveness and gesture selfie checks before payout.",
      });
      return;
    }

    if (strictTokenEnforcement && !getAuthToken()) {
      const tokenBlockedReceipt = transitionPayoutLifecycle(
        receipt,
        "failed",
        "Payout request blocked: missing auth token",
        {
          failureReasonCode: payoutFailureReasonCodes.AUTH_TOKEN_REQUIRED,
          failureReason: getFailureReasonLabel(payoutFailureReasonCodes.AUTH_TOKEN_REQUIRED),
        },
      );
      savePayoutReceipt(tokenBlockedReceipt);
      setReceiptState(tokenBlockedReceipt);
      pushNotification({
        type: "error",
        category: "payouts",
        title: "Payout blocked",
        message: "Enable session authentication token before payout request.",
      });
      return;
    }

    const securityResult = runPayoutSecurityChecks({
      evidence: verificationState.evidence || receipt.receivedWithVerification || null,
      workerCity,
      strictVerification: true,
    });

    if (!securityResult.ok) {
      const failedReceipt = transitionPayoutLifecycle(
        receipt,
        "failed",
        `Security check failed: ${securityResult.reason}`,
        {
          failureReasonCode: securityResult.reasonCode,
          failureReason: securityResult.reason,
          securityCheck: securityResult,
        },
      );
      savePayoutReceipt(failedReceipt);
      setReceiptState(failedReceipt);
      setIsProcessing(false);
      pushNotification({
        type: "error",
        category: "payouts",
        title: "Payout failed",
        message: securityResult.reason,
      });
      trackEvent("payout_failed", {
        payoutId: receipt.payoutId,
        reasonCode: securityResult.reasonCode,
      });
      return;
    }

    const processingReceipt = transitionPayoutLifecycle(
      receipt,
      "processing",
      "Payout request submitted for settlement",
      {
        securityCheck: securityResult,
      },
    );
    savePayoutReceipt(processingReceipt);
    setReceiptState(processingReceipt);
    setIsProcessing(true);

    window.setTimeout(() => {
      const settledReceipt = transitionPayoutLifecycle(
        processingReceipt,
        "settled",
        "Payout settled successfully",
        {
          receivedAt: new Date().toISOString(),
          receivedWithVerification:
            verificationState.evidence ?? processingReceipt.receivedWithVerification ?? null,
          failureReason: "",
        },
      );

      savePayoutReceipt(settledReceipt);
      setReceiptState(settledReceipt);
      setIsProcessing(false);
      pushNotification({
        type: "success",
        category: "payouts",
        title: "Payout settled",
        message: `Receipt ${settledReceipt.payoutId} has been settled successfully.`,
      });
      trackEvent("payout_settled", {
        payoutId: settledReceipt.payoutId,
        amount: settledReceipt.payoutAmount,
      });
      navigate("/payout/received");
    }, 1200);
  };

  const handleClear = () => {
    clearPayoutReceipt();
    setReceiptState(null);
    setIsProcessing(false);
  };

  return (
    <AppPageShell
      badge="Payout"
      backTo="/dashboard"
      backLabel={selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
      title={selectLabel(languageMode, "Receive Funds", "धनराशि प्राप्त करें")}
      description={selectLabel(
        languageMode,
        "Verify the rider, clear security checks, and settle income-loss support instantly.",
        "राइडर को सत्यापित करें, सुरक्षा जांच पूरी करें और आय-हानि सहायता तुरंत सेटल करें।",
      )}
      actions={<LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />}
    >
      <div className="w-full">
        <AppSurface className="mb-8 border-cyan-300/20 bg-cyan-300/10 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
                {selectLabel(languageMode, "Payout Workflow", "पेआउट वर्कफ़्लो")}
              </p>
              <p className="mt-2 text-sm leading-7 text-cyan-50/90">
                {selectLabel(
                  languageMode,
                  "Once the trigger and verification rules are satisfied, GigShield can move a worker from validation to settled support without claim paperwork.",
                  "ट्रिगर और वेरिफिकेशन नियम पूरे होने के बाद GigShield बिना क्लेम पेपरवर्क के सेटल्ड सपोर्ट तक पहुंच सकता है।",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.14]"
              >
                {selectLabel(languageMode, "Back To Dashboard", "डैशबोर्ड पर लौटें")}
              </Link>
              <Link
                to="/admin-ops"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-950 transition hover:bg-zinc-200"
              >
                {selectLabel(languageMode, "Next: Admin View", "अगला: एडमिन व्यू")}
              </Link>
            </div>
          </div>
        </AppSurface>

        <header className="mb-8 sm:mb-12">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            {selectLabel(languageMode, "Settlement Console", "सेटलमेंट कंसोल")}
          </p>
          <p className="text-sm font-medium text-zinc-300">
            {selectLabel(
              languageMode,
              "Verify your identity and confirm the payout request.",
              "अपनी पहचान सत्यापित करें और भुगतान अनुरोध की पुष्टि करें।",
            )}
          </p>
        </header>

        <AppSurface className="mb-8 border-cyan-400/20 bg-cyan-400/8 p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
            {selectLabel(languageMode, "How to get payout", "भुगतान कैसे पाएं")}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold text-cyan-50">
            <li>
              {selectLabel(
                languageMode,
                "Start gesture selfie check first.",
                "पहले जेस्चर सेल्फी जांच शुरू करें।",
              )}
            </li>
            <li>
              {selectLabel(
                languageMode,
                "Show the requested hand gesture, take selfie, then tap Approve and Continue.",
                "मांगा गया हैंड जेस्चर दिखाएं, सेल्फी लें, फिर मंजूर करें व आगे बढ़ें दबाएं।",
              )}
            </li>
            <li>
              {selectLabel(
                languageMode,
                "After verification is complete, the Receive payout button unlocks.",
                "सत्यापन पूरा होने के बाद भुगतान प्राप्त करें बटन खुलेगा।",
              )}
            </li>
          </ol>
        </AppSurface>

        <div className="space-y-12">
          {!receipt ? (
            <AppSurface className="p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                {selectLabel(languageMode, "No payout yet", "अभी कोई भुगतान नहीं")}
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                {selectLabel(
                  languageMode,
                  "Go to Dashboard → tap a trigger button to generate a support payout.",
                  "डैशबोर्ड पर जाएं → भुगतान के लिए कोई ट्रिगर बटन दबाएं।",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200"
                >
                  {selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें")}
                </Link>
              </div>
            </AppSurface>
          ) : (
            <>
              <SelfieVerificationPanel
                requiresVerification={verificationRequiredForPayout}
                verificationState={verificationState}
                onGenerateChallenge={handleGenerateChallenge}
                onApproveVerification={handleApproveVerification}
                onResetVerification={handleResetVerification}
                languageMode={languageMode}
              />

              {(!(selfieVerified || isLifecycleVerified) || !checksCompleted) &&
              (receipt.status === "paid" || receipt.status === "capped") ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-3 text-xs font-semibold text-red-200">
                  {selectLabel(
                    languageMode,
                    "Complete gesture selfie verification to receive payout.",
                    "भुगतान पाने के लिए जेस्चर सेल्फी सत्यापन पूरा करें।",
                  )}
                </p>
              ) : null}

              {verificationState.status === "idle" ? (
                <AppSurface className="border-amber-400/20 bg-amber-400/10 p-4 sm:p-5">
                  <p className="text-xs font-semibold text-amber-100">
                    {selectLabel(
                      languageMode,
                      "Complete gesture verification first to view payout receipt details.",
                      "भुगतान रसीद विवरण देखने के लिए पहले जेस्चर सत्यापन पूरा करें।",
                    )}
                  </p>
                </AppSurface>
              ) : (
                <AppSurface className="border-white/10 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    {selectLabel(languageMode, "Latest payout receipt", "नवीनतम भुगतान रसीद")}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        {selectLabel(languageMode, "Amount", "राशि")}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-white">
                        {formatCurrency(receipt.payoutAmount ?? 0)}
                      </p>
                      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${getStatusStyles(receipt.status)}`}>
                        {receipt.status}
                      </div>
                      <p className="mt-3 text-sm text-zinc-300">{receipt.reason}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-zinc-300">
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Trigger", "ट्रिगर")}</span>: {" "}
                        {receipt.triggerLabel || receipt.triggerId}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Plan", "योजना")}</span>: {" "}
                        {receipt.planName || receipt.planId}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Status", "स्थिति")}</span>: {" "}
                        {receipt.status}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Payout ID", "भुगतान आईडी")}</span>: {" "}
                        {receipt.payoutId || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Lifecycle", "जीवनचक्र")}</span>: {" "}
                        {getLifecycleLabel(languageMode, receipt.lifecycleStatus || "pending-verification")}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Failure code", "विफलता कोड")}</span>: {" "}
                        {receipt.failureReasonCode || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Failure reason", "विफलता कारण")}</span>: {" "}
                        {receipt.failureReasonCode ? getFailureReasonLabel(receipt.failureReasonCode) : "-"}
                      </p>
                      {receipt.failureReasonCode?.startsWith("POLICY_") ? (
                        <p className="mt-1 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-200">
                          {selectLabel(languageMode, "Policy exclusion", "पॉलिसी अपवाद")}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Created", "बनाया गया")}</span>: {" "}
                        {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : ""}
                      </p>
                      <p>
                        <span className="font-semibold">{selectLabel(languageMode, "Received", "प्राप्त")}</span>: {" "}
                        {receipt.receivedAt
                          ? new Date(receipt.receivedAt).toLocaleString()
                          : selectLabel(languageMode, "Not received", "प्राप्त नहीं")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleReceive}
                      disabled={!canReceive || isProcessing}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
                    >
                      {isProcessing
                        ? selectLabel(languageMode, "Processing...", "प्रोसेसिंग...")
                        : selectLabel(languageMode, "Receive payout", "भुगतान प्राप्त करें")}
                    </button>
                    {receipt.receivedAt ? (
                      <Link to="/payout/received" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]">
                        {selectLabel(languageMode, "Open received page", "प्राप्त पेज खोलें")}
                      </Link>
                    ) : null}
                    {canRetry ? (
                      <button type="button" onClick={handleRetryFailedPayout} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]">
                        {selectLabel(languageMode, "Retry failed payout", "विफल भुगतान पुनः प्रयास")}
                      </button>
                    ) : null}
                    <Link to="/payout/history" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]">
                      {selectLabel(languageMode, "View payout history", "भुगतान इतिहास देखें")}
                    </Link>
                    <button type="button" onClick={handleClear} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]">
                      {selectLabel(languageMode, "Clear receipt", "रसीद हटाएं")}
                    </button>
                  </div>
                </AppSurface>
              )}
            </>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}

export default PayoutPage;

