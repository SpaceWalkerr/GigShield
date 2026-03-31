import { useState } from "react";
import { validatePhone } from "../../utils/validation";
import { supabase } from "../../utils/supabase";

export default function StepPhone({ formData, updateField, onSubmit, isLoading }) {
  const [touched, setTouched] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isValid = validatePhone(formData.phone);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in failed:", err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker mb-1">Step 1 of 7</p>
        <h2 className="hero-title text-3xl sm:text-4xl leading-tight">Start your protection</h2>
        <p className="mt-2 text-coal-500 text-sm">Verify your number to activate GigShield</p>
      </div>

      <div className="board-soft p-5 space-y-4">
        <label className="block text-sm font-semibold text-coal-700">
          Mobile Number
        </label>
        <div className="flex gap-2">
          <div className="flex items-center border border-coal-300 bg-white rounded-xl px-3 py-2.5 text-sm font-semibold text-coal-700 select-none">
            🇮🇳 +91
          </div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={formData.phone}
            onChange={(e) => {
              updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
              setTouched(true);
            }}
            placeholder="Enter 10-digit number"
            className={`flex-1 rounded-xl border px-4 py-2.5 text-coal-900 text-sm outline-none transition focus:ring-2 focus:ring-electric-500 ${
              touched && !isValid && formData.phone.length > 0
                ? "border-red-400 bg-red-50"
                : "border-coal-300 bg-white"
            }`}
          />
        </div>
        {touched && !isValid && formData.phone.length > 0 && (
          <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit Indian mobile number</p>
        )}
      </div>

      <div className="rounded-xl bg-signal-50 border border-signal-100 px-4 py-3 text-xs text-coal-600">
        🔒 We'll send a one-time password to verify your identity. No spam, ever.
      </div>

      <button
        type="button"
        disabled={!isValid || isLoading || googleLoading}
        onClick={onSubmit}
        className="primary-btn w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isLoading && !googleLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending OTP…
          </span>
        ) : (
          "Send OTP →"
        )}
      </button>

      {/* Google OAuth divider */}
      <div className="relative mt-2 mb-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-coal-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-coal-500 font-medium">
            or continue with
          </span>
        </div>
      </div>

      {/* Google Sign-In button */}
      <button
        type="button"
        disabled={isLoading || googleLoading}
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-coal-300 bg-white px-4 py-3 text-sm font-semibold text-coal-700 shadow-chip transition hover:bg-coal-50 hover:shadow-none disabled:opacity-50"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-coal-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? "Connecting..." : "Google Login / Signup"}
      </button>
    </div>
  );
}
