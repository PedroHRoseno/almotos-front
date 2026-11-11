"use client";

import { DockedForm } from "@/components/layout/form-dock";
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
    <DockedForm
      id={`nfe:${target?.kind}:${target?.id}`}
      open={target !== null}
      onOpenChange={onOpenChange}
      title={"Nota fiscal"}
      description={<>{target?.title}</>}
    >
      {target && <FiscalPanel key={`${target.kind}-${target.id}`} sourceKind={target.kind} sourceId={target.id} onChanged={onChanged} />}
    </DockedForm>
  );
}
