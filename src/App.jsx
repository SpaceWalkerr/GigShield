import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NotificationStack from "./components/NotificationStack";
import { hasRole, isSessionActive } from "./utils/session";

const AuthPage = lazy(() => import("./pages/AuthPage"));
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

function ProtectedRoute({ children }) {
  if (!isSessionActive()) {
    return <Navigate replace to="/auth" />;
  }
  return children;
}

function AdminRoute({ children }) {
  if (!isSessionActive()) {
    return <Navigate replace to="/auth" />;
  }

  if (!hasRole("admin")) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationStack />
      <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/triggers" element={<TriggerPage />} />
          <Route path="/fraud-guard" element={<FraudGuardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/payout"
            element={(
              <ProtectedRoute>
                <PayoutPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/payout/received"
            element={(
              <ProtectedRoute>
                <PayoutReceivedPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/payout/history"
            element={(
              <ProtectedRoute>
                <PayoutHistoryPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/ops"
            element={(
              <AdminRoute>
                <AdminOperationsPage />
              </AdminRoute>
            )}
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
