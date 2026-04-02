import { api } from "../../api/axios.js";

export async function requestOtp({ email }) {
  const res = await api.post("/api/superadmin/auth/request-otp", { email });
  return res.data; // { ok: true }
}

export async function verifyOtp({ email, otp }) {
  const res = await api.post("/api/superadmin/auth/verify-otp", { email, otp });
  return res.data; // { accessToken, user, role }
}

