"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatBRL, parseBRLInput } from "@/lib/masks";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
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

export function CurrencyInput({
  value,
  onValueChange,
  error,
  className,
  onBlur,
  onKeyDown,
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      value={value != null && !Number.isNaN(value) ? formatBRL(value) : ""}
      className={cn("tabular-nums", error && "border-destructive", className)}
      onChange={() => {
        /* o valor é controlado por keydown para não reinterpretar R$ 18.000,00 */
      }}
      onPaste={(event) => {
        event.preventDefault();
        onValueChange(parseBRLInput(event.clipboardData.getData("text")));
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key >= "0" && event.key <= "9") {
          event.preventDefault();
          onValueChange(appendDigit(value, event.key));
          return;
        }
        if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          onValueChange(removeLastDigit(value));
        }
      }}
      onBlur={onBlur}
    />
  );
}
