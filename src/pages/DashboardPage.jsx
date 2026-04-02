import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";

/** Placeholder metrics until orders APIs exist. */
const DEMO_ORDER_STATS = [
  { key: "orders-total", label: "Total orders", value: "1,248", hint: "All time (sample)" },
  { key: "orders-pending", label: "Pending orders", value: "42", hint: "Awaiting fulfillment (sample)" },
  { key: "orders-completed", label: "Completed (30d)", value: "892", hint: "Last 30 days (sample)" }
];

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

  const [shopTotal, setShopTotal] = useState(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState(null);

  useEffect(() => {
    if (!isSuperadmin) {
      setShopTotal(null);
      setShopsError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setShopsLoading(true);
      setShopsError(null);
      try {
        const res = await api.get("/api/superadmin/shops?page=1&limit=1");
        const total = res.data?.data?.pagination?.total;
        if (!cancelled) setShopTotal(typeof total === "number" ? total : 0);
      } catch (e) {
        if (!cancelled) {
          setShopTotal(null);
          setShopsError(e?.response?.data?.error?.message || e?.message || "Could not load shops");
        }
      } finally {
        if (!cancelled) setShopsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSuperadmin]);

  const shopValue =
    !isSuperadmin ? "—" : shopsLoading ? "…" : shopsError ? "—" : String(shopTotal ?? 0);
  const shopHint = !isSuperadmin
    ? "Shop totals are available for superadmin accounts."
    : shopsError
      ? shopsError
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

        {DEMO_ORDER_STATS.map((s, i) => (
          <Card key={s.key} className="relative overflow-hidden p-0">
            <StatCard
              label={s.label}
              value={s.value}
              hint={s.hint}
              accent={i === 0 ? "emerald" : i === 1 ? "amber" : "indigo"}
              footer={
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Demo
                </span>
              }
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
