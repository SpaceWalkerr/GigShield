import { useEffect, useRef, useState } from "react";
import Card from "./Card";
import { selectLabel } from "../utils/i18n";
import { getCurrentLocation, getCurrentWeather } from "../utils/selfieVerification";

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
  languageMode,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState("");
  const [streamRef, setStreamRef] = useState(null);

  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [evidence, setEvidence] = useState(null);

  const requiredHandHoldMs = 3000;
  const [handHoldMs, setHandHoldMs] = useState(0);
  const [handHoldSatisfied, setHandHoldSatisfied] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState("");
  const handHoldSatisfiedRef = useRef(false);
  const handHoldStartRef = useRef(0);
  const detectionRafRef = useRef(0);
  const handLandmarkerRef = useRef(null);
  const handLandmarkerInitRef = useRef(null);
  const [handDetectorError, setHandDetectorError] = useState("");

  const recentGesturesRef = useRef([]);
  const recentMaxFrames = 15;

  const waveStateRef = useRef({
    centerXHistory: [],
    direction: 0,
    flips: 0,
    lastCenterX: null,
    satisfied: false,
  });

  const scaleMotionRef = useRef({
    scaleHistory: [],
    satisfiedCloser: false,
    satisfiedFarther: false,
    lastScale: null,
  });

  useEffect(() => {
    handHoldSatisfiedRef.current = handHoldSatisfied;
  }, [handHoldSatisfied]);

  useEffect(() => {
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach((track) => track.stop());
      }

      if (detectionRafRef.current) {
        cancelAnimationFrame(detectionRafRef.current);
      }
    };
  }, [streamRef]);

  useEffect(() => {
    if (verificationState.status === "idle") {
      setCapturedSelfie("");
      setEvidence(null);
      setVerificationError("");
      setHandHoldMs(0);
      setHandHoldSatisfied(false);
      setDetectedGesture("");
      setHandDetectorError("");
      handHoldStartRef.current = 0;

      recentGesturesRef.current = [];
      waveStateRef.current = {
        centerXHistory: [],
        direction: 0,
        flips: 0,
        lastCenterX: null,
        satisfied: false,
      };
      scaleMotionRef.current = {
        scaleHistory: [],
        satisfiedCloser: false,
        satisfiedFarther: false,
        lastScale: null,
      };
    }
  }, [verificationState.status]);

  const isFingerExtended = (landmarks, tipIndex, pipIndex) => {
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];
    if (!tip || !pip) {
      return false;
    }

    // y axis grows downwards; extended finger tips are generally "higher" (smaller y).
    return tip.y < pip.y - 0.02;
  };

  const distance = (a, b) => {
    if (!a || !b) {
      return 0;
    }
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z ?? 0) - (b.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const majorityMatch = (items, expectedKey) => {
    if (!expectedKey) {
      return false;
    }
    if (!items.length) {
      return false;
    }
    const hits = items.filter((item) => item === expectedKey).length;
    return hits / items.length >= 0.75;
  };

  const getPalmScale = (landmarks) => {
    const wrist = landmarks?.[0];
    const middleMcp = landmarks?.[9];
    return Math.max(0.0001, distance(wrist, middleMcp));
  };

  const getHandCenterX = (landmarks) => {
    if (!Array.isArray(landmarks) || landmarks.length === 0) {
      return null;
    }
    let sum = 0;
    for (const lm of landmarks) {
      sum += lm.x;
    }
    return sum / landmarks.length;
  };

  const updateWaveState = (centerX, palmScale) => {
    const state = waveStateRef.current;
    if (centerX == null) {
      return state;
    }

    state.centerXHistory.push(centerX);
    if (state.centerXHistory.length > 40) {
      state.centerXHistory.shift();
    }

    const last = state.lastCenterX;
    state.lastCenterX = centerX;

    if (last == null) {
      return state;
    }

    const dx = centerX - last;
    const threshold = 0.08 * (palmScale > 0 ? 1 : 1);

    if (Math.abs(dx) < threshold) {
      return state;
    }

    const direction = dx > 0 ? 1 : -1;
    if (state.direction === 0) {
      state.direction = direction;
      return state;
    }

    if (direction !== state.direction) {
      state.flips += 1;
      state.direction = direction;
      if (state.flips >= 4) {
        state.satisfied = true;
      }
    }

    return state;
  };

  const updateScaleMotionState = (palmScale) => {
    const state = scaleMotionRef.current;
    if (!palmScale) {
      return state;
    }

    state.scaleHistory.push(palmScale);
    if (state.scaleHistory.length > 40) {
      state.scaleHistory.shift();
    }

    const first = state.scaleHistory[0];
    const last = state.scaleHistory[state.scaleHistory.length - 1];
    const delta = last - first;
    const threshold = 0.18 * first;

    if (delta > threshold) {
      state.satisfiedCloser = true;
    }
    if (delta < -threshold) {
      state.satisfiedFarther = true;
    }

    return state;
  };

  const classifyGestureFromLandmarks = (landmarks) => {
    // Landmarks are normalized [0..1] in image space.
    const indexExtended = isFingerExtended(landmarks, 8, 6);
    const middleExtended = isFingerExtended(landmarks, 12, 10);
    const ringExtended = isFingerExtended(landmarks, 16, 14);
    const pinkyExtended = isFingerExtended(landmarks, 20, 18);

    // Thumb: use a looser heuristic since x-direction depends on handedness.
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const scale = Math.max(0.0001, distance(wrist, middleMcp));
    const thumbExtended = distance(thumbTip, wrist) > distance(thumbMcp, wrist) + 0.12 * scale;

    const thumbUp = thumbTip?.y < thumbMcp?.y - 0.05;

    // OK sign: thumb tip and index tip close.
    const okDistance = distance(thumbTip, landmarks[8]);
    const isOk = okDistance > 0 && okDistance < 0.22 * scale;

    const extendedCount = [
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    ].filter(Boolean).length;

    const openPalmLike = indexExtended && middleExtended && ringExtended && pinkyExtended;
    const fistLike = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

    // Confidence scores (0..1) based on how strongly we fit a pattern.
    // These are deliberately simple and conservative.
    const confidence = {
      open_palm: openPalmLike ? (thumbExtended ? 1 : 0.85) : 0,
      fist: fistLike ? 1 : 0,
      peace: indexExtended && middleExtended && !ringExtended && !pinkyExtended ? 1 : 0,
      point_up: indexExtended && !middleExtended && !ringExtended && !pinkyExtended ? 1 : 0,
      thumbs_up:
        thumbExtended && thumbUp && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended ? 1 : 0,
      ok: isOk && middleExtended && ringExtended && pinkyExtended ? 1 : isOk ? 0.8 : 0,
      three: indexExtended && middleExtended && ringExtended && !pinkyExtended ? 0.9 : 0,
      four: indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended ? 0.9 : 0,
    };

    const best = Object.entries(confidence)
      .sort((a, b) => b[1] - a[1])
      .find(([, score]) => score > 0);

    if (best) {
      const [key, score] = best;
      const labelMap = {
        open_palm: "Open palm",
        fist: "Fist",
        peace: "Peace",
        point_up: "Point up",
        thumbs_up: "Thumbs up",
        ok: "OK",
        three: "Three",
        four: "Four",
      };
      return { key, label: labelMap[key] ?? "Unknown", score };
    }

    // Fallbacks for ambiguous hands.
    if (extendedCount >= 4) {
      return { key: "open_palm", label: "Open palm", score: 0.6 };
    }
    if (extendedCount === 0) {
      return { key: "fist", label: "Fist", score: 0.6 };
    }
    return { key: "unknown", label: "Unknown", score: 0 };
  };

  const getHandednessLabel = (result, handIndex) => {
    const candidates = [
      result?.handedness,
      result?.handednesses,
      result?.handednesses?.[handIndex],
      result?.handedness?.[handIndex],
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const entry = candidate[handIndex] ?? candidate[0];
        const category = Array.isArray(entry) ? entry[0] : entry?.[0] ?? entry;
        const name = category?.categoryName ?? category?.displayName ?? category?.label;
        if (typeof name === "string" && name) {
          return name;
        }
      }
    }

    return "";
  };

  const stopDetectionLoop = ({ reset = true } = {}) => {
    if (detectionRafRef.current) {
      cancelAnimationFrame(detectionRafRef.current);
      detectionRafRef.current = 0;
    }
    handHoldStartRef.current = 0;

    if (reset) {
      setHandHoldMs(0);
      setHandHoldSatisfied(false);
    }
  };

  const ensureHandLandmarker = async () => {
    if (handLandmarkerRef.current) {
      return handLandmarkerRef.current;
    }

    if (!handLandmarkerInitRef.current) {
      handLandmarkerInitRef.current = (async () => {
        const { FilesetResolver, HandLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        const vision = await FilesetResolver.forVisionTasks(
          "/mediapipe/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "/mediapipe/models/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        handLandmarkerRef.current = handLandmarker;
        return handLandmarker;
      })();
    }

    return handLandmarkerInitRef.current;
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      setVerificationError("");
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
    stopDetectionLoop({ reset: true });
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

  const startDetectionLoop = async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      setHandDetectorError("");
      const handLandmarker = await ensureHandLandmarker();
      const video = videoRef.current;

      const tick = () => {
        if (!cameraEnabled || verificationState.status !== "pending") {
          stopDetectionLoop();
          return;
        }

        if (!video || video.readyState < 2) {
          detectionRafRef.current = requestAnimationFrame(tick);
          return;
        }

        const now = performance.now();
        const result = handLandmarker.detectForVideo(video, now);
        const handsCount = result?.landmarks?.length ?? 0;
        const expectedKey = verificationState.gestureKey || "";

        let matchFound = false;
        let detectedLabel = "";

        // Special: if we somehow have no gestureKey (older state), treat it as "any hand".
        const anyHandMode = !expectedKey;

        if (handsCount > 0) {
          if (expectedKey === "both_hands") {
            matchFound = handsCount >= 2;
            detectedLabel = handsCount >= 2 ? "Both hands" : "One hand";
          } else if (expectedKey === "wave") {
            const primary = result.landmarks[0];
            const centerX = getHandCenterX(primary);
            const palmScale = getPalmScale(primary);
            updateWaveState(centerX, palmScale);
            matchFound = waveStateRef.current.satisfied;
            detectedLabel = waveStateRef.current.satisfied ? "Wave" : "Waving...";
          } else if (expectedKey === "move_closer" || expectedKey === "move_farther") {
            const primary = result.landmarks[0];
            const palmScale = getPalmScale(primary);
            updateScaleMotionState(palmScale);
            matchFound =
              expectedKey === "move_closer"
                ? scaleMotionRef.current.satisfiedCloser
                : scaleMotionRef.current.satisfiedFarther;
            detectedLabel = expectedKey === "move_closer" ? "Moving closer..." : "Moving farther...";
          } else {
            for (let i = 0; i < handsCount; i += 1) {
              const landmarks = result.landmarks[i];
              if (!landmarks) {
                continue;
              }

              const classified = classifyGestureFromLandmarks(landmarks);
              const handedness = getHandednessLabel(result, i);
              const labelSuffix = handedness ? ` (${handedness})` : "";

              // Only accept strong-enough classifications.
              const strongEnough = (classified.score ?? 0) >= 0.8;
              detectedLabel = `${classified.label}${labelSuffix}`;

              if (anyHandMode) {
                matchFound = true;
                break;
              }

              if (strongEnough && classified.key === expectedKey) {
                matchFound = true;
                break;
              }
            }
          }
        }

        setDetectedGesture(detectedLabel);

        // Temporal smoothing: keep a short history of what we matched (or empty).
        if (!anyHandMode && expectedKey && expectedKey !== "both_hands" && expectedKey !== "wave" && expectedKey !== "move_closer" && expectedKey !== "move_farther") {
          const history = recentGesturesRef.current;
          history.push(matchFound ? expectedKey : "");
          if (history.length > recentMaxFrames) {
            history.shift();
          }
          // Require stable majority before we start the timer.
          matchFound = majorityMatch(history, expectedKey);
        }

        if (matchFound) {
          if (!handHoldStartRef.current) {
            handHoldStartRef.current = now;
          }

          const heldMs = Math.max(0, now - handHoldStartRef.current);
          const nextProgress = Math.min(requiredHandHoldMs, Math.floor(heldMs));
          setHandHoldMs(nextProgress);

          if (heldMs >= requiredHandHoldMs) {
            setHandHoldSatisfied(true);
            if (!capturedSelfie) {
              captureSelfie();
            }
            stopDetectionLoop({ reset: false });
            return;
          }
        } else {
          handHoldStartRef.current = 0;
          setHandHoldMs(0);
          setHandHoldSatisfied(false);
        }

        detectionRafRef.current = requestAnimationFrame(tick);
      };

      stopDetectionLoop({ reset: true });
      detectionRafRef.current = requestAnimationFrame(tick);
    } catch {
      setHandDetectorError("Hand detection unavailable in this browser.");
    }
  };

  useEffect(() => {
    if (!cameraEnabled) {
      stopDetectionLoop({ reset: true });
      return;
    }

    if (verificationState.status !== "pending") {
      stopDetectionLoop({ reset: true });
      return;
    }

    startDetectionLoop();

    return () => {
      stopDetectionLoop({ reset: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraEnabled, verificationState.status]);

  const handleVerifyAndApprove = async () => {
    setVerificationError("");

    if (verificationState.status !== "pending") {
      setVerificationError("Tap new gesture to start verification.");
      return;
    }

    if (!capturedSelfie) {
      setVerificationError("Take a selfie first.");
      return;
    }

    if (!handHoldSatisfiedRef.current) {
      setVerificationError("Match the requested gesture for 3 seconds to verify.");
      return;
    }

    setVerifying(true);

    const locationResult = await getCurrentLocation();
    let weatherResult = { ok: false, error: "", weather: null };

    if (locationResult.ok && locationResult.coords) {
      weatherResult = await getCurrentWeather({
        lat: locationResult.coords.lat,
        lon: locationResult.coords.lon,
      });
    }

    const nextEvidence = {
      gesture: verificationState.gesture,
      gestureKey: verificationState.gestureKey,
      detectedGesture,
      handHoldMs: requiredHandHoldMs,
      selfieDataUrl: capturedSelfie,
      location: locationResult.coords,
      locationError: locationResult.ok ? "" : locationResult.error,
      weather: weatherResult.weather,
      weatherError: weatherResult.ok ? "" : weatherResult.error,
      verifiedClientAt: new Date().toISOString(),
    };

    setEvidence(nextEvidence);
    onApproveVerification(nextEvidence);
    setVerifying(false);
    stopCamera();
  };
  const isVerified = verificationState.status === "verified";
  const isPending = verificationState.status === "pending";
  const handHoldSeconds = Math.ceil((requiredHandHoldMs - handHoldMs) / 1000);

  return (
    <Card
      icon="camera"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Selfie Check", "सेल्फी जांच")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Hand-hold selfie verification before high-risk payout",
          "उच्च जोखिम भुगतान से पहले सरल सेल्फी जांच",
        )
      }
    >
      <div className="space-y-3 text-sm">
        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Verification Gate", "जांच गेट")}</p>
          <p className="mt-2 font-semibold text-coal-900">
            {requiresVerification
              ? "High risk found. Complete selfie check to get payout."
              : "Risk is normal. Selfie check is optional right now."}
          </p>
        </div>

        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Current Challenge", "मौजूदा चुनौती")}</p>
          <p className="mt-2 font-semibold text-coal-900">
            {verificationState.gesture || "Tap new gesture to start"}
          </p>
          {isPending ? (
            <p className="mt-1 text-xs text-coal-600">
              {handHoldSatisfied
                ? "Gesture verified. You can approve now."
                : `Hold the requested gesture (${Math.max(1, handHoldSeconds)}s remaining).`}
            </p>
          ) : null}
          {isPending && detectedGesture ? (
            <p className="mt-1 text-xs text-coal-600">
              Detected: <span className="font-semibold text-coal-900">{detectedGesture}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-coal-600">
            {selectLabel(languageMode, "Last successful verification", "आखिरी सफल जांच")}: {formatRelativeTime(verificationState.verifiedAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateChallenge}
              className="secondary-btn"
            >
              {selectLabel(languageMode, "New Gesture", "नया जेस्चर")}
            </button>
            <button
              type="button"
              onClick={onResetVerification}
              className="secondary-btn"
            >
              {selectLabel(languageMode, "Clear", "साफ करें")}
            </button>
          </div>
        </div>

        <div className="board-soft p-3">
          <p className="kicker">{selectLabel(languageMode, "Selfie Capture", "सेल्फी लें")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!cameraEnabled ? (
              <button type="button" onClick={startCamera} className="primary-btn">
                {selectLabel(languageMode, "Start Camera", "कैमरा चालू करें")}
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="secondary-btn">
                {selectLabel(languageMode, "Stop Camera", "कैमरा बंद करें")}
              </button>
            )}
            <button
              type="button"
              onClick={captureSelfie}
              disabled={!cameraEnabled}
              className="secondary-btn"
            >
              {selectLabel(languageMode, "Take Selfie", "सेल्फी लें")}
            </button>
          </div>

          {cameraError ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {cameraError}
            </p>
          ) : null}

          {handDetectorError ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              {handDetectorError}
            </p>
          ) : null}

          {verificationError ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {verificationError}
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
                onClick={handleVerifyAndApprove}
                disabled={verifying}
                className="primary-btn mt-3"
              >
                {verifying
                  ? selectLabel(languageMode, "Verifying...", "जांच हो रही है...")
                  : selectLabel(languageMode, "Approve and Continue", "मंज़ूर करें और आगे बढ़ें")}
              </button>

              {evidence ? (
                <div className="mt-3 rounded-lg border border-coal-200 bg-white px-3 py-2 text-xs text-coal-700">
                  <p className="font-semibold text-coal-900">Verification evidence</p>
                  <p className="mt-1">Challenge: {evidence.gesture || ""}</p>
                  <p>Detected: {evidence.detectedGesture || ""}</p>
                  <p className="mt-1">
                    Hand hold: {Math.round((evidence.handHoldMs || 0) / 1000)}s
                  </p>
                  <p>
                    Location: {evidence.location ? `${evidence.location.lat.toFixed(4)}, ${evidence.location.lon.toFixed(4)}` : "Unavailable"}
                  </p>
                  <p>
                    Weather: {evidence.weather?.tempC != null ? `${evidence.weather.tempC}°C` : "N/A"},{" "}
                    {evidence.weather?.windKmph != null ? `${evidence.weather.windKmph} km/h wind` : "N/A"}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {isVerified ? (
          <p className="rounded-lg border border-moss-200 bg-moss-50 px-3 py-2 text-xs font-semibold text-moss-600">
            {"Verified. High-risk payout is now unlocked for a short time."}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export default SelfieVerificationPanel;
