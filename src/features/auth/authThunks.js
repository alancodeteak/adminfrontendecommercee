import { createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "./authService.js";
import { clearAuthSession, getToken, setToken } from "../../utils/tokenStorage.js";

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const requestOtp = createAsyncThunk(
  "auth/requestOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await authService.requestOtp({ email });
      return data;
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || "Failed to send OTP";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const data = await authService.verifyOtp({ email, otp });
      const token = data?.accessToken;
      if (token) setToken(token);
      return data;
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || "Invalid OTP";
      return rejectWithValue(message);
    }
  }
);

export const restoreSession = createAsyncThunk("auth/restoreSession", async () => {
  const token = getToken();
  if (!token) return { token: null };
  const payload = decodeJwtPayload(token);
  return {
    token,
    user: payload?.sub ? { id: payload.sub } : null,
    role: payload?.role ?? null
  };
});

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  clearAuthSession();
  return true;
});

