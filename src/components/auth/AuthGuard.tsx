"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasValidSession } from "@/lib/auth-token";
import { FINANCE_HOME, isFinanceBlockedPath, isFinanceRole } from "@/lib/roles";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authReady, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sessionActive = authReady && hasValidSession();
  const financeBlocked =
    sessionActive && isFinanceRole(user?.role) && isFinanceBlockedPath(pathname);

  useEffect(() => {
    if (!authReady || pathname === "/login") {
      return;
    }

    if (!hasValidSession()) {
      console.error("[AuthGuard] Sem sessão válida. Redirecionando para /login.", {
        pathname,
      });
      router.replace("/login");
      return;
    }

    if (isFinanceRole(user?.role) && isFinanceBlockedPath(pathname)) {
      router.replace(FINANCE_HOME);
    }
  }, [authReady, pathname, router, user?.role]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if ((pathname !== "/login" && !sessionActive) || financeBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
