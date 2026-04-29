import { memo, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeftOnRectangle,
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
import { logoutUser } from "../../features/auth/authThunks.js";
import { SidebarItem } from "./SidebarItem.jsx";

const MENU = [
  { key: "dashboard", label: "Dashboard", icon: HiOutlineHome, path: "/dashboard" },
  { key: "shops", label: "Shops", icon: HiOutlineShoppingBag, path: "/shops" },
  { key: "orders", label: "Orders", icon: HiOutlineClipboardDocumentList, path: "/orders" },
  { key: "products", label: "Products", icon: HiOutlineClipboardDocumentList, path: "/products" },
  { key: "delivery", label: "Delivery Partners", icon: HiOutlineTruck, path: "/delivery-partners" },
  { key: "users", label: "Users", icon: HiOutlineUsers, path: "/users" },
  { key: "reports", label: "Reports", icon: HiOutlineChartBar, path: "/reports" },
  { key: "settings", label: "Settings", icon: HiOutlineCog6Tooth, path: "/settings" }
];

function allowedMenuKeysForRole(role) {
  if (role === "superadmin") return new Set(["dashboard", "shops", "products", "users", "reports", "settings"]);
  // shop admin (default)
  return new Set(["dashboard", "orders", "products", "delivery", "reports", "settings"]);
}

export const Sidebar = memo(function Sidebar({ collapsed, variant = "desktop", onNavigate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    if (onNavigate) onNavigate();
    navigate("/login", { replace: true });
  }, [dispatch, navigate, onNavigate]);

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

      <nav className="flex h-[calc(100%-4rem)] flex-col px-3 pb-4">
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
        <button
          type="button"
          title={collapsed ? "Logout" : undefined}
          aria-label="Logout"
          onClick={handleLogout}
          className="group mt-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-red-600 ring-1 ring-slate-200 group-hover:bg-red-50">
            <HiOutlineArrowLeftOnRectangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className={collapsed ? "sr-only" : "truncate"}>Logout</span>
        </button>
      </nav>
    </aside>
  );
});

