"use client";

import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={cn(
        "min-h-screen transition-[padding] duration-300 ease-in-out",
        collapsed ? "pl-[72px]" : "pl-64",
        "max-md:pl-0 max-md:pt-16"
      )}
    >
      <div className="container mx-auto p-4 md:p-6">{children}</div>
    </main>
  );
}
