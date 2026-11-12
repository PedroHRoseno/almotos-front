"use client";

import { AlertTriangle, Ban, Coins, Loader2, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCents, usePlateBalance } from "@/lib/plate-balance-store";
import { cn } from "@/lib/utils";
import type { PlateBalance } from "@/types";

const TONE: Record<PlateBalance["status"], string> = {
  OK: "border-line bg-surface text-ink-muted",
  LOW: "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300",
  EMPTY: "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-300",
  UNKNOWN: "border-line bg-surface text-ink-subtle",
};

export function balanceLabel(balance: PlateBalance | null): string {
  if (!balance) return "Saldo…";
  switch (balance.status) {
    case "OK":
      return `Saldo ${formatCents(balance.balanceCents)} · ~${balance.estimatedLookups ?? 0} consultas`;
    case "LOW":
      return `Saldo baixo: ${formatCents(balance.balanceCents)} · ~${balance.estimatedLookups ?? 0} consultas`;
    case "EMPTY":
      return "Saldo esgotado · preencha manualmente";
    default:
      return "Saldo indisponível";
  }
}

export function PlateBalanceBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { balance, loading, refresh } = usePlateBalance();
  const status = balance?.status ?? "UNKNOWN";
  const Icon = status === "EMPTY" ? Ban : status === "LOW" ? AlertTriangle : Coins;
  const checked = balance?.checkedAt ? new Date(balance.checkedAt).toLocaleTimeString("pt-BR") : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label={`${balanceLabel(balance)}. Clique para atualizar.`}
            data-status={status}
            className={cn(
              "inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90",
              TONE[status],
              className
            )}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">
              {compact && status === "OK" ? formatCents(balance?.balanceCents) : balanceLabel(balance)}
            </span>
            <RefreshCw className="h-3 w-3 shrink-0 opacity-60" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <p className="font-medium">Saldo da Simples API (consulta por placa)</p>
          <p className="text-ink-muted">
            Cada consulta custa {formatCents(balance?.lookupPriceCents ?? 10)}, mesmo quando a placa não tem dados.
            Alerta de saldo baixo abaixo de {formatCents(balance?.lowThresholdCents ?? 500)}.
          </p>
          {status === "UNKNOWN" && (
            <p className="text-ink-muted">Não foi possível ler o saldo agora (ou o token não está configurado).</p>
          )}
          {checked && <p className="text-ink-subtle">Atualizado às {checked}. Clique para atualizar.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
