import { useRef, useState, useEffect } from "react";

export default function StepRiderProof({ formData, updateField, onNext }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState("idle"); // "idle" | "verifying" | "success"

  useEffect(() => {
    // Reset status if file is removed
    if (!formData.riderProof) {
      setStatus("idle");
    }
  }, [formData.riderProof]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    updateField("riderProof", file);
    const reader = new FileReader();
    reader.onloadend = () => updateField("riderProofPreview", reader.result);
    reader.readAsDataURL(file);
    setStatus("idle");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleContinue = () => {
    if (status === "idle") {
      setStatus("verifying");
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => {
          onNext();
        }, 1200);
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <style>
        {`
          @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan-line {
            animation: scanLine 2s linear infinite;
          }
        `}
      </style>
      <div>
        <p className="kicker mb-1">Step 5 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Upload rider proof</h2>
        <p className="mt-2 text-coal-500 text-sm">Upload a screenshot of your delivery profile or dashboard</p>
      </div>

      {!formData.riderProofPreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileRef.current?.click()}
          className="board-soft cursor-pointer rounded-2xl border-2 border-dashed border-coal-300 p-10 text-center hover:border-electric-500 hover:bg-electric-50 transition-all duration-200 group"
        >
          <div className="mb-4 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-coal-100 group-hover:bg-electric-100 flex items-center justify-center transition-colors">
              <svg className="w-7 h-7 text-coal-500 group-hover:text-electric-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
          </div>
          <p className="font-semibold text-coal-700 group-hover:text-electric-600 transition-colors">
            Click to upload or drag & drop
          </p>
          <p className="mt-1 text-xs text-coal-400">PNG, JPG, WEBP up to 10MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-coal-200 shadow-chip">
          <img src={formData.riderProofPreview} alt="Rider proof preview" className={`w-full max-h-56 object-cover transition-all duration-500 ${status === 'verifying' ? 'blur-sm brightness-75' : ''}`} />
          
          {status === "verifying" && (
            <>
              {/* Scan overlay */}
              <div className="absolute inset-0 bg-electric-900/20 mix-blend-color-burn" />
              {/* Animated scan line */}
              <div className="absolute left-0 right-0 h-1 bg-electric-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-enter">
                <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-electric-400 border-solid animate-spin mb-3"></div>
                <p className="text-white font-semibold text-sm tracking-wider uppercase drop-shadow-md">AI Analyzing</p>
                <p className="text-white/90 text-xs mt-1 drop-shadow-md font-medium">Verifying platform profile...</p>
              </div>
            </>
          )}

          {status === "success" && (
            <div className="absolute inset-0 bg-moss-900/80 flex flex-col items-center justify-center z-10 animate-enter backdrop-blur-[2px]">
              <div className="h-16 w-16 mb-2 rounded-full bg-moss-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg tracking-wide drop-shadow-md">Verification Complete</p>
              <p className="text-moss-100 text-xs mt-1">Profile matched with input data.</p>
            </div>
          )}

          {status === "idle" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-coal-900/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-white text-xs font-semibold truncate">{formData.riderProof?.name}</span>
                <button
                  type="button"
                  onClick={() => { updateField("riderProof", null); updateField("riderProofPreview", null); setStatus("idle"); }}
                  className="ml-2 rounded-full bg-white/20 px-3 py-1 text-white text-xs font-semibold hover:bg-white/30 transition shadow-sm backdrop-blur-md"
                >
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {status === "idle" && (
        <div className="rounded-xl bg-coal-50 border border-coal-200 px-4 py-3 text-xs text-coal-500">
          <span className="font-semibold text-coal-700">Examples:</span> Swiggy profile screenshot, Zomato rider dashboard, account screen
        </div>
      )}

      <button
        type="button"
        disabled={!formData.riderProof || status !== "idle"}
        onClick={handleContinue}
        className="primary-btn w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all relative overflow-hidden"
      >
        {status === "verifying" ? (
          "Verifying Document..."
        ) : status === "success" ? (
          "Verified Request"
        ) : formData.riderProof ? (
          "Verify & Continue →"
        ) : (
          "Upload a screenshot to continue"
        )}
      </button>

      {status === "idle" && (
        <button
          type="button"
          onClick={onNext}
          className="text-xs text-coal-400 hover:text-coal-600 transition text-center underline underline-offset-2"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
