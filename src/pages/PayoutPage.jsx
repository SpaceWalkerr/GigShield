import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import SelfieVerificationPanel from "../components/SelfieVerificationPanel";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getPayoutReceipt, savePayoutReceipt, clearPayoutReceipt } from "../utils/payoutReceipt";

function getStatusStyles(status) {
  const styles = {
    paid: "border-moss-300 bg-moss-50 text-coal-900",
    capped: "border-signal-600 bg-signal-50 text-coal-900",
    "blocked-cap": "border-red-300 bg-red-50 text-red-800",
    "blocked-coverage": "border-red-300 bg-red-50 text-red-800",
    "blocked-verification": "border-red-300 bg-red-50 text-red-800",
    "invalid-trigger": "border-red-300 bg-red-50 text-red-800",
  };

  return styles[status] || "border-coal-200 bg-white text-coal-900";
}

function PayoutPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [receiptState, setReceiptState] = useState(() => getPayoutReceipt());
  const [verificationState, setVerificationState] = useState({
    status: "idle",
    gesture: "",
    gestureKey: "",
    issuedAt: "",
    verifiedAt: "",
    evidence: null,
  });

  const receipt = receiptState;

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
    setVerificationState((current) => ({
      ...current,
      status: "verified",
      verifiedAt: new Date().toISOString(),
      evidence: evidence ?? null,
    }));
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
  };

  const selfieVerified = verificationState.status === "verified";

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
    return selfieVerified;
  }, [receipt, selfieVerified]);

  const handleReceive = () => {
    if (!receipt || !canReceive) {
      return;
    }

    const next = {
      ...receipt,
      receivedAt: new Date().toISOString(),
      receivedWithVerification: verificationState.evidence ?? null,
    };

    savePayoutReceipt(next);
    setReceiptState(next);
  };

  const handleClear = () => {
    clearPayoutReceipt();
    setReceiptState(null);
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
              <SelfieVerificationPanel
                requiresVerification
                verificationState={verificationState}
                onGenerateChallenge={handleGenerateChallenge}
                onApproveVerification={handleApproveVerification}
                onResetVerification={handleResetVerification}
                languageMode={languageMode}
              />

              {!selfieVerified && (receipt.status === "paid" || receipt.status === "capped") ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {selectLabel(
                    languageMode,
                    "Selfie verification required before receiving payout.",
                    "भुगतान प्राप्त करने से पहले सेल्फी सत्यापन ज़रूरी है।",
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
                  <button type="button" onClick={handleReceive} disabled={!canReceive} className="primary-btn">
                    {selectLabel(languageMode, "Receive payout", "भुगतान प्राप्त करें")}
                  </button>
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
