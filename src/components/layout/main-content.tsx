"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";
import { useDockOffset } from "./form-dock";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const dockOffset = useDockOffset();

  return (
    <main
      style={{ "--dock-offset": `${isLoginPage ? 0 : dockOffset}px` } as React.CSSProperties}
      className={cn(
          "min-h-screen bg-canvas transition-[padding] duration-300 ease-out-expo",
        !isLoginPage && collapsed && "pl-[72px]",
        !isLoginPage && !collapsed && "pl-64",
        "max-md:pl-0 max-md:pt-16",
        "lg:pr-[var(--dock-offset)]"
      )}
    >
      <div className={cn("mx-auto w-full max-w-[1400px]", !isLoginPage && "p-4 md:p-6 lg:p-8")}>
        {children}
      </div>
    </main>
  );
}
