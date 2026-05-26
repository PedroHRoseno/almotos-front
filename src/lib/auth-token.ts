const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/** Verifica expiração do JWT sem validar assinatura (apenas para UX no cliente). */
export function isStoredTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getValidStoredToken(): string | null {
  const token = getStoredToken();
  if (!token || isStoredTokenExpired(token)) {
    clearStoredAuth();
    return null;
  }
  return token;
}

export function shouldRedirectOnAuthError(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname !== "/login";
}
