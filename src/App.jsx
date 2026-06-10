import React, { lazy, Suspense, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationStack from "./components/NotificationStack";
import Navbar from "./components/Navbar";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHydratedSession } from "./hooks/useHydratedSession";
import { getRouterBasename } from "./utils/authRedirect";
import { pushNotification } from "./utils/notifications";
import { fetchWorkerClaimAlerts } from "./services/backend/claimStatusService";
import {
  fetchLatestOpenPayoutCandidateFromBackend,
  fetchRecentPayoutAlertsFromBackend,
} from "./services/backend/payoutService";

gsap.registerPlugin(ScrollTrigger);

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const IncomeRadarPage = lazy(() => import("./pages/IncomeRadarPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const TriggerPage = lazy(() => import("./pages/TriggerPage"));
const FraudGuardPage = lazy(() => import("./pages/FraudGuardPage"));
const PayoutPage = lazy(() => import("./pages/PayoutPage"));
const PayoutReceivedPage = lazy(() => import("./pages/PayoutReceivedPage"));
const PayoutHistoryPage = lazy(() => import("./pages/PayoutHistoryPage"));
const PredictiveHistoryPage = lazy(
  () => import("./pages/PredictiveHistoryPage"),
);
const CommunityHeatmapPage = lazy(() => import("./pages/CommunityHeatmapPage"));
const TeamProtectionPage = lazy(() => import("./pages/TeamProtectionPage"));
const TrustCenterPage = lazy(() => import("./pages/TrustCenterPage"));
const AdminOperationsPage = lazy(() => import("./pages/AdminOperationsPage"));
const GetProtected = lazy(() => import("./pages/GetProtected"));
const JudgeDemoPage = lazy(() => import("./pages/JudgeDemoPage"));

// Simple Error Boundary for Page Routes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-12 bg-white rounded-3xl m-8 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 mb-8 max-w-md font-medium">
            We encountered an unexpected error while loading this page. Our team
            has been notified.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-full bg-[#1a2229] px-8 py-3 text-sm font-bold text-white shadow-xl hover:bg-black transition-all"
          >
            Take Me Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  return children;
}

import ARIAChat from "./components/ARIAChat";

function App() {
  return (
    <BrowserRouter basename={getRouterBasename()}>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const { session, sessionReady, setSession } = useHydratedSession();

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      <WorkerNotificationBridge session={session} sessionReady={sessionReady} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        toastClassName="!rounded-2xl !border !border-white/10 !bg-[#111318] !shadow-2xl !font-sans !text-sm !text-zinc-100"
      />
      <NotificationStack />
      <Navbar />
      <div className="min-h-screen bg-transparent">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
                <div className="h-10 w-10 rounded-full border-4 border-white/15 border-t-cyan-300 animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/judge-demo"
                element={<JudgeDemoPage setSession={setSession} />}
              />
              <Route path="/product" element={<ProductPage />} />
              <Route path="/income-radar" element={<IncomeRadarPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/triggers" element={<TriggerPage />} />
              <Route path="/fraud-guard" element={<FraudGuardPage />} />
              <Route path="/get-protected" element={<GetProtected />} />
              <Route
                path="/signin"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/signup"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/callback"
                element={<Navigate to="/dashboard" replace />}
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <DashboardPage session={session} setSession={setSession} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payout"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <PayoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payout-received"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <PayoutReceivedPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/payout-history"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <PayoutHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/predictive-history"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <PredictiveHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-heatmap"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <CommunityHeatmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-protection"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <TeamProtectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trust-center"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <TrustCenterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <Navigate to="/admin-ops" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-ops"
                element={
                  <ProtectedRoute session={session} sessionReady={sessionReady}>
                    <AdminOperationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
      <ARIAChat session={session} />
    </>
  );
}

function WorkerNotificationBridge({ session, sessionReady }) {
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    if (!sessionReady || !session?.isAuthenticated) {
      return undefined;
    }

    let alive = true;

    const syncNotifications = async () => {
      const [claims, payouts, openPayout] = await Promise.all([
        fetchWorkerClaimAlerts({ limit: 3 }),
        fetchRecentPayoutAlertsFromBackend({ limit: 3 }),
        fetchLatestOpenPayoutCandidateFromBackend(),
      ]);

      if (!alive) {
        return;
      }

      claims.forEach((claim) => {
        const key = `claim-${claim.id}-${claim.status}`;
        if (seenIdsRef.current.has(key)) return;
        seenIdsRef.current.add(key);

        pushNotification({
          type:
            claim.status === "paid" || claim.status === "approved"
              ? "success"
              : "info",
          category: "claims",
          title:
            claim.status === "approved"
              ? "Claim approved"
              : claim.status === "paid"
                ? "Claim settled"
                : "Protection started",
          message:
            claim.recommendation ||
            `GigShield created ${claim.claimNumber} for ${claim.city || "your area"}.`,
        });
      });

      payouts.forEach((payout) => {
        const key = `payout-${payout.payoutId}-${payout.lifecycleStatus}`;
        if (seenIdsRef.current.has(key)) return;
        seenIdsRef.current.add(key);

        pushNotification({
          type:
            payout.lifecycleStatus === "settled"
              ? "success"
              : payout.lifecycleStatus === "failed"
                ? "error"
                : "info",
          category: "payouts",
          title:
            payout.lifecycleStatus === "settled"
              ? "Payout settled"
              : payout.lifecycleStatus === "failed"
                ? "Payout needs attention"
                : "Payout queued",
          message: `${payout.payoutId} · INR ${Number(payout.payoutAmount || 0)}`,
        });
      });

      if (openPayout?.payoutId) {
        const key = `open-payout-${openPayout.payoutId}`;
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key);
          pushNotification({
            type: "info",
            category: "payouts",
            title: "Verification pending",
            message: `Open the payout flow to verify and receive ${Number(
              openPayout.payoutAmount || 0,
            )}.`,
          });
        }
      }
    };

    syncNotifications();
    const intervalId = window.setInterval(syncNotifications, 30000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [session?.isAuthenticated, session?.workerId, sessionReady]);

  return null;
}

export default App;
