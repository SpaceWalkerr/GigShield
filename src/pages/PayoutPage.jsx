import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import SelfieVerificationPanel from "../components/SelfieVerificationPanel";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getAuthToken, getSession } from "../utils/session";
import userProfile from "../data/userProfile.json";
import { runPayoutSecurityChecks } from "../utils/payoutSecurity";
import { pushNotification } from "../utils/notifications";
import { trackEvent } from "../utils/observability";
import {
  clearPayoutReceipt,
  getFailureReasonLabel,
  getPayoutReceipt,
  payoutFailureReasonCodes,
  savePayoutReceipt,
  transitionPayoutLifecycle,
} from "../utils/payoutReceipt";

const lifecycleFlow = [
  "pending-verification",
  "verified",
  "processing",
  "settled",
  "failed",
];

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

function PayoutPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const session = getSession();
  const strictTokenDefault = import.meta.env.VITE_STRICT_TOKEN_ENFORCEMENT === "true";
  const workerCity = session?.city || userProfile.city;
  const [strictTokenEnforcement, setStrictTokenEnforcement] = useState(() => {
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

  const receipt = receiptState;
  const strictVerificationRequired = receipt?.riskLevel === "High";
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
    if (!strictVerificationRequired) {
      return true;
    }

    return selfieVerified || isLifecycleVerified;
  }, [receipt, selfieVerified, isLifecycleVerified, strictVerificationRequired]);

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

    if (strictVerificationRequired && !(selfieVerified || isLifecycleVerified)) {
      pushNotification({
        type: "warning",
        title: "Verification needed",
        message: "Complete strict selfie + liveness checks for high-risk claims.",
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
        title: "Payout blocked",
        message: "Enable session authentication token before payout request.",
      });
      return;
    }

    const securityResult = runPayoutSecurityChecks({
      evidence: verificationState.evidence || receipt.receivedWithVerification || null,
      workerCity,
      strictVerification: strictVerificationRequired,
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
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Receive your support payout after a verified trigger.",
            "सत्यापित ट्रिगर के बाद अपना सहायता भुगतान प्राप्त करें।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">{selectLabel(languageMode, "Payout", "भुगतान")}</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "Receive money", "पैसे प्राप्त करें")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-coal-500 sm:text-base">
                {selectLabel(
                  languageMode,
                  "This page shows the latest payout calculated on your dashboard.",
                  "यह पेज डैशबोर्ड पर गणना किया गया नवीनतम भुगतान दिखाता है।",
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
              <Link to="/dashboard" className="secondary-btn">
                {selectLabel(languageMode, "Back to Dashboard", "डैशबोर्ड पर वापस")}
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          {!receipt ? (
            <section className="board-soft p-4 sm:p-5">
              <p className="kicker">{selectLabel(languageMode, "No payout yet", "अभी कोई भुगतान नहीं")}</p>
              <p className="mt-2 text-sm text-coal-600">
                {selectLabel(
                  languageMode,
                  "Go to Dashboard → tap a trigger button to generate a support payout.",
                  "डैशबोर्ड पर जाएं → भुगतान के लिए कोई ट्रिगर बटन दबाएं।",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/dashboard" className="primary-btn">
                  {selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें")}
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-coal-200 bg-white p-4 sm:p-5">
                <p className="kicker">{selectLabel(languageMode, "Payout request security", "भुगतान अनुरोध सुरक्षा")}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-coal-600">
                    {selectLabel(
                      languageMode,
                      "Optional strict mode blocks payout requests without auth token.",
                      "वैकल्पिक सख्त मोड बिना ऑथ टोकन के भुगतान अनुरोध रोकता है।",
                    )}
                  </p>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      strictTokenEnforcement ? "bg-coal-900 text-white" : "bg-coal-100 text-coal-700"
                    }`}
                    onClick={() => {
                      const next = !strictTokenEnforcement;
                      setStrictTokenEnforcement(next);
                      localStorage.setItem("gigshieldStrictTokenEnforced", next ? "true" : "false");
                    }}
                  >
                    {strictTokenEnforcement
                      ? selectLabel(languageMode, "Strict token mode: ON", "सख्त टोकन मोड: चालू")
                      : selectLabel(languageMode, "Strict token mode: OFF", "सख्त टोकन मोड: बंद")}
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-coal-200 bg-white p-4 sm:p-5">
                <p className="kicker">{selectLabel(languageMode, "Payout Lifecycle", "भुगतान जीवनचक्र")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lifecycleFlow.map((step) => {
                    const active = receipt.lifecycleStatus === step;
                    const settled = receipt.lifecycleStatus === "settled";
                    const stepReached =
                      settled && step !== "failed"
                        ? lifecycleFlow.indexOf(step) <= lifecycleFlow.indexOf("settled")
                        : step === receipt.lifecycleStatus;

                    return (
                      <span
                        key={step}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          active
                            ? "border-coal-900 bg-coal-900 text-white"
                            : stepReached
                              ? "border-moss-300 bg-moss-50 text-moss-700"
                              : "border-coal-200 bg-coal-50 text-coal-600"
                        }`}
                      >
                        {getLifecycleLabel(languageMode, step)}
                      </span>
                    );
                  })}
                </div>
              </section>

              <SelfieVerificationPanel
                requiresVerification={strictVerificationRequired}
                verificationState={verificationState}
                onGenerateChallenge={handleGenerateChallenge}
                onApproveVerification={handleApproveVerification}
                onResetVerification={handleResetVerification}
                languageMode={languageMode}
              />

              {!(selfieVerified || isLifecycleVerified) &&
              strictVerificationRequired &&
              (receipt.status === "paid" || receipt.status === "capped") ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {selectLabel(
                    languageMode,
                    "Complete selfie verification to receive payout.",
                    "भुगतान पाने के लिए सेल्फी सत्यापन पूरा करें।",
                  )}
                </p>
              ) : null}

              {!strictVerificationRequired ? (
                <p className="rounded-lg border border-moss-200 bg-moss-50 px-3 py-2 text-xs font-semibold text-moss-700">
                  {selectLabel(
                    languageMode,
                    "Low/Medium risk fast path: strict verification is not required.",
                    "लो/मीडियम जोखिम फास्ट पाथ: सख्त सत्यापन आवश्यक नहीं।",
                  )}
                </p>
              ) : null}

              <section className={`rounded-xl border p-4 sm:p-5 ${getStatusStyles(receipt.status)}`}>
                <p className="kicker">{selectLabel(languageMode, "Latest payout receipt", "नवीनतम भुगतान रसीद")}</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-coal-500">
                      {selectLabel(languageMode, "Amount", "राशि")}
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {formatCurrency(receipt.payoutAmount ?? 0)}
                    </p>
                    <p className="mt-1 text-sm text-coal-600">{receipt.reason}</p>
                  </div>

                  <div className="rounded-lg border border-coal-200 bg-white/60 px-3 py-2 text-xs text-coal-700">
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
                      <p className="mt-1 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
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
                    className="primary-btn"
                  >
                    {isProcessing
                      ? selectLabel(languageMode, "Processing...", "प्रोसेसिंग...")
                      : selectLabel(languageMode, "Receive payout", "भुगतान प्राप्त करें")}
                  </button>
                  {receipt.receivedAt ? (
                    <Link to="/payout/received" className="secondary-btn">
                      {selectLabel(languageMode, "Open received page", "प्राप्त पेज खोलें")}
                    </Link>
                  ) : null}
                  {canRetry ? (
                    <button type="button" onClick={handleRetryFailedPayout} className="secondary-btn">
                      {selectLabel(languageMode, "Retry failed payout", "विफल भुगतान पुनः प्रयास")}
                    </button>
                  ) : null}
                  <Link to="/payout/history" className="secondary-btn">
                    {selectLabel(languageMode, "View payout history", "भुगतान इतिहास देखें")}
                  </Link>
                  <button type="button" onClick={handleClear} className="secondary-btn">
                    {selectLabel(languageMode, "Clear receipt", "रसीद हटाएं")}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default PayoutPage;
