import { useDispatch, useSelector } from "react-redux";
import { logoutUser, requestOtp, verifyOtp } from "../features/auth/authThunks.js";
import {
  selectAuthLoading,
  selectIsAuthenticated,
  selectUser
} from "../features/auth/authSelectors.js";

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  return {
    user,
    isAuthenticated,
    loading,
    requestOtp: (email) => dispatch(requestOtp({ email })),
    verifyOtp: (email, otp) => dispatch(verifyOtp({ email, otp })),
    logout: () => dispatch(logoutUser())
  };
}

