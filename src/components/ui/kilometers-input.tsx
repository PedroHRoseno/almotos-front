"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatKmInput, parseKmInput } from "@/lib/masks";
import { cn } from "@/lib/utils";

export interface KilometersInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: number | null | undefined;
  onValueChange: (value: number | undefined) => void;
  error?: boolean;
}

function appendDigit(current: number | null | undefined, digit: string): number {
  const asInt = String(Math.trunc(Math.abs(current || 0)));
  const next = Number(`${asInt === "0" ? "" : asInt}${digit}`);
  return Number.isNaN(next) ? 0 : next;
}

function removeLastDigit(current: number | null | undefined): number | undefined {
  const asInt = String(Math.trunc(Math.abs(current || 0)));
  if (asInt.length <= 1) return undefined;
  return Number(asInt.slice(0, -1));
}

function selectionCoversAll(input: HTMLInputElement): boolean {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  return input.value.length > 0 && start === 0 && end === input.value.length;
}

export function KilometersInput({
  value,
  onValueChange,
  error,
  className,
  onBlur,
  onKeyDown,
  ...props
}: KilometersInputProps) {
  const display = formatKmInput(value);

  return (
    <div className="relative">
      <Input
        {...props}
        inputMode="numeric"
        autoComplete="off"
        value={display}
        className={cn("tabular-nums pr-10", error && "border-destructive", className)}
        onChange={() => undefined}
        onPaste={(event) => {
          event.preventDefault();
          onValueChange(parseKmInput(event.clipboardData.getData("text")));
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const input = event.currentTarget;
          if (event.key >= "0" && event.key <= "9") {
            event.preventDefault();
            if (selectionCoversAll(input)) {
              onValueChange(Number(event.key));
              return;
            }
            onValueChange(appendDigit(value, event.key));
            return;
          }
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            if (selectionCoversAll(input) || value == null || value === 0) {
              onValueChange(undefined);
              return;
            }
            onValueChange(removeLastDigit(value));
          }
        }}
        onBlur={onBlur}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">
        km
      </span>
    </div>
  );
}
