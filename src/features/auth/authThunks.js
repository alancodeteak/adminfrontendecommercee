import { createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "./authService.js";
import { getToken, removeToken, setToken } from "../../utils/tokenStorage.js";

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
  // We only have a token in storage; user can be fetched later if needed.
  return { token };
});

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  removeToken();
  return true;
});

