import { useCallback, useState } from "react";
import { syncOnboardingToBackend } from "../services/backend/onboardingService";

export const TOTAL_STEPS = 5;
const selectedPlanStorageKey = "gigshieldSelectedPlanId";

export function useVerificationFlow() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    city: "",
    age: "",
    workPattern: "peak_hours",
    weeklyEarningsBand: "6000_10000",
    platform: "",
    riderId: "",
    vehicleType: "",
    riderProof: null,
    riderProofPreview: null,
    preferredZones: [],
    coverageTriggers: [],
    selectedPlanId: "standard",
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
    if (formData.selectedPlanId) {
      localStorage.setItem(selectedPlanStorageKey, formData.selectedPlanId);
    }
    await syncOnboardingToBackend(formData);
    setIsLoading(false);
    setStep(5);
  }, [formData]);

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

