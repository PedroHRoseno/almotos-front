"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FiscalPanel } from "@/components/fiscal/fiscal-panel";
import type { FiscalSourceKind } from "@/types";

/** Painel lateral "Nota fiscal" aberto a partir de uma linha de venda/compra/troca. */
export function FiscalSheet({
  target,
  onOpenChange,
  onChanged,
}: {
  target: { kind: Exclude<FiscalSourceKind, "RETURN">; id: number; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  return (
    <Sheet modal={false} open={target !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nota fiscal</SheetTitle>
          <SheetDescription>{target?.title}</SheetDescription>
        </SheetHeader>
        {target && <FiscalPanel key={`${target.kind}-${target.id}`} sourceKind={target.kind} sourceId={target.id} onChanged={onChanged} />}
      </SheetContent>
    </Sheet>
  );
}
