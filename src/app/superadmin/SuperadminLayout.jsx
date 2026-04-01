import { NavLink, Outlet } from "react-router-dom";
import { superadminNav } from "./nav.js";

export function SuperadminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-5">
          <div className="mb-5">
            <div className="text-sm font-semibold text-slate-900">Superadmin Panel</div>
            <div className="mt-0.5 text-xs text-slate-500">Platform control center</div>
          </div>
          <nav className="grid gap-1">
          {superadminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/superadmin"}
              className={({ isActive }) =>
                [
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">Dashboard</div>
                <div className="truncate text-xs text-slate-500">White theme (Tailwind)</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden w-[320px] items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 md:flex">
                  Search…
                </div>
                <div className="h-9 w-9 rounded-full border border-slate-200 bg-slate-100" />
              </div>
            </div>
          </header>

          <main className="px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

