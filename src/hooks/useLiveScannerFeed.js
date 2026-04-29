import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const SCANNER_WS_URL = import.meta.env.VITE_SCANNER_WS_URL || "";
const BARCODE_PATTERN = /^[A-Za-z0-9\-_.]{6,64}$/;
const MAX_RAW_MESSAGE_SIZE = 4096;
const DEDUPE_WINDOW_MS = 1500;

function scannerStoreKey(item) {
  return `${item.scannerId}::${item.last_seen || "na"}`;
}

function normalizeScanPayload(raw) {
  const barcode = String(raw?.barcode || "").trim();
  const scannerId = String(raw?.deviceId || raw?.scannerId || "").trim();
  if (!barcode || !scannerId || !BARCODE_PATTERN.test(barcode)) return null;
  return {
    scannerId,
    scannerName: String(raw?.deviceName || raw?.scannerName || scannerId).trim(),
    barcode,
    timestamp: raw?.scannedAt || raw?.timestamp || new Date().toISOString()
  };
}

function toWrappedMessage(item) {
  return {
    rawText: JSON.stringify({
      type: "barcode_scanned",
      payload: {
        barcode: item.barcode,
        deviceId: item.scannerId,
        deviceName: item.scannerName,
        scannedAt: item.timestamp
      }
    }),
    receivedAt: Date.now()
  };
}

export function useLiveScannerFeed() {
  const [socketState, setSocketState] = useState("connecting");
  const [socketError, setSocketError] = useState(null);
  const [scanners, setScanners] = useState({});
  const [scans, setScans] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const connectionSource = SCANNER_WS_URL ? "lan_ws" : "backend_socket";
  const dedupeMapRef = useRef(new Map());

  useEffect(() => {
    if (!SCANNER_WS_URL) {
      const socket = io(API_BASE, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 15000,
        timeout: 10000
      });

      socket.on("connect", () => {
        setSocketState("connected");
        setSocketError(null);
      });

      socket.on("disconnect", (reason) => {
        setSocketState("disconnected");
        setSocketError(`Disconnected: ${reason}`);
      });

      socket.on("connect_error", (err) => {
        setSocketState("disconnected");
        setSocketError(err?.message || "Connection error");
      });

      socket.on("state_snapshot", (snapshot) => {
        const list = snapshot?.scanners || [];
        const nextMap = Object.fromEntries(list.map((s) => [scannerStoreKey(s), s]));
        setScanners(nextMap);
        setScans((snapshot?.scans || []).slice(0, 200));
      });

      socket.on("scan_received", (item) => {
        const normalized = normalizeScanPayload(item);
        if (!normalized) return;
        setLastMessage(toWrappedMessage(normalized));
        setScans((prev) => [normalized, ...prev].slice(0, 200));
        setScanners((prev) => ({
          ...prev,
          [scannerStoreKey({
            scannerId: normalized.scannerId,
            last_seen: normalized.timestamp
          })]: {
            scannerId: normalized.scannerId,
            name: normalized.scannerName || normalized.scannerId,
            status: "online",
            last_seen: normalized.timestamp
          }
        }));
      });

      return () => {
        socket.removeAllListeners();
        socket.disconnect();
      };
    }

    let ws = null;
    let retryTimer = null;
    let isDisposed = false;
    let reconnectAttempt = 0;

    const handleIncomingScan = (rawPayload) => {
      const normalized = normalizeScanPayload(rawPayload);
      if (!normalized) return;
      const now = Date.now();
      const dedupeKey = `${normalized.scannerId}::${normalized.barcode}`;
      const lastSeen = dedupeMapRef.current.get(dedupeKey) || 0;
      if (now - lastSeen < DEDUPE_WINDOW_MS) return;
      dedupeMapRef.current.set(dedupeKey, now);
      for (const [key, ts] of dedupeMapRef.current.entries()) {
        if (now - ts > DEDUPE_WINDOW_MS * 3) dedupeMapRef.current.delete(key);
      }
      setLastMessage(toWrappedMessage(normalized));
      setScans((prev) => [normalized, ...prev].slice(0, 200));
      setScanners((prev) => ({
        ...prev,
        [scannerStoreKey({
          scannerId: normalized.scannerId,
          last_seen: normalized.timestamp
        })]: {
          scannerId: normalized.scannerId,
          name: normalized.scannerName,
          status: "online",
          last_seen: normalized.timestamp
        }
      }));
    };

    const connect = () => {
      if (isDisposed) return;
      setSocketState("connecting");
      ws = new WebSocket(SCANNER_WS_URL);

      ws.onopen = () => {
        reconnectAttempt = 0;
        setSocketState("connected");
        setSocketError(null);
      };

      ws.onmessage = (evt) => {
        if (typeof evt?.data !== "string" || evt.data.length > MAX_RAW_MESSAGE_SIZE) return;
        try {
          const parsed = JSON.parse(evt.data);
          if (parsed?.type === "barcode_scanned") {
            handleIncomingScan(parsed?.payload);
            return;
          }
          handleIncomingScan(parsed);
        } catch {
          // Ignore malformed messages, keep socket alive.
        }
      };

      ws.onerror = () => {
        setSocketError("LAN scanner socket error");
      };

      ws.onclose = () => {
        if (isDisposed) return;
        setSocketState("disconnected");
        const backoffMs = Math.min(15000, 1000 * 2 ** reconnectAttempt);
        reconnectAttempt += 1;
        retryTimer = window.setTimeout(connect, backoffMs);
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const scannerList = useMemo(
    () =>
      Object.values(scanners).sort((a, b) =>
        String(b?.last_seen || "").localeCompare(String(a?.last_seen || ""))
      ),
    [scanners]
  );

  const onlineScanners = scannerList.filter((s) => s.status === "online");
  const offlineScanners = scannerList.filter((s) => s.status === "offline");

  return {
    socketState,
    socketError,
    scannerList,
    onlineScanners,
    offlineScanners,
    scans,
    lastMessage,
    connectionSource
  };
}
