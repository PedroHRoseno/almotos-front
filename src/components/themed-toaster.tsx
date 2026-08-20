"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster position="top-right" richColors theme={resolved} />;
}
