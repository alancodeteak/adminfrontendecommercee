const TOKEN_KEY = "auth.token";

export function setToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function clearAuthSession() {
  removeToken();
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("auth.")) {
      localStorage.removeItem(key);
    }
  }
  sessionStorage.clear();
}

