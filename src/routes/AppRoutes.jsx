import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { selectIsAuthenticated } from "../features/auth/authSelectors.js";

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

