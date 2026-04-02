import axios from "axios";
import { getToken, removeToken } from "../utils/tokenStorage.js";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
  timeout: 20_000
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Keep it simple: drop token; slice will also react to 401 in thunk results.
      removeToken();
    }
    return Promise.reject(error);
  }
);

