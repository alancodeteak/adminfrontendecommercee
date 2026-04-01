import { createBrowserRouter, Navigate } from "react-router-dom";
import { SuperadminLayout } from "./superadmin/SuperadminLayout.jsx";
import { ShopAdminLayout } from "./shopAdmin/ShopAdminLayout.jsx";
import { SuperadminDashboardPage } from "./superadmin/pages/SuperadminDashboardPage.jsx";
import { ShopsPage } from "./superadmin/pages/ShopsPage.jsx";
import { ShopAdminsPage } from "./superadmin/pages/ShopAdminsPage.jsx";
import { OrdersAllShopsPage } from "./superadmin/pages/OrdersAllShopsPage.jsx";
import { DeliveryPartnersPage } from "./superadmin/pages/DeliveryPartnersPage.jsx";
import { ReportsPage } from "./superadmin/pages/ReportsPage.jsx";
import { AnalyticsPage } from "./superadmin/pages/AnalyticsPage.jsx";
import { TicketsPage } from "./superadmin/pages/TicketsPage.jsx";
import { SettingsPage } from "./superadmin/pages/SettingsPage.jsx";
import { ShopAdminDashboardPage } from "./shopAdmin/pages/ShopAdminDashboardPage.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/superadmin" replace /> },
  {
    path: "/superadmin",
    element: <SuperadminLayout />,
    children: [
      { index: true, element: <SuperadminDashboardPage /> },
      { path: "shops", element: <ShopsPage /> },
      { path: "shop-admins", element: <ShopAdminsPage /> },
      { path: "orders", element: <OrdersAllShopsPage /> },
      { path: "delivery-partners", element: <DeliveryPartnersPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "tickets", element: <TicketsPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  },
  {
    path: "/admin",
    element: <ShopAdminLayout />,
    children: [{ index: true, element: <ShopAdminDashboardPage /> }]
  }
]);

