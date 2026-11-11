import { cn } from "@/lib/utils";
import { FISCAL_STATUS_LABEL } from "@/lib/fiscal";
import type { FiscalStatus } from "@/types";

// Fica aqui (e não em src/lib) porque o Tailwind só varre app/ e components/.
const FISCAL_STATUS_CLASS: Record<FiscalStatus, string> = {
  PROCESSANDO: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  AUTORIZADA: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  REJEITADA: "bg-red-500/15 text-red-800 dark:text-red-300",
  DENEGADA: "bg-red-500/15 text-red-800 dark:text-red-300",
  CANCELADA: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  ERRO: "bg-red-500/15 text-red-800 dark:text-red-300",
};

export function FiscalStatusPill({
  status,
  className,
}: {
  status?: FiscalStatus | null;
  className?: string;
}) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-ink-muted",
          className
        )}
      >
        Sem nota
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        FISCAL_STATUS_CLASS[status],
        className
      )}
    >
      {FISCAL_STATUS_LABEL[status]}
    </span>
  );
}

export function DivergencePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white",
        className
      )}
    >
      Divergência
    </span>
  );
}
