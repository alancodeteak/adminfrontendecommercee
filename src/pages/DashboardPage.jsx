import { useAuth } from "../hooks/useAuth.js";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">
                Logged in as <span className="font-medium text-slate-700">{user?.email ?? "unknown"}</span>
              </p>
            </div>
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

