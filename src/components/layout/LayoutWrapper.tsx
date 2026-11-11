"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { FormDock } from "./form-dock";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {!isLoginPage && <AppSidebar />}
      {children}
      {!isLoginPage && <FormDock />}
    </>
  );
}
