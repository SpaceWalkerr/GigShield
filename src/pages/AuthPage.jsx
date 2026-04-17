import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import planDetails from "../data/planDetails.json";
import userProfile from "../data/userProfile.json";
const validPlanIds = new Set(planDetails.map((plan) => plan.id));
const selectedPlanStorageKey = "gigshieldSelectedPlanId";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const requestedPlanId = searchParams.get("plan");
    const persistedPlanId = localStorage.getItem(selectedPlanStorageKey);
    const selectedPlanId =
      (requestedPlanId && validPlanIds.has(requestedPlanId) && requestedPlanId) ||
      (persistedPlanId && validPlanIds.has(persistedPlanId) && persistedPlanId) ||
      userProfile.selectedPlanId;

    navigate(`/signin?plan=${selectedPlanId}`, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
