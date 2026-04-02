import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { ShopsPage } from "../pages/ShopsPage.jsx";
import { CreateShopPage } from "../pages/CreateShopPage.jsx";
import { ShopDetailPage } from "../pages/ShopDetailPage.jsx";
import { EditShopPage } from "../pages/EditShopPage.jsx";
import { selectIsAuthenticated } from "../features/auth/authSelectors.js";
import { DashboardLayout } from "../components/layout/DashboardLayout.jsx";

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
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/shops/new" element={<CreateShopPage />} />
        <Route path="/shops/:id/edit" element={<EditShopPage />} />
        <Route path="/shops/:id" element={<ShopDetailPage />} />
        <Route path="/orders" element={<DashboardPage />} />
        <Route path="/delivery-partners" element={<DashboardPage />} />
        <Route path="/users" element={<DashboardPage />} />
        <Route path="/reports" element={<DashboardPage />} />
        <Route path="/settings" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

