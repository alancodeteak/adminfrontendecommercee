import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { FormError } from "../components/ui/FormError.jsx";
import { MapPickerModal } from "../components/maps/MapPickerModal.jsx";
import {
  MAX_SHOP_IMAGE_BYTES,
  MAX_SHOP_IMAGE_LABEL,
  SHOP_IMAGE_TOO_LARGE_MESSAGE
} from "../constants/imageUpload.js";

function normalizeSlug(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBackendErrors(err) {
  const message = err?.response?.data?.error?.message || err?.message || "Failed to update shop";
  const details = err?.response?.data?.error?.details;
  const fieldErrors = {};
  const issues = details?.issues || details?.cause?.issues || details?.errors;
  if (Array.isArray(issues)) {
    for (const issue of issues) {
      const path = Array.isArray(issue.path) ? issue.path.join(".") : issue.path;
      if (!path) continue;
      fieldErrors[String(path)] = issue.message || "Invalid value";
    }
  }
  return { message, fieldErrors };
}

export function EditShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});
  const [mapOpen, setMapOpen] = useState(false);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState("active");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addrRaw, setAddrRaw] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingShop(true);
      setLoadError(null);
      try {
        const res = await api.get(`/api/superadmin/shops/${id}`);
        const s = res.data?.data?.shop;
        if (cancelled || !s) return;
        setSlug(s.slug || "");
        setName(s.name || "");
        setPhone(s.phone || "");
        setEmail(s.email || "");
        setCustomDomain(s.customDomain || "");
        setOwnerUserId(s.ownerUserId || "");
        setIsActive(Boolean(s.isActive));
        setStatus(s.status || "active");
        setIsBlocked(Boolean(s.isBlocked));
        setIsDeleted(Boolean(s.isDeleted));
        const a = s.address;
        if (a) {
          setLine1(a.line1 || "");
          setLine2(a.line2 || "");
          setLandmark(a.landmark || "");
          setAddrRaw(a.raw || "");
          setCity(a.city || "");
          setStateVal(a.state || "");
          setPostalCode(a.postalCode || "");
          setCountry(a.country || "");
          setLat(a.lat != null ? String(a.lat) : "");
          setLng(a.lng != null ? String(a.lng) : "");
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.response?.data?.error?.message || e?.message || "Failed to load shop");
        }
      } finally {
        if (!cancelled) setLoadingShop(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function validateClient() {
    const next = {};
    const finalSlug = normalizeSlug(slug);
    if (!name.trim()) next.name = "Shop name is required";
    if (!finalSlug) next.slug = "Slug is required";
    if (finalSlug.length > 64) next.slug = "Slug must be 64 characters or less";
    if (finalSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) next.slug = "Invalid slug format";
    if (phone.trim() && !/^[0-9+][0-9]{7,31}$/.test(phone.trim())) next.phone = "Invalid phone format";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Invalid email";
    if (
      customDomain.trim() &&
      !/^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(customDomain.trim())
    ) {
      next.customDomain = "Invalid domain format";
    }
    if (ownerUserId.trim() && !/^[0-9a-f-]{36}$/i.test(ownerUserId.trim())) {
      next.ownerUserId = "Invalid UUID";
    }
    const latV = lat.trim() ? Number(lat) : null;
    const lngV = lng.trim() ? Number(lng) : null;
    if ((latV !== null && Number.isNaN(latV)) || (lngV !== null && Number.isNaN(lngV))) {
      next.lat = "Latitude/Longitude must be numbers";
    } else if ((latV !== null) !== (lngV !== null)) {
      next.lat = "Latitude and Longitude must be provided together";
      next.lng = "Latitude and Longitude must be provided together";
    } else if (latV !== null && (latV < -90 || latV > 90)) next.lat = "Latitude must be between -90 and 90";
    else if (lngV !== null && (lngV < -180 || lngV > 180)) next.lng = "Longitude must be between -180 and 180";
    setErrors(next);
    return { ok: Object.keys(next).length === 0, finalSlug, latV, lngV };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const { ok, finalSlug, latV, lngV } = validateClient();
    if (!ok) return;

    const address = {
      line1: line1.trim() || undefined,
      line2: line2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      raw: addrRaw.trim() || undefined,
      city: city.trim() || undefined,
      state: stateVal.trim() || undefined,
      postal_code: postalCode.trim() || undefined,
      country: country.trim() || undefined,
      lat: latV ?? undefined,
      lng: lngV ?? undefined
    };

    setSubmitting(true);
    try {
      await api.patch(`/api/superadmin/shops/${id}`, {
        name: name.trim(),
        slug: finalSlug,
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim() ? email.trim() : null,
        customDomain: customDomain.trim() ? customDomain.trim() : null,
        ownerUserId: ownerUserId.trim() ? ownerUserId.trim() : null,
        isActive,
        status,
        isBlocked,
        isDeleted,
        address
      });

      if (photoFile) {
        const fd = new FormData();
        fd.append("image", photoFile);
        await api.post(`/api/superadmin/shops/${id}/entity-images`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      navigate(`/shops/${id}`, { replace: true });
    } catch (err) {
      const parsed = parseBackendErrors(err);
      setFormError(parsed.message);
      setErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <FormError message={loadError} />
        <button
          type="button"
          className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          onClick={() => navigate("/shops")}
        >
          Back to shops
        </button>
      </div>
    );
  }

  if (loadingShop) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edit shop</h2>
          <p className="mt-1 text-sm text-slate-500">Update shop details. Images still use R2 + entity_images.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => navigate(`/shops/${id}`)}
        >
          Cancel
        </button>
      </div>

      <Card className="p-5 sm:p-6">
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <FormError message={formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Shop name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} name="name" />
            <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} error={errors.slug} name="slug" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} name="phone" />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} name="email" />
          </div>

          <Input
            label="Custom domain"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            error={errors.customDomain}
            name="customDomain"
          />

          <Input
            label="Owner user ID (UUID)"
            value={ownerUserId}
            onChange={(e) => setOwnerUserId(e.target.value)}
            error={errors.ownerUserId}
            name="ownerUserId"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300" />
              Active (is_active)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isBlocked} onChange={(e) => setIsBlocked(e.target.checked)} className="rounded border-slate-300" />
              Blocked
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isDeleted} onChange={(e) => setIsDeleted(e.target.checked)} className="rounded border-slate-300" />
              Deleted
            </label>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="active">active</option>
                <option value="blocked">blocked</option>
                <option value="deleted">deleted</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">New shop photo (optional)</div>
            <p className="mt-1 text-xs text-slate-500">
              PNG / JPG / WEBP, up to {MAX_SHOP_IMAGE_LABEL}. Replaces the binding in entity_images (R2 or local).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
                  setPhotoFile(null);
                  setPhotoPreviewUrl("");
                  setErrors((prev) => ({ ...prev, photo: undefined }));
                  if (!f) return;
                  if (f.size > MAX_SHOP_IMAGE_BYTES) {
                    setErrors((prev) => ({ ...prev, photo: SHOP_IMAGE_TOO_LARGE_MESSAGE }));
                    return;
                  }
                  setPhotoFile(f);
                  setPhotoPreviewUrl(URL.createObjectURL(f));
                }}
                className="text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
                aria-label="Replace shop photo"
              />
              {photoPreviewUrl ? <img src={photoPreviewUrl} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" /> : null}
            </div>
            {errors.photo ? <div className="mt-1 text-xs text-rose-600">{errors.photo}</div> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Address</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input label="Line 1" value={line1} onChange={(e) => setLine1(e.target.value)} name="line1" />
              <Input label="Line 2" value={line2} onChange={(e) => setLine2(e.target.value)} name="line2" />
              <Input label="Landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} name="landmark" />
              <Input label="Raw address" value={addrRaw} onChange={(e) => setAddrRaw(e.target.value)} name="raw" />
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} name="city" />
              <Input label="State" value={stateVal} onChange={(e) => setStateVal(e.target.value)} name="state" />
              <Input label="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} name="postal_code" />
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} name="country" />
              <Input label="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} error={errors.lat} name="lat" />
              <Input label="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} error={errors.lng} name="lng" />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setMapOpen(true)}
              >
                Pick on map
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="submit" loading={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={lat.trim() ? Number(lat) : undefined}
        initialLng={lng.trim() ? Number(lng) : undefined}
        onConfirm={({ lat: la, lng: ln }) => {
          setLat(String(la));
          setLng(String(ln));
          setErrors((prev) => ({ ...prev, lat: undefined, lng: undefined }));
        }}
      />
    </div>
  );
}
