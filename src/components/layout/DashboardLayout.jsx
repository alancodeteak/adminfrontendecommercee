import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiBars3, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from "react-icons/hi2";
import { closeSidebar, openSidebar } from "../../store/slices/uiSlice.js";

import { Sidebar } from "./Sidebar.jsx";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function DashboardLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const isDesktop = useIsDesktop();

  // Tablet requirement: collapsible sidebar (md+ but <lg)
  const [collapsed, setCollapsed] = useState(false);

  // Ensure mobile drawer never stays open when switching to desktop.
  useEffect(() => {
    if (isDesktop) dispatch(closeSidebar());
  }, [dispatch, isDesktop]);

  // Close drawer on navigation (mobile rule), as a safety net.
  useEffect(() => {
    dispatch(closeSidebar());
  }, [dispatch, location.pathname]);

  const pageTitle = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean)[0] ?? "dashboard";
    return seg
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }, [location.pathname]);

  const openMobileSidebar = useCallback(() => dispatch(openSidebar()), [dispatch]);
  const closeMobileSidebar = useCallback(() => dispatch(closeSidebar()), [dispatch]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop + tablet sidebar (always visible) */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:block">
        <Sidebar collapsed={!isDesktop && collapsed} variant="desktop" />
      </div>

      {/* Mobile drawer sidebar */}
      <div
        className={[
          "fixed inset-0 z-40 md:hidden",
          "transition-opacity duration-300 ease-in-out",
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar drawer"
        onClick={closeMobileSidebar}
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div
          className={[
            "absolute inset-y-0 left-0",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar collapsed={false} variant="mobile" onNavigate={closeMobileSidebar} />
        </div>
      </div>

      {/* Main content wrapper */}
      <div
        className={[
          "transition-[padding] duration-300 ease-in-out",
          "md:pl-[260px]",
          !isDesktop && collapsed ? "md:pl-20" : ""
        ].join(" ")}
      >
        {/* Navbar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
                onClick={openMobileSidebar}
                aria-label="Open sidebar"
              >
                <HiBars3 className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-900 sm:text-base">{pageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <>
                    <HiOutlineChevronDoubleRight className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden lg:inline">Expand</span>
                  </>
                ) : (
                  <>
                    <HiOutlineChevronDoubleLeft className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden lg:inline">Collapse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

