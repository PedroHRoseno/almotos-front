"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <main
      className={cn(
        "min-h-screen transition-[padding] duration-300 ease-in-out",
        !isLoginPage && collapsed && "pl-[72px]",
        !isLoginPage && !collapsed && "pl-64",
        "max-md:pl-0 max-md:pt-16"
      )}
    >
      <div className={cn("container mx-auto", !isLoginPage && "p-4 md:p-6")}>
        {children}
      </div>
    </main>
  );
}
