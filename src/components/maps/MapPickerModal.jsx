import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Modal } from "../ui/Modal.jsx";

// Fix default marker icons in bundlers (Vite).
const DefaultIcon = L.icon({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function MapPickerModal({ open, onClose, initialLat, initialLng, onConfirm }) {
  const initial = useMemo(() => {
    if (typeof initialLat === "number" && typeof initialLng === "number") return { lat: initialLat, lng: initialLng };
    // Default: Kochi-ish to be friendly; user can click anywhere.
    return { lat: 9.9312, lng: 76.2673 };
  }, [initialLat, initialLng]);

  const [picked, setPicked] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPicked(initial);
    setQuery("");
    setResults([]);
    setSearchError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      return;
    }
    if (q.length < 3) {
      setResults([]);
      setSearchError("Type at least 3 characters to search");
      return;
    }
    if (q.length > 80) return;

    setSearchLoading(true);
    setSearchError(null);

    const t = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", q);
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "0");
        url.searchParams.set("limit", "5");

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: "application/json"
          }
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();

        const mapped = Array.isArray(data)
          ? data
              .map((r) => ({
                id: `${r.place_id}`,
                name: r.display_name,
                lat: Number(r.lat),
                lng: Number(r.lon)
              }))
              .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
          : [];
        setResults(mapped);
        setSearchError(mapped.length ? null : "No results found");
      } catch (e) {
        if (e?.name === "AbortError") return;
        setResults([]);
        setSearchError(e?.message || "Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [open, query]);

  return (
    <Modal open={open} title="Pick location" onClose={onClose} size="xl">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-5 sm:items-start">
          <div className="sm:col-span-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="map-search">
              Search on map
            </label>
            <div className="mt-1">
              <input
                id="map-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search place / address…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200"
                aria-label="Search location"
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {searchLoading ? "Searching…" : searchError ? searchError : "Tip: click a result to move the map"}
            </div>
          </div>

          <div className="sm:col-span-2">
            {results.length ? (
              <div className="max-h-24 overflow-auto rounded-xl border border-slate-200 bg-white">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => {
                      setPicked({ lat: r.lat, lng: r.lng });
                    }}
                    title={r.name}
                  >
                    <div className="truncate font-semibold text-slate-900">{r.name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                No results
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-600">
          Click on the map to set the shop location.{" "}
          <span className="font-semibold text-slate-900">
            {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <MapContainer
            center={[picked.lat, picked.lng]}
            zoom={13}
            scrollWheelZoom
            className="h-[420px] w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPick onPick={setPicked} />
            <Recenter lat={picked.lat} lng={picked.lng} />
            <Marker position={[picked.lat, picked.lng]} />
          </MapContainer>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => {
              onConfirm?.(picked);
              onClose?.();
            }}
          >
            Use this location
          </button>
        </div>
      </div>
    </Modal>
  );
}

