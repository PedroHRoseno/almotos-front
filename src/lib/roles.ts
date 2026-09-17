export const USER_ROLES = ["ADMIN", "USER", "FINANCE"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const FINANCE_HOME = "/motos";

const FINANCE_BLOCKED_EXACT = new Set(["/"]);

const FINANCE_BLOCKED_PREFIXES = [
  "/compras",
  "/vendas",
  "/trocas",
  "/fluxo-caixa",
  "/relatorios",
  "/contas",
] as const;

export function isFinanceRole(role?: string | null): boolean {
  return role === "FINANCE";
}

export function isOpsRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "USER";
}

export function isFinanceBlockedPath(pathname: string): boolean {
  if (FINANCE_BLOCKED_EXACT.has(pathname)) return true;
  return FINANCE_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function homePathForRole(role?: string | null): string {
  return isFinanceRole(role) ? FINANCE_HOME : "/";
}
