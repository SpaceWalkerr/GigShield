import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import ProductPage from "./pages/ProductPage";
import TriggerPage from "./pages/TriggerPage";
import FraudGuardPage from "./pages/FraudGuardPage";
import { isSessionActive } from "./utils/session";

function ProtectedRoute({ children }) {
  if (!isSessionActive()) {
    return <Navigate replace to="/auth" />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
