"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
        "transition-[background-color,border-color,color,transform] duration-200 ease-out-expo",
        "active:scale-[0.97]",
        active
          ? "border-brand/40 bg-brand/15 text-brand"
          : "border-line bg-surface/60 text-ink-muted hover:border-ink-subtle hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}
