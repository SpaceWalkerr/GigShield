import { useCallback, useRef, useState } from "react";
import { supabase } from "../utils/supabase";

export const TOTAL_STEPS = 5;

export function useVerificationFlow() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
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
    setStep(5);
  }, []);

  return {
    step,
    formData,
    isLoading,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    completeFlow,
  };
}
