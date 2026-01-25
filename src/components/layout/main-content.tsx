"use client";

import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={cn(
        "min-h-screen transition-[padding] duration-300 ease-in-out",
        collapsed ? "pl-[72px]" : "pl-64"
      )}
    >
      <div className="container mx-auto p-6">{children}</div>
    </main>
  );
}
