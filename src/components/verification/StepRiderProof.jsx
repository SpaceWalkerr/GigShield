import { useRef, useState } from "react";

export default function StepRiderProof({ formData, updateField, onNext }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState("idle"); // "idle" | "verifying" | "success"

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
        <p className="kicker mb-1">Step 3 of 4</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Upload rider proof</h2>
        <p className="mt-2 text-sm text-zinc-400">Upload a screenshot of your delivery profile or dashboard</p>
      </div>

      {!formData.riderProofPreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileRef.current?.click()}
          className="board-soft group cursor-pointer rounded-2xl border-2 border-dashed border-white/15 p-10 text-center transition-all duration-200 hover:border-cyan-300/60 hover:bg-cyan-300/5"
        >
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] transition-colors group-hover:bg-cyan-300/10">
              <svg className="h-7 w-7 text-zinc-400 transition-colors group-hover:text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
          </div>
          <p className="font-semibold text-zinc-100 transition-colors group-hover:text-cyan-200">
            Click to upload or drag & drop
          </p>
          <p className="mt-1 text-xs text-zinc-500">PNG, JPG, WEBP up to 10MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
          <img src={formData.riderProofPreview} alt="Rider proof preview" className={`w-full max-h-56 object-cover transition-all duration-500 ${status === 'verifying' ? 'blur-sm brightness-75' : ''}`} />
          
          {status === "verifying" && (
            <>
              <div className="absolute inset-0 bg-cyan-950/30 mix-blend-screen" />
              <div className="absolute left-0 right-0 h-1 animate-scan-line bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.7)]" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-enter">
                <div className="mb-3 h-12 w-12 animate-spin rounded-full border-r-2 border-t-2 border-solid border-cyan-300"></div>
                <p className="text-white font-semibold text-sm tracking-wider uppercase drop-shadow-md">AI Analyzing</p>
                <p className="text-white/90 text-xs mt-1 drop-shadow-md font-medium">Verifying platform profile...</p>
              </div>
            </>
          )}

          {status === "success" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-950/80 backdrop-blur-[2px] animate-enter">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg tracking-wide drop-shadow-md">Verification Complete</p>
              <p className="mt-1 text-xs text-emerald-100">Profile matched with input data.</p>
            </div>
          )}

          {status === "idle" && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-white text-xs font-semibold truncate">{formData.riderProof?.name}</span>
                <button
                  type="button"
                  onClick={() => { updateField("riderProof", null); updateField("riderProofPreview", null); setStatus("idle"); }}
                  className="ml-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25 shadow-sm backdrop-blur-md"
                >
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {status === "idle" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-200">Examples:</span> Swiggy profile screenshot, Zomato rider dashboard, account screen
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
          className="text-center text-xs text-zinc-500 underline underline-offset-2 transition hover:text-zinc-300"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}

