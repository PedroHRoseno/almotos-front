"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

export function ThemeToggle({
  className,
  placement = "bottom-end",
}: {
  className?: string;
  placement?: "bottom-end" | "top-start";
}) {
  const { preference, resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const CurrentIcon =
    preference === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Escolher tema"
        title="Tema"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full border border-line",
          "bg-surface text-ink-muted transition-colors hover:border-ink-subtle hover:text-ink"
        )}
      >
        <CurrentIcon className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 min-w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg",
            placement === "bottom-end" && "right-0 mt-2",
            placement === "top-start" && "left-0 bottom-full mb-2"
          )}
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              onClick={() => {
                setPreference(value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                preference === value
                  ? "bg-brand/15 text-brand"
                  : "text-ink-muted hover:bg-surface-hover hover:text-ink"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
