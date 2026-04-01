import { MdAddTask, MdAttachMoney, MdBarChart, MdFileCopy } from "react-icons/md";
import { Card } from "../../../components/ui/Card.jsx";
import { StatCard } from "../../../components/ui/StatCard.jsx";

function PlaceholderChart({ title }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3 h-44 w-full rounded-xl border border-dashed border-slate-200 bg-slate-50" />
    </Card>
  );
}

function PlaceholderTable({ title }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          View all
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <div>Name</div>
          <div>Status</div>
          <div>Shop</div>
          <div className="text-right">Total</div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-4 items-center border-t border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <div className="truncate">ORD-10{i}0</div>
            <div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                placed
              </span>
            </div>
            <div className="truncate text-slate-500">shop-{i}</div>
            <div className="text-right font-medium text-slate-900">₹10,000</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SuperadminDashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Platform Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Horizon-style dashboard layout recreated with Tailwind (white theme).
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Earnings" value="₹350.4k" icon={<MdBarChart className="h-5 w-5" />} />
        <StatCard label="Spend this month" value="₹642.39k" icon={<MdAttachMoney className="h-5 w-5" />} />
        <StatCard label="Sales" value="₹574.34k" icon={<MdAttachMoney className="h-5 w-5" />} hint="+23%" />
        <StatCard label="Your balance" value="₹1,000k" icon={<MdAttachMoney className="h-5 w-5" />} />
        <StatCard label="New tasks" value="154" icon={<MdAddTask className="h-5 w-5" />} />
        <StatCard label="Total projects" value="2935" icon={<MdFileCopy className="h-5 w-5" />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PlaceholderChart title="Total spent" />
        <PlaceholderChart title="Weekly revenue" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PlaceholderTable title="Check table" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PlaceholderChart title="Daily traffic" />
          <PlaceholderChart title="Revenue split" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PlaceholderTable title="Complex table" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-900">Tasks</div>
            <div className="mt-3 space-y-2">
              {["Review shop onboarding", "Monitor blocked shops", "Check failed orders"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-900">Calendar</div>
            <div className="mt-3 h-40 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
          </Card>
        </div>
      </section>
    </div>
  );
}

