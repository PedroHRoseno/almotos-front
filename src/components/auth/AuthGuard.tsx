"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasValidSession } from "@/lib/auth-token";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sessionActive = authReady && hasValidSession();

  useEffect(() => {
    if (!authReady || pathname === "/login") {
      return;
    }

    if (!hasValidSession()) {
      router.replace("/login");
    }
  }, [authReady, pathname, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pathname !== "/login" && !sessionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
