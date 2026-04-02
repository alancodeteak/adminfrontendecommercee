import { createSlice } from "@reduxjs/toolkit";
import { logoutUser, requestOtp, restoreSession, verifyOtp } from "./authThunks.js";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token ?? null;
        state.isAuthenticated = Boolean(state.token);
        const role = action.payload?.role ?? null;
        if (role) {
          state.user = { ...(state.user ?? {}), ...(action.payload?.user ?? {}), role };
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send OTP";
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.accessToken ?? null;
        const baseUser = action.payload?.user ?? null;
        const role = action.payload?.role ?? null;
        state.user = baseUser ? { ...baseUser, ...(role ? { role } : {}) } : null;
        state.isAuthenticated = Boolean(state.token);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Invalid OTP";
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export default authSlice.reducer;

