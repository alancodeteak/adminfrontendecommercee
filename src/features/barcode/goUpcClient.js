const GO_UPC_API_BASE = "https://go-upc.com/api/v1";
const GO_UPC_TOKEN = import.meta.env.VITE_GO_UPC_API_TOKEN || "";
const GO_UPC_TIMEOUT_MS = Number(import.meta.env.VITE_GO_UPC_TIMEOUT_MS || 8000);
const BARCODE_PATTERN = /^[A-Za-z0-9\-_.]{6,64}$/;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export async function fetchGoUpcByCodeClient(code) {
  if (!GO_UPC_TOKEN.trim()) {
    const err = new Error("Go-UPC token missing in frontend env");
    err.code = "missing_token";
    throw err;
  }

  const barcode = String(code || "").trim();
  if (!BARCODE_PATTERN.test(barcode)) {
    const err = new Error("Invalid barcode format");
    err.code = "invalid_barcode";
    throw err;
  }

  const attempts = 2;
  let lastErr = null;

  for (let i = 0; i <= attempts; i += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), GO_UPC_TIMEOUT_MS);
    try {
      const response = await fetch(`${GO_UPC_API_BASE}/code/${encodeURIComponent(barcode)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GO_UPC_TOKEN}`
        },
        signal: controller.signal
      });
      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }

      if (!response.ok) {
        const err = new Error(parsed?.message || "Go-UPC request failed");
        err.status = response.status;
        err.retryable = isRetryableStatus(response.status);
        err.code = response.status === 429 ? "rate_limited" : "http_error";
        throw err;
      }

      return {
        code: parsed?.code || barcode,
        codeType: parsed?.codeType || null,
        inferred: Boolean(parsed?.inferred),
        product: parsed?.product || null,
        raw: parsed
      };
    } catch (err) {
      const isAbort = err?.name === "AbortError";
      const retryable = isAbort || err?.retryable === true;
      lastErr = err;
      if (!retryable || i === attempts) break;
      await sleep(200 * 2 ** i);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastErr || new Error("Go-UPC lookup failed");
}
