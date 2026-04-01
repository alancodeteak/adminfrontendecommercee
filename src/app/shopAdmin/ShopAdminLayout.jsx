import { Outlet } from "react-router-dom";

export function ShopAdminLayout() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Shop Admin</div>
      <Outlet />
    </div>
  );
}

