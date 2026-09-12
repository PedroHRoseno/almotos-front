"use client";

import * as React from "react";
import { CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  name: string;
  label: string;
  error?: { message?: string };
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

export function FormField({
  name,
  label,
  error,
  required,
  children,
  className,
  hint,
}: FormFieldProps) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={name} className={error ? "text-destructive" : undefined}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-muted hover:text-ink"
                aria-label={`Ajuda: ${label}`}
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {children}
      {error?.message && (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
