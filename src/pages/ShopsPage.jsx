import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { FormError } from "../components/ui/FormError.jsx";
import { useNavigate } from "react-router-dom";

function shopImageSrc(s) {
  if (s.shop_image_url) return s.shop_image_url;
  if (!s.shop_image) return null;
  if (/^https?:\/\//i.test(s.shop_image)) return s.shop_image;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
  const path = String(s.shop_image).replace(/^\//, "");
  return `${base}/${path}`;
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onPrev}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ShopsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, limit, search]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/superadmin/shops?${params}`);
        const data = res.data?.data;
        if (cancelled) return;
        setShops(Array.isArray(data?.shops) ? data.shops : []);
        setPagination(data?.pagination || { total: 0, page, limit, totalPages: 1 });
      } catch (e) {
        if (cancelled) return;
        const message = e?.response?.data?.error?.message || e?.message || "Failed to load shops";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [params, page, limit]);

  const isEmpty = !loading && !error && shops.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Shops</h2>
          <p className="mt-1 text-sm text-slate-500">All active shops in the platform.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <form
            className="flex w-full max-w-xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchDraft);
            }}
          >
            <Input
              label="Search"
              placeholder="Search by shop name…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <Button type="submit" loading={loading} className="h-[42px] whitespace-nowrap">
              Search
            </Button>
          </form>

          <Button
            type="button"
            className="h-[42px] whitespace-nowrap"
            onClick={() => navigate("/shops/new")}
          >
            Add Shop
          </Button>
        </div>
      </div>

      {error ? (
        <FormError message={error} />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            />
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="px-5 py-10 text-sm text-slate-500">Loading shops…</div>
            ) : isEmpty ? (
              <div className="px-5 py-10">
                <div className="text-sm font-semibold text-slate-900">No shops have been added.</div>
                <div className="mt-1 text-sm text-slate-500">
                  When a shop is onboarded, it will appear here automatically.
                </div>
              </div>
            ) : (
              shops.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                  onClick={() => navigate(`/shops/${s.id}`)}
                  aria-label={`Open shop ${s.name}`}
                >
                  <div className="flex items-center gap-3">
                    {shopImageSrc(s) ? (
                      <img
                        src={shopImageSrc(s)}
                        alt={`${s.name} logo`}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                        <span className="text-sm font-bold">{(s.name || "?").slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{s.name}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {s.contact_number ? `Contact: ${s.contact_number}` : "No contact number"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                      {s.shop_image ? "Has image" : "No image"}
                    </span>
                    <span className="text-slate-400" aria-hidden="true">
                      →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

