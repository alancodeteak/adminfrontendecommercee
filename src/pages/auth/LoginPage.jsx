import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { requestOtp, verifyOtp } from "../../features/auth/authThunks.js";
import { selectAuthError, selectAuthLoading, selectIsAuthenticated } from "../../features/auth/authSelectors.js";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { FormError } from "../../components/ui/FormError.jsx";

const SUPERADMIN_EMAIL = import.meta.env.VITE_SUPERADMIN_EMAIL || "";

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [touched, setTouched] = useState({ otp: false });

  const otpError = useMemo(() => {
    if (!touched.otp) return null;
    if (!otp) return "OTP is required";
    if (!/^\d{6}$/.test(otp)) return "Enter the 6-digit OTP";
    return null;
  }, [otp, touched.otp]);

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
  }

  async function onSendOtp(e) {
    e.preventDefault();
    if (!SUPERADMIN_EMAIL) {
      alert("Missing VITE_SUPERADMIN_EMAIL. Add it to frontend/.env and restart the dev server.");
      return;
    }
    const res = await dispatch(requestOtp({ email: SUPERADMIN_EMAIL }));
    if (requestOtp.fulfilled.match(res)) setOtpSent(true);
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setTouched({ otp: true });
    if (otpError) return;
    const res = await dispatch(verifyOtp({ email: SUPERADMIN_EMAIL, otp }));
    if (verifyOtp.fulfilled.match(res)) navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-sm font-semibold text-indigo-700">CodeTeak</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the OTP sent to your email</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={otpSent ? onVerifyOtp : onSendOtp}>
            <FormError message={error} />

            <Input
              label="OTP"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              autoComplete="one-time-code"
              error={otpError}
            />

            {!otpSent ? (
              <Button type="submit" loading={loading}>
                {loading ? "Sending…" : "Send OTP"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button type="submit" loading={loading}>
                  {loading ? "Verifying…" : "Verify OTP"}
                </Button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setOtp("");
                    setTouched({ otp: false });
                    setOtpSent(false);
                  }}
                >
                  Resend OTP
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to secure access policies.
        </p>
      </div>
    </div>
  );
}

