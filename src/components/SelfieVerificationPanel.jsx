import { useEffect, useRef, useState } from "react";
import Card from "./Card";
import { selectLabel } from "../utils/i18n";

function formatRelativeTime(isoDate) {
  if (!isoDate) {
    return "Not verified";
  }

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hr ago`;
}

function SelfieVerificationPanel({
  requiresVerification,
  verificationState,
  onGenerateChallenge,
  onApproveVerification,
  onResetVerification,
  isEasyMode,
  languageMode,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState("");
  const [streamRef, setStreamRef] = useState(null);

  useEffect(() => {
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamRef]);

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStreamRef(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera permission to continue.");
    }
  };

  const stopCamera = () => {
    if (streamRef) {
      streamRef.getTracks().forEach((track) => track.stop());
    }
    setStreamRef(null);
    setCameraEnabled(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedSelfie(canvas.toDataURL("image/png"));
  };

  const isVerified = verificationState.status === "verified";

  return (
    <Card
      languageMode={languageMode}
      title={
        isEasyMode
          ? selectLabel(languageMode, "Selfie Check", "Selfie jaanch")
          : selectLabel(languageMode, "Selfie Gesture Verification", "Selfie gesture jaanch")
      }
      subtitle={
        isEasyMode
          ? selectLabel(
              languageMode,
              "Simple face + gesture check before high-risk payout",
              "High-risk payout se pehle seedhi selfie jaanch",
            )
          : selectLabel(
              languageMode,
              "Random challenge to reduce GPS spoofing and coordinated fraud rings",
              "Fraud rokne ke liye random challenge",
            )
      }
    >
      <div className="space-y-3 text-sm">
        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Verification Gate", "Jaanch gate")}</p>
          <p className="mt-2 font-semibold text-coal-900">
            {requiresVerification
              ? isEasyMode
                ? "High risk found. Complete selfie check to get payout."
                : "High-risk profile detected. Gesture selfie is mandatory before payout."
              : isEasyMode
                ? "Risk is normal. Selfie check is optional right now."
                : "Risk profile is normal. Selfie verification is currently optional."}
          </p>
        </div>

        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Current Challenge", "Abhi ka challenge")}</p>
          <p className="mt-2 font-semibold text-coal-900">
            {verificationState.gesture || (isEasyMode ? "Tap new gesture to start" : "Generate a random gesture to begin.")}
          </p>
          <p className="mt-1 text-xs text-coal-600">
            {selectLabel(languageMode, "Last successful verification", "Aakhri safal jaanch")}: {formatRelativeTime(verificationState.verifiedAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateChallenge}
              className="secondary-btn"
            >
              {isEasyMode
                ? selectLabel(languageMode, "New Gesture", "Naya gesture")
                : selectLabel(languageMode, "New Random Gesture", "Naya random gesture")}
            </button>
            <button
              type="button"
              onClick={onResetVerification}
              className="secondary-btn"
            >
              {isEasyMode
                ? selectLabel(languageMode, "Clear", "Saaf karein")
                : selectLabel(languageMode, "Reset", "Reset")}
            </button>
          </div>
        </div>

        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Selfie Capture", "Selfie lena")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!cameraEnabled ? (
              <button type="button" onClick={startCamera} className="primary-btn">
                {isEasyMode
                  ? selectLabel(languageMode, "Start Camera", "Camera chalu")
                  : selectLabel(languageMode, "Enable Camera", "Camera on karein")}
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="secondary-btn">
                {isEasyMode
                  ? selectLabel(languageMode, "Stop Camera", "Camera band")
                  : selectLabel(languageMode, "Stop Camera", "Camera band karein")}
              </button>
            )}
            <button
              type="button"
              onClick={captureSelfie}
              disabled={!cameraEnabled}
              className="secondary-btn"
            >
              {isEasyMode
                ? selectLabel(languageMode, "Take Selfie", "Selfie lein")
                : selectLabel(languageMode, "Capture Selfie", "Selfie capture karein")}
            </button>
          </div>

          {cameraError ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {cameraError}
            </p>
          ) : null}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`mt-3 w-full rounded-lg border border-coal-200 bg-coal-100 ${
              cameraEnabled ? "block" : "hidden"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {capturedSelfie ? (
            <div className="mt-3">
              <img
                src={capturedSelfie}
                alt="Verification selfie preview"
                className="w-full rounded-lg border border-coal-200"
              />
              <button
                type="button"
                onClick={() => onApproveVerification(capturedSelfie)}
                className="primary-btn mt-3"
              >
                {isEasyMode
                  ? selectLabel(languageMode, "Approve and Continue", "Manzoor karke aage badhein")
                  : selectLabel(languageMode, "Approve Gesture Verification", "Gesture jaanch manzoor")}
              </button>
            </div>
          ) : null}
        </div>

        {isVerified ? (
          <p className="rounded-lg border border-moss-200 bg-moss-50 px-3 py-2 text-xs font-semibold text-moss-600">
            {isEasyMode
              ? "Verified. High-risk payout is now unlocked for a short time."
              : "Verification is active. High-risk payouts are unlocked for the current session window."}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export default SelfieVerificationPanel;
