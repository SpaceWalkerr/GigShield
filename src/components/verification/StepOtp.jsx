import { useEffect, useRef, useState } from "react";

export default function StepOtp({ formData, updateField, phone, onVerify, onResend, resendTimer, isLoading }) {
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setError(null);
    const otp = newDigits.join("");
    updateField("otp", otp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setOtpDigits(newDigits);
    updateField("otp", newDigits.join(""));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    const success = await onVerify(otp);
    if (!success) {
      setError("Invalid OTP. Please try again.");
      setOtpDigits(["", "", "", "", "", ""]);
      updateField("otp", "");
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 2 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Verify your number</h2>
        <p className="mt-2 text-coal-500 text-sm">
          Enter the 6-digit code sent to <span className="font-semibold text-coal-700">+91 {phone}</span>
        </p>
      </div>

      <div className="board-soft p-5">
        <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border-2 outline-none transition focus:border-electric-500 focus:ring-2 focus:ring-electric-100 ${
                digit ? "border-electric-500 bg-electric-50 text-electric-600" : "border-coal-200 bg-white text-coal-900"
              } ${error ? "border-red-400 bg-red-50" : ""}`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-3 text-red-500 text-xs">{error}</p>
        )}

        <div className="mt-4 flex items-center justify-end">
          {resendTimer > 0 ? (
            <p className="text-xs text-coal-500">Resend in <span className="font-semibold text-coal-700">{resendTimer}s</span></p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={isLoading}
              className="text-xs font-semibold text-electric-500 hover:text-electric-600 transition"
            >
              {isLoading ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={otpDigits.join("").length < 6 || isLoading}
        onClick={handleVerify}
        className="primary-btn w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying…
          </span>
        ) : (
          "Verify & Continue →"
        )}
      </button>
    </div>
  );
}
