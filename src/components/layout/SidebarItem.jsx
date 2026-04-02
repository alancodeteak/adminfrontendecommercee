import { memo } from "react";
import { NavLink } from "react-router-dom";

export const SidebarItem = memo(function SidebarItem({ icon: Icon, label, path, collapsed, onNavigate }) {
  return (
    <NavLink
      to={path}
      title={collapsed ? label : undefined}
      aria-label={label}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        ].join(" ")
      }
    >
      <span
        className={[
          "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-opacity",
          "bg-indigo-600",
          collapsed ? "opacity-0" : "opacity-100"
        ].join(" ")}
        aria-hidden="true"
      />

      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200 group-hover:bg-slate-50">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
    </NavLink>
  );
});

