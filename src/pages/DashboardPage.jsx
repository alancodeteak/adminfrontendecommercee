import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";

function StatCard({ label, value, hint, footer, to, accent = "indigo" }) {
  const accentRing =
    accent === "emerald"
      ? "ring-emerald-500/15"
      : accent === "amber"
        ? "ring-amber-500/15"
        : "ring-indigo-500/15";

  const content = (
    <div className={`rounded-xl ring-1 ${accentRing} bg-gradient-to-br from-white to-slate-50/80 p-5`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-indigo-500">
        {content}
      </Link>
    );
  }

  return content;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const isSuperadmin = user?.role === "superadmin";

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  useEffect(() => {
    if (!isSuperadmin) {
      setMetrics(null);
      setMetricsError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        const res = await api.get("/api/superadmin/platform-metrics");
        const data = res.data?.data;
        if (!cancelled) setMetrics(data || null);
      } catch (e) {
        if (!cancelled) {
          setMetrics(null);
          setMetricsError(e?.response?.data?.error?.message || e?.message || "Could not load dashboard metrics");
        }
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSuperadmin]);

  const shopValue = !isSuperadmin ? "—" : metricsLoading ? "…" : metricsError ? "—" : String(metrics?.shopsTotal ?? 0);
  const ordersTotalValue = !isSuperadmin
    ? "—"
    : metricsLoading
      ? "…"
      : metricsError
        ? "—"
        : String(metrics?.ordersTotal ?? 0);
  const ordersPendingValue = !isSuperadmin
    ? "—"
    : metricsLoading
      ? "…"
      : metricsError
        ? "—"
        : String(metrics?.ordersPending ?? 0);
  const ordersDelivered30dValue = !isSuperadmin
    ? "—"
    : metricsLoading
      ? "…"
      : metricsError
        ? "—"
        : String(metrics?.ordersDelivered30d ?? 0);
  const revenueMinor30dValue = !isSuperadmin
    ? "—"
    : metricsLoading
      ? "…"
      : metricsError
        ? "—"
        : new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: metrics?.currency || "INR",
            maximumFractionDigits: 0
          }).format((Number(metrics?.revenueMinor30d ?? 0) || 0) / 100);

  const shopHint = !isSuperadmin
    ? "Shop totals are available for superadmin accounts."
    : metricsError
      ? metricsError
      : "Registered shops on the platform";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Logged in as <span className="font-medium text-slate-700">{user?.email ?? "unknown"}</span>
              {user?.role ? (
                <span className="text-slate-400">
                  {" "}
                  · <span className="capitalize text-slate-600">{user.role}</span>
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden p-0">
          <StatCard
            label="Shops"
            value={shopValue}
            hint={shopHint}
            to={isSuperadmin ? "/shops" : undefined}
            accent="indigo"
            footer={
              isSuperadmin ? (
                <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
                  Live
                </span>
              ) : null
            }
          />
        </Card>

        <Card className="relative overflow-hidden p-0">
          <StatCard
            label="Total orders"
            value={ordersTotalValue}
            hint={isSuperadmin ? "All-time orders across shops" : "Available for superadmin accounts"}
            accent="emerald"
          />
        </Card>
        <Card className="relative overflow-hidden p-0">
          <StatCard
            label="Pending orders"
            value={ordersPendingValue}
            hint={isSuperadmin ? "Orders awaiting fulfillment" : "Available for superadmin accounts"}
            accent="amber"
          />
        </Card>
        <Card className="relative overflow-hidden p-0">
          <StatCard
            label="Delivered (30d)"
            value={ordersDelivered30dValue}
            hint={isSuperadmin ? "Delivered orders in last 30 days" : "Available for superadmin accounts"}
            accent="indigo"
          />
        </Card>
        <Card className="relative overflow-hidden p-0">
          <StatCard
            label="Revenue (30d)"
            value={revenueMinor30dValue}
            hint={isSuperadmin ? "Sum of order totals in last 30 days" : "Available for superadmin accounts"}
            accent="emerald"
          />
        </Card>
      </div>
    </div>
  );
}
