"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DivergencePill, FiscalStatusPill } from "@/components/fiscal/fiscal-status-pill";
import type { FiscalDirection, FiscalSummary } from "@/types";

/** Célula "NF-e" das listas: situação + botão que abre o painel lateral. */
export function FiscalCell({
  summary,
  id,
  directions,
  onOpen,
}: {
  summary: FiscalSummary;
  id: number;
  directions: FiscalDirection[];
  onOpen: () => void;
}) {
  const item = summary[String(id)];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item?.divergence && <DivergencePill />}
      {directions.map((direction) => (
        <span key={direction} className="flex items-center gap-1">
          {directions.length > 1 && (
            <span className="text-[11px] font-medium text-ink-subtle">{direction === "ENTRADA" ? "E" : "S"}</span>
          )}
          <FiscalStatusPill status={item?.statuses?.[direction]} />
        </span>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onOpen}
        title="Nota fiscal"
        aria-label="Abrir nota fiscal"
      >
        <Receipt className="h-4 w-4" />
      </Button>
    </div>
  );
}
