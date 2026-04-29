import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/axios.js";
import { fetchGoUpcByCodeClient } from "../features/barcode/goUpcClient.js";

const BARCODE_PATTERN = /^[A-Za-z0-9\-_.]{6,64}$/;

function parseScannerWsMessage(raw) {
  try {
    const obj = JSON.parse(raw);
    if (obj?.type === "barcode_scanned" && obj?.payload?.barcode) return obj;
    return null;
  } catch {
    return null;
  }
}

async function lookupProductByBarcode(barcode) {
  const res = await api.get(`/api/admin/scanner-lookup?barcode=${encodeURIComponent(barcode)}`);
  return res.data;
}

export function useBarcodeProductLookup(message) {
  const [barcodeInput, setBarcodeInputState] = useState("");
  const [latestScan, setLatestScan] = useState(null);
  const [product, setProduct] = useState(null);
  const [globalProduct, setGlobalProduct] = useState(null);
  const [upc, setUpc] = useState(null);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [warning, setWarning] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [lookupSource, setLookupSource] = useState("none");
  const inFlightBarcodesRef = useRef(new Set());
  const debounceTimerRef = useRef(null);

  const lookupBarcode = useCallback(async (rawBarcode, source) => {
    const barcode = String(rawBarcode || "").trim();
    if (!barcode) {
      setProduct(null);
      setGlobalProduct(null);
      setUpc(null);
      setCategorySuggestions([]);
      setWarning(null);
      setError(null);
      setNotFound(false);
      setLookupSource("none");
      return;
    }
    if (!BARCODE_PATTERN.test(barcode)) {
      setError("Barcode format looks invalid.");
      setProduct(null);
      setGlobalProduct(null);
      setUpc(null);
      setCategorySuggestions([]);
      setWarning(null);
      setNotFound(false);
      setLookupSource("none");
      return;
    }
    if (inFlightBarcodesRef.current.has(barcode)) return;

    inFlightBarcodesRef.current.add(barcode);
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    if (source) {
      setLatestScan({ barcode, ...source });
    }

    try {
      const response = await lookupProductByBarcode(barcode);
      const data = response?.data || {};
      const hasLocalMatch = Boolean(data.product || data.globalProduct);
      let resolvedUpc = data.upc || null;
      let resolvedSource = response?.source || "backend";
      let resolvedWarning = response?.warning || null;

      if (!hasLocalMatch) {
        try {
          resolvedUpc = await fetchGoUpcByCodeClient(barcode);
          resolvedSource = "frontend_go_upc";
          resolvedWarning = null;
        } catch (goUpcErr) {
          if (!resolvedUpc) {
            resolvedSource = "backend";
            resolvedWarning = {
              message: goUpcErr?.message || "Go-UPC unavailable on frontend",
              retryable: Boolean(goUpcErr?.retryable)
            };
          }
        }
      }

      setProduct(data.product || null);
      setGlobalProduct(data.globalProduct || null);
      setUpc(resolvedUpc);
      setCategorySuggestions(Array.isArray(data.categorySuggestions) ? data.categorySuggestions : []);
      setWarning(resolvedWarning);
      setLookupSource(resolvedSource);
      setNotFound(!data.product && !data.globalProduct && !resolvedUpc);
    } catch (err) {
      setProduct(null);
      setGlobalProduct(null);
      setUpc(null);
      setCategorySuggestions([]);
      setWarning(null);
      setNotFound(false);
      setLookupSource("none");
      setError(err?.response?.data?.error?.message || err?.message || "Failed to fetch product.");
    } finally {
      inFlightBarcodesRef.current.delete(barcode);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!message) return;
    const parsed = parseScannerWsMessage(message.rawText);
    if (!parsed || parsed.type !== "barcode_scanned") return;
    const scannedAt = parsed.payload.scannedAt || new Date(message.receivedAt).toISOString();
    void lookupBarcode(parsed.payload.barcode, {
      deviceId: parsed.payload.deviceId,
      deviceName: parsed.payload.deviceName,
      scannedAt
    });
  }, [lookupBarcode, message]);

  const setBarcodeInput = useCallback(
    (value) => {
      setBarcodeInputState(value);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        void lookupBarcode(value);
      }, 350);
    },
    [lookupBarcode]
  );

  const lookupNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await lookupBarcode(barcodeInput);
  }, [barcodeInput, lookupBarcode]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
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
  };
}
