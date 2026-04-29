import { useMemo, useState } from "react";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { FormError } from "../components/ui/FormError.jsx";
import { useLiveScannerFeed } from "../hooks/useLiveScannerFeed.js";
import { useBarcodeProductLookup } from "../hooks/useBarcodeProductLookup.js";

function toPrefill(upc) {
  const p = upc?.product;
  if (!p?.name?.trim()) return null;
  return {
    name: p.name.trim(),
    category: p.category?.trim() || "Uncategorized",
    imageUrl: p.imageUrl?.trim() || ""
  };
}

function normalizeSlug(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toAdditionalAttributes(product) {
  const obj = product?.attributes;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj)
    .map(([key, value]) => ({
      key: String(key || "").trim(),
      value: Array.isArray(value) ? value.join(", ") : String(value ?? "").trim()
    }))
    .filter((item) => item.key && item.value);
}

export function ProductIntakePage() {
  const { socketState, socketError, scannerList, scans, lastMessage, connectionSource } = useLiveScannerFeed();
  const {
    barcodeInput,
    setBarcodeInput,
    latestScan,
    product,
    globalProduct,
    upc,
    categorySuggestions,
    warning,
    lookupSource,
    isLoading,
    notFound,
    error,
    lookupNow
  } =
    useBarcodeProductLookup(lastMessage);

  const prefill = useMemo(() => toPrefill(upc), [upc]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [baseUnit, setBaseUnit] = useState("piece");
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const scannedDetails = useMemo(() => {
    const p = upc?.product || null;
    if (!p) return null;
    return {
      title: p.name?.trim() || "",
      barcode: barcodeInput.trim() || upc?.code || "",
      ean: upc?.code || barcodeInput.trim() || "",
      brand: p.brand?.trim() || "Unknown",
      category: p.category?.trim() || "Uncategorized",
      description: p.description?.trim() || "",
      imageUrl: p.imageUrl?.trim() || "",
      attributes: toAdditionalAttributes(p)
    };
  }, [barcodeInput, upc]);

  async function createGlobalFromLookup() {
    if (!upc?.product?.name) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/api/admin/global-products", {
        name: upc.product.name,
        barcode: barcodeInput.trim(),
        globalCategoryId: subcategoryId || categoryId || undefined,
        brand: upc.product.brand || undefined,
        category: upc.product.category || undefined,
        description: upc.product.description || undefined,
        imageUrl: upc.product.imageUrl || undefined,
        source: "go_upc"
      });
      await lookupNow();
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to create global product");
    } finally {
      setSubmitting(false);
    }
  }

  async function createLocalProduct() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!barcodeInput.trim()) throw new Error("Barcode is required");
      if (!categoryId.trim()) throw new Error("Select a category before creating product");
      if (!globalProduct && !scannedDetails) throw new Error("Lookup barcode first and wait for Go-UPC result");

      const cleanSlug = normalizeSlug(slug || name || prefill?.name || "");
      const response = await api.post("/api/admin/global-products/from-barcode", {
        barcode: scannedDetails?.barcode || barcodeInput.trim(),
        categoryId,
        subcategoryId: subcategoryId || undefined,
        name: name.trim() || scannedDetails?.title || undefined,
        brand: scannedDetails?.brand || undefined,
        imageUrl: scannedDetails?.imageUrl || undefined,
        description: scannedDetails?.description || undefined
      });
      const globalId = response?.data?.item?.id;
      if (globalId && imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        await api.post(`/api/admin/global-products/${globalId}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      setName("");
      setSlug(cleanSlug);
      setCategoryName("");
      setCategoryId("");
      setSubcategoryId("");
      setImageFile(null);
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Product Intake</h2>
        <p className="mt-1 text-sm text-slate-500">Scanner + barcode lookup + global product import/create.</p>
        <p className="mt-1 text-xs text-slate-500">
          Input source: {connectionSource === "lan_ws" ? "LAN WebSocket" : "Backend Socket.IO"}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label="Barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or type barcode"
            />
            <div className="self-end">
              <Button type="button" onClick={lookupNow} loading={isLoading}>
                Lookup
              </Button>
            </div>
          </div>
          {error ? <FormError message={error} /> : null}
          {warning?.message ? (
            <p className="mt-2 text-xs text-amber-600">
              {warning.message}
              {warning.retryable ? " (retryable)" : ""}
            </p>
          ) : null}
          {lookupSource !== "none" ? (
            <p className="mt-1 text-xs text-slate-500">Lookup source: {lookupSource}</p>
          ) : null}
          {notFound ? <p className="mt-2 text-sm text-slate-500">No local/global match found.</p> : null}

          <div className="mt-4 space-y-3">
            {product ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                Found local product: <span className="font-semibold">{product.name}</span>
              </div>
            ) : null}
            {globalProduct ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">
                Found global product: <span className="font-semibold">{globalProduct.name}</span>
              </div>
            ) : null}
            {scannedDetails ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scanned Product Details
                </div>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <div className="h-[120px] w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {scannedDetails.imageUrl ? (
                      <img
                        src={scannedDetails.imageUrl}
                        alt={scannedDetails.title || "Scanned product"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[11px] text-slate-400">No image</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{scannedDetails.title || "Unnamed product"}</div>
                    <div className="text-xs text-slate-500">EAN: {scannedDetails.ean || "N/A"}</div>
                    <div className="text-xs text-slate-500">Barcode: {scannedDetails.barcode || "N/A"}</div>
                    <div className="text-xs text-slate-500">Brand: {scannedDetails.brand}</div>
                    <div className="text-xs text-slate-500">Category: {scannedDetails.category}</div>
                    <div className="text-xs text-slate-500">
                      Description: {scannedDetails.description || "No description found."}
                    </div>
                  </div>
                </div>
                {scannedDetails.attributes.length ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Additional Attributes
                    </div>
                    <div className="max-h-24 space-y-1 overflow-auto text-xs text-slate-600">
                      {scannedDetails.attributes.map((item) => (
                        <div key={item.key}>
                          <span className="font-medium">{item.key}:</span> {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">No additional attributes available at present.</div>
                )}
                <div className="mt-3">
                  <Button type="button" onClick={createGlobalFromLookup} loading={submitting}>
                    Save as Global Product
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-900">Scanner Status</div>
          <p className="mt-1 text-xs text-slate-500">Socket: {socketState}</p>
          {socketError ? <p className="mt-1 text-xs text-rose-600">{socketError}</p> : null}
          {latestScan ? (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
              Last scan: {latestScan.deviceName || latestScan.deviceId} · {latestScan.barcode}
            </div>
          ) : null}
          <div className="mt-3 text-xs text-slate-500">Scanners: {scannerList.length}</div>
          <div className="mt-2 max-h-48 space-y-1 overflow-auto">
            {scannerList.map((s) => (
              <div key={`${s.scannerId}-${s.last_seen}`} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                {s.name} · {s.status}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Name" value={name || prefill?.name || ""} onChange={(e) => setName(e.target.value)} />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name if empty" />
          <Input label="Category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          <Input label="Category ID (suggestion ref)" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
        </div>
        {categorySuggestions?.length ? (
          <div className="mt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested categories</div>
            <div className="flex flex-wrap gap-2">
              {categorySuggestions.map((s) => (
                <button
                  key={s.categoryId}
                  type="button"
                  onClick={() => {
                    if (s.parentId) {
                      setCategoryId(s.parentId);
                      setSubcategoryId(s.categoryId);
                      setCategoryName(`${s.parentName} / ${s.categoryName}`);
                    } else {
                      setCategoryId(s.categoryId);
                      setSubcategoryId("");
                      setCategoryName(s.categoryName);
                    }
                  }}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    categoryId === s.categoryId
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700"
                  ].join(" ")}
                >
                  {s.parentName ? `${s.parentName} / ${s.categoryName}` : s.categoryName} ({s.score})
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-700">Optional product image upload</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            onClick={createLocalProduct}
            loading={submitting}
            disabled={!barcodeInput.trim() || !categoryName.trim() || (!globalProduct && !scannedDetails)}
          >
            Save To Global Products
          </Button>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={baseUnit}
            onChange={(e) => setBaseUnit(e.target.value)}
          >
            <option value="piece">piece</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
          </select>
        </div>
        {submitError ? <FormError message={submitError} /> : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-slate-900">Recent Scans</div>
        <div className="mt-3 max-h-64 overflow-auto">
          {scans.map((s, idx) => (
            <div key={`${s.scannerId}-${s.timestamp}-${idx}`} className="border-b border-slate-100 py-2 text-sm">
              <div className="font-medium">{s.barcode}</div>
              <div className="text-xs text-slate-500">
                {s.scannerName || s.scannerId} · {new Date(s.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
