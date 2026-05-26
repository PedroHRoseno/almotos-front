const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): { username: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { username: string; role: string };
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function decodeJwtPayload(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  return atob(padded);
}

/** Verifica expiração do JWT sem validar assinatura (apenas para UX no cliente). */
export function isStoredTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const decoded = JSON.parse(decodeJwtPayload(payload)) as { exp?: number };
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    // Não descarta o token no cliente se o payload não puder ser lido
    return false;
  }
}

export function getValidStoredToken(): string | null {
  const token = getStoredToken();
  if (!token) return null;
  if (isStoredTokenExpired(token)) {
    clearStoredAuth();
    return null;
  }
  return token;
}

/** Fonte de verdade da sessão: localStorage (evita race com setState após login). */
export function hasValidSession(): boolean {
  return !!getValidStoredToken();
}

export function shouldRedirectOnAuthError(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname !== "/login";
}
