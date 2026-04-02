import { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineUsers
} from "react-icons/hi2";
import { closeSidebar } from "../../store/slices/uiSlice.js";
import { selectUser } from "../../features/auth/authSelectors.js";
import { SidebarItem } from "./SidebarItem.jsx";

const MENU = [
  { key: "dashboard", label: "Dashboard", icon: HiOutlineHome, path: "/dashboard" },
  { key: "shops", label: "Shops", icon: HiOutlineShoppingBag, path: "/shops" },
  { key: "orders", label: "Orders", icon: HiOutlineClipboardDocumentList, path: "/orders" },
  { key: "delivery", label: "Delivery Partners", icon: HiOutlineTruck, path: "/delivery-partners" },
  { key: "users", label: "Users", icon: HiOutlineUsers, path: "/users" },
  { key: "reports", label: "Reports", icon: HiOutlineChartBar, path: "/reports" },
  { key: "settings", label: "Settings", icon: HiOutlineCog6Tooth, path: "/settings" }
];

function allowedMenuKeysForRole(role) {
  if (role === "superadmin") return new Set(["dashboard", "shops", "users", "reports", "settings"]);
  // shop admin (default)
  return new Set(["dashboard", "orders", "delivery", "reports", "settings"]);
}

export const Sidebar = memo(function Sidebar({ collapsed, variant = "desktop", onNavigate }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const role = user?.role;

  const items = useMemo(() => {
    const allowed = allowedMenuKeysForRole(role);
    return MENU.filter((i) => allowed.has(i.key));
  }, [role]);

  // Mobile rule: close drawer on route change.
  useEffect(() => {
    if (variant !== "mobile") return;
    dispatch(closeSidebar());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, variant]);

  return (
    <aside
      className={[
        "h-full bg-white text-slate-900",
        "border-r border-slate-200",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-[260px]"
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white font-bold">
          CT
        </div>
        <div className={collapsed ? "sr-only" : ""}>
          <div className="text-sm font-semibold leading-tight">CodeTeak</div>
          <div className="text-xs text-slate-500">Dashboard</div>
        </div>
      </div>

      <nav className="px-3 pb-4">
        <div className="space-y-1">
          {items.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              path={item.path}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
});

