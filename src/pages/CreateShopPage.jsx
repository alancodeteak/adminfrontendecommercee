import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const message = err?.response?.data?.error?.message || err?.message || "Failed to create shop";
  const details = err?.response?.data?.error?.details;
  const fieldErrors = {};
  const rawMessage = String(message || "");
  const isDomainConflict =
    err?.response?.status === 409 &&
    /domain/i.test(rawMessage) &&
    /(already exists|duplicate|unique|conflict)/i.test(rawMessage);

  // When backend sends ZodError directly as details, it usually has `issues`.
  const issues = details?.issues || details?.cause?.issues || details?.errors;
  if (Array.isArray(issues)) {
    for (const issue of issues) {
      const path = Array.isArray(issue.path) ? issue.path.join(".") : issue.path;
      if (!path) continue;
      const key = String(path)
        .replace(/^customDomain$/, "customDomain")
        .replace(/^domain$/, "domain")
        .replace(/^ownerUserId$/, "ownerUserId");
      fieldErrors[key] = issue.message || "Invalid value";
    }
  }

  if (isDomainConflict || /domain.*(already exists|duplicate|unique)/i.test(rawMessage)) {
    fieldErrors.domain = "Shop domain already exists";
  }

  return {
    message: fieldErrors.domain ? "Shop domain already exists" : message,
    fieldErrors
  };
}

export function CreateShopPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});
  const [mapOpen, setMapOpen] = useState(false);

  const [slug, setSlug] = useState("");
  const [publicId, setPublicId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domain, setDomain] = useState("");
  const [serviceAreaRadiusMeters, setServiceAreaRadiusMeters] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState("active");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [addrRaw, setAddrRaw] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const slugSuggested = useMemo(() => {
    if (slug.trim()) return normalizeSlug(slug);
    if (name.trim()) return normalizeSlug(name);
    return "";
  }, [slug, name]);

  function validateClient() {
    const next = {};
    const finalSlug = normalizeSlug(slugSuggested);

    if (!name.trim()) next.name = "Shop name is required";
    if (!finalSlug) next.slug = "Slug is required (letters/numbers/hyphens)";
    if (finalSlug && finalSlug.length > 64) next.slug = "Slug must be 64 characters or less";
    if (finalSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) next.slug = "Invalid slug format";
    if (publicId.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publicId.trim())) {
      next.publicId = "Invalid public id format";
    }
    if (publicId.trim() && (publicId.trim().length < 3 || publicId.trim().length > 128)) {
      next.publicId = "Public ID must be 3-128 characters";
    }

    if (phone.trim() && !/^[0-9+][0-9]{7,31}$/.test(phone.trim())) next.phone = "Invalid phone format";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Invalid email";
    if (ownerUserId.trim() && !/^[0-9a-f-]{36}$/i.test(ownerUserId.trim())) {
      next.ownerUserId = "Invalid UUID";
    }
    if (
      customDomain.trim() &&
      !/^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(
        customDomain.trim()
      )
    ) {
      next.customDomain = "Invalid domain format";
    }
    if (domain.trim().length > 255) {
      next.domain = "Domain must be 255 characters or less";
    }
    if (
      domain.trim() &&
      !/^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(domain.trim())
    ) {
      next.domain = "Invalid domain format";
    }
    let radiusMetersV;
    if (serviceAreaRadiusMeters.trim()) {
      radiusMetersV = Number(serviceAreaRadiusMeters);
      if (!Number.isInteger(radiusMetersV) || radiusMetersV < 1) {
        next.serviceAreaRadiusMeters = "Service radius must be an integer of at least 1 meter";
      }
    }

    const latV = lat.trim() ? Number(lat) : null;
    const lngV = lng.trim() ? Number(lng) : null;
    if ((latV !== null && Number.isNaN(latV)) || (lngV !== null && Number.isNaN(lngV))) {
      next.lat = "Latitude/Longitude must be numbers";
    } else if ((latV !== null) !== (lngV !== null)) {
      next.lat = "Latitude and Longitude must be provided together";
      next.lng = "Latitude and Longitude must be provided together";
    } else if (latV !== null && (latV < -90 || latV > 90)) {
      next.lat = "Latitude must be between -90 and 90";
    } else if (lngV !== null && (lngV < -180 || lngV > 180)) {
      next.lng = "Longitude must be between -180 and 180";
    }

    setErrors(next);
    return { ok: Object.keys(next).length === 0, finalSlug, latV, lngV, radiusMetersV };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const { ok, finalSlug, latV, lngV, radiusMetersV } = validateClient();
    if (!ok) return;

    const address =
      addrRaw.trim() || city.trim() || state.trim() || country.trim() || latV !== null
        ? {
            raw: addrRaw.trim() || undefined,
            city: city.trim() || undefined,
            state: state.trim() || undefined,
            country: country.trim() || undefined,
            lat: latV ?? undefined,
            lng: lngV ?? undefined
          }
        : undefined;

    setLoading(true);
    try {
      const res = await api.post("/api/superadmin/shops", {
        slug: finalSlug,
        publicId: publicId.trim() || undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        customDomain: customDomain.trim() || undefined,
        domain: domain.trim() || undefined,
        serviceAreaRadiusMeters: radiusMetersV,
        ownerUserId: ownerUserId.trim() || undefined,
        isActive,
        status,
        isBlocked,
        isDeleted,
        address
      });
      const created = res.data?.data?.shop;

      if (created?.id && photoFile) {
        const fd = new FormData();
        fd.append("image", photoFile);
        await api.post(`/api/superadmin/shops/${created.id}/entity-images`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      navigate("/shops", { replace: true, state: { createdId: created?.id } });
    } catch (err) {
      const parsed = parseBackendErrors(err);
      setFormError(parsed.message);
      setErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create Shop</h2>
          <p className="mt-1 text-sm text-slate-500">Add a new shop to the platform.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => navigate("/shops")}
        >
          Back
        </button>
      </div>

      <Card className="p-5 sm:p-6">
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <FormError message={formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Shop name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mart Kerala"
              error={errors.name}
              name="name"
            />
            <Input
              label="Slug"
              value={slugSuggested}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. mart-kerala"
              error={errors.slug}
              name="slug"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Public ID (optional)"
              value={publicId}
              onChange={(e) => setPublicId(normalizeSlug(e.target.value))}
              placeholder="e.g. brigade-hyper-mart-202603110807"
              error={errors.publicId}
              name="publicId"
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              error={errors.phone}
              name="phone"
            />
            <Input
              label="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shop@example.com"
              error={errors.email}
              name="email"
            />
          </div>

          <Input
            label="Owner user ID (optional UUID)"
            value={ownerUserId}
            onChange={(e) => setOwnerUserId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            error={errors.ownerUserId}
            name="ownerUserId"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300" />
              Active
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

          <Input
            label="Custom domain (optional)"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="myshop.com"
            error={errors.customDomain}
            name="customDomain"
          />
          <Input
            label="Domain (optional)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="shop.example.com"
            error={errors.domain}
            name="domain"
          />
          <div>
            <Input
              label="Service Radius (meters) (optional)"
              type="number"
              value={serviceAreaRadiusMeters}
              onChange={(e) => setServiceAreaRadiusMeters(e.target.value)}
              placeholder="e.g. 5000 meters"
              error={errors.serviceAreaRadiusMeters}
              name="serviceAreaRadiusMeters"
            />
            <p className="mt-1 text-xs text-slate-500">Enter service radius in meters</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Shop photo (optional)</div>
                <div className="mt-1 text-xs text-slate-500">PNG / JPG / WEBP, up to {MAX_SHOP_IMAGE_LABEL}.</div>
              </div>
              {photoFile ? (
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
                    setPhotoFile(null);
                    setPhotoPreviewUrl("");
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
                    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
                      setErrors((prev) => ({ ...prev, photo: "Only PNG, JPG, WEBP are allowed" }));
                      return;
                    }
                    setPhotoFile(f);
                    setPhotoPreviewUrl(URL.createObjectURL(f));
                  }}
                  className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  aria-label="Upload shop photo"
                />
                {errors.photo ? <div className="text-xs text-rose-600">{errors.photo}</div> : null}
              </div>
              <div className="flex items-center justify-center">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="Shop preview"
                    className="h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-slate-50 ring-1 ring-slate-200" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Address (optional)</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input
                label="Raw address"
                value={addrRaw}
                onChange={(e) => setAddrRaw(e.target.value)}
                placeholder="MG Road, Kochi"
                name="address.raw"
              />
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kochi"
                name="address.city"
              />
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Kerala"
                name="address.state"
              />
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                name="address.country"
              />
              <Input
                label="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="9.9312"
                error={errors.lat}
                name="address.lat"
              />
              <Input
                label="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="76.2673"
                error={errors.lng}
                name="address.lng"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">Tip: pick the exact location from the map.</div>
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
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => navigate("/shops")}
            >
              Cancel
            </button>
            <Button type="submit" loading={loading}>
              {loading ? "Creating…" : "Create shop"}
            </Button>
          </div>
        </form>
      </Card>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={lat.trim() ? Number(lat) : undefined}
        initialLng={lng.trim() ? Number(lng) : undefined}
        onConfirm={({ lat: pickedLat, lng: pickedLng }) => {
          setLat(String(pickedLat));
          setLng(String(pickedLng));
          setErrors((prev) => ({ ...prev, lat: undefined, lng: undefined }));
        }}
      />
    </div>
  );
}

