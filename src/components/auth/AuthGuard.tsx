"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não proteger a rota de login
    if (pathname === "/login") {
      return;
    }

    // Verificar autenticação para todas as outras rotas
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, pathname]);

  // Mostrar loading enquanto verifica autenticação
  if (pathname !== "/login" && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
