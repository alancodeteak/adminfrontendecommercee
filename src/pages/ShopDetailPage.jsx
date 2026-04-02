import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";
import { FormError } from "../components/ui/FormError.jsx";

function detailImageUrl(shop) {
  if (shop?.image?.url) return shop.image.url;
  const key = shop?.image?.storageKey;
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
  return `${base}/${String(key).replace(/^\//, "")}`;
}

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 sm:col-span-2">{children ?? "—"}</dd>
    </div>
  );
}

export function ShopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/superadmin/shops/${id}`);
        const s = res.data?.data?.shop;
        if (!cancelled) setShop(s ?? null);
      } catch (e) {
        if (!cancelled) {
          const message = e?.response?.data?.error?.message || e?.message || "Failed to load shop";
          setError(message);
          setShop(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const img = shop ? detailImageUrl(shop) : null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => navigate("/shops")}
          >
            ← Back to shops
          </button>
          {!loading && !error && shop ? (
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => navigate(`/shops/${id}/edit`)}
            >
              Edit shop
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <FormError message={error} />
      ) : loading ? (
        <div className="text-sm text-slate-500">Loading shop…</div>
      ) : !shop ? (
        <FormError message="Shop not found" />
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700 ring-1 ring-indigo-200">
                    {(shop.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold text-slate-900">{shop.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-mono text-slate-600">{shop.slug}</span>
                    {shop.status ? (
                      <span className="ml-2 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        {shop.status}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>

            <dl className="space-y-4 px-6 py-5">
              <DetailRow label="Shop ID">
                <span className="font-mono text-xs text-slate-700">{shop.id}</span>
              </DetailRow>
              <DetailRow label="Active">{shop.isActive ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Blocked">{shop.isBlocked ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Deleted">{shop.isDeleted ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Custom domain">{shop.customDomain || "—"}</DetailRow>
              <DetailRow label="Owner user ID">
                {shop.ownerUserId ? <span className="font-mono text-xs">{shop.ownerUserId}</span> : "—"}
              </DetailRow>
              <DetailRow label="Address ID (FK)">
                {shop.addressId ? <span className="font-mono text-xs">{shop.addressId}</span> : "—"}
              </DetailRow>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            <dl className="mt-4 space-y-4">
              <DetailRow label="Phone">{shop.phone || "—"}</DetailRow>
              <DetailRow label="Email">{shop.email || "—"}</DetailRow>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Address</h2>
            {shop.address ? (
              <dl className="mt-4 space-y-4">
                <DetailRow label="Address ID">
                  <span className="font-mono text-xs">{shop.address.id}</span>
                </DetailRow>
                <DetailRow label="Line 1">{shop.address.line1}</DetailRow>
                <DetailRow label="Line 2">{shop.address.line2}</DetailRow>
                <DetailRow label="Landmark">{shop.address.landmark}</DetailRow>
                <DetailRow label="City">{shop.address.city}</DetailRow>
                <DetailRow label="State">{shop.address.state}</DetailRow>
                <DetailRow label="Postal code">{shop.address.postalCode}</DetailRow>
                <DetailRow label="Country">{shop.address.country}</DetailRow>
                <DetailRow label="Coordinates">
                  {shop.address.lat != null && shop.address.lng != null
                    ? `${shop.address.lat}, ${shop.address.lng}`
                    : "—"}
                </DetailRow>
                <DetailRow label="Raw">{shop.address.raw}</DetailRow>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No address on file.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Image</h2>
            {shop.image ? (
              <dl className="mt-4 space-y-4">
                <DetailRow label="Public URL">{shop.image.url || "—"}</DetailRow>
                <DetailRow label="Storage key">
                  <span className="break-all font-mono text-xs">{shop.image.storageKey}</span>
                </DetailRow>
                <DetailRow label="Content type">{shop.image.contentType}</DetailRow>
                <DetailRow label="Byte size">{shop.image.byteSize != null ? String(shop.image.byteSize) : "—"}</DetailRow>
                <DetailRow label="SHA256">
                  <span className="break-all font-mono text-xs">{shop.image.sha256}</span>
                </DetailRow>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No shop image uploaded.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Timestamps</h2>
            <dl className="mt-4 space-y-4">
              <DetailRow label="Created">{shop.createdAt}</DetailRow>
              <DetailRow label="Updated">{shop.updatedAt}</DetailRow>
              <DetailRow label="Deleted">{shop.deletedAt || "—"}</DetailRow>
              {shop.address?.createdAt ? <DetailRow label="Address created">{shop.address.createdAt}</DetailRow> : null}
              {shop.address?.updatedAt ? <DetailRow label="Address updated">{shop.address.updatedAt}</DetailRow> : null}
            </dl>
          </Card>
        </div>
      )}
    </div>
  );
}
