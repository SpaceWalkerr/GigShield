import { useCallback, useRef, useState } from "react";
import { supabase } from "../utils/supabase";

export const TOTAL_STEPS = 7;

export function useVerificationFlow() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    fullName: "",
    city: "",
    age: "",
    platform: "",
    riderId: "",
    vehicleType: "",
    riderProof: null,
    riderProofPreview: null,
    coverageTriggers: [],
  });

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: "+91" + formData.phone,
      });
      if (error) throw error;
      setOtpSent(true);
      startResendTimer();
      setStep(2);
    } catch (err) {
      alert("Error sending OTP: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [formData.phone, startResendTimer]);

  const resendOtp = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: "+91" + formData.phone,
      });
      if (error) throw error;
      startResendTimer();
    } catch (err) {
      alert("Error resending OTP: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [formData.phone, startResendTimer]);

  const verifyOtp = useCallback(async (otpToVerify) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: "+91" + formData.phone,
        token: otpToVerify,
        type: "sms",
      });
      if (error || !data.user) {
        throw error || new Error("Verification failed");
      }
      return true;
    } catch (err) {
      alert("OTP Verification Failed: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData.phone]);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((n) => setStep(n), []);

  const completeFlow = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setStep(7);
  }, []);

  return {
    step,
    formData,
    isLoading,
    otpSent,
    resendTimer,
    updateField,
    sendOtp,
    resendOtp,
    verifyOtp,
    nextStep,
    prevStep,
    goToStep,
    completeFlow,
  };
}
