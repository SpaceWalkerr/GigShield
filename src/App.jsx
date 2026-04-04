import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NotificationStack from "./components/NotificationStack";
import Navbar from "./components/Navbar";
import { isSessionActive } from "./utils/session";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const TriggerPage = lazy(() => import("./pages/TriggerPage"));
const FraudGuardPage = lazy(() => import("./pages/FraudGuardPage"));
const PayoutPage = lazy(() => import("./pages/PayoutPage"));
const PayoutReceivedPage = lazy(() => import("./pages/PayoutReceivedPage"));
const PayoutHistoryPage = lazy(() => import("./pages/PayoutHistoryPage"));
const AdminOperationsPage = lazy(() => import("./pages/AdminOperationsPage"));
const GetProtected = lazy(() => import("./pages/GetProtected"));

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
  if (!isSessionActive()) {
    return <Navigate replace to="/signin" />;
  }
  return children;
}

function App() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }, []);

  return (
    <BrowserRouter>
      <NotificationStack />
      <Navbar />
      <div className="pt-24 lg:pt-32 min-h-screen bg-[#f4f5f7]">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#f4f5f7]/50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#1a2229] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/product" element={<ProductPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/triggers" element={<TriggerPage />} />
              <Route path="/fraud-guard" element={<FraudGuardPage />} />
              <Route path="/get-protected" element={<GetProtected />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payout"
                element={
                  <ProtectedRoute>
                    <PayoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payout-received"
                element={
                  <ProtectedRoute>
                    <PayoutReceivedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payout-history"
                element={
                  <ProtectedRoute>
                    <PayoutHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Navigate to="/admin-ops" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-ops"
                element={
                  <ProtectedRoute>
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
    </BrowserRouter>
  );
}

export default App;
