"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  FiscalDirection,
  FiscalDivergence,
  FiscalEnvironment,
  FiscalProblemArea,
  FiscalStatus,
  FiscalStatusInfo,
  FiscalSummary,
} from "@/types";

export const FISCAL_STATUS_LABEL: Record<FiscalStatus, string> = {
  PROCESSANDO: "Processando",
  AUTORIZADA: "Autorizada",
  REJEITADA: "Rejeitada",
  DENEGADA: "Denegada",
  CANCELADA: "Cancelada",
  ERRO: "Erro no envio",
};

export const DIVERGENCE_LABEL: Record<FiscalDivergence, string> = {
  PENDING: "Divergência aberta",
  CANCELLED_AT_SEFAZ: "Resolvida: nota cancelada",
  RETURN_ISSUED: "Resolvida: devolução emitida",
  KEPT: "Resolvida: nota mantida",
};

export const ENVIRONMENT_LABEL: Record<FiscalEnvironment, string> = {
  PRODUCAO: "Produção",
  HOMOLOGACAO: "Homologação",
  MOCK: "Simulado (QA)",
};

export const DIRECTION_LABEL: Record<FiscalDirection, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
};

export const PROBLEM_AREA_LABEL: Record<FiscalProblemArea, string> = {
  vehicle: "Moto",
  partner: "Contato",
  operation: "Operação",
  accountant: "Contador",
  config: "Configuração",
  rule: "Regra fiscal",
};

/** Formas de pagamento (tPag). A lista oficial vem de /fiscal/status. */
export const PAYMENT_METHODS: { code: string; label: string }[] = [
  { code: "17", label: "PIX" },
  { code: "01", label: "Dinheiro" },
  { code: "03", label: "Cartão de crédito" },
  { code: "04", label: "Cartão de débito" },
  { code: "18", label: "Transferência bancária" },
  { code: "16", label: "Depósito bancário" },
  { code: "15", label: "Boleto bancário" },
  { code: "02", label: "Cheque" },
  { code: "05", label: "Crédito loja (financiamento próprio)" },
  { code: "99", label: "Outros" },
];

export function paymentLabel(code?: string | null): string {
  if (!code) return "—";
  return PAYMENT_METHODS.find((item) => item.code === code)?.label ?? code;
}

export function formatAccessKey(key?: string | null): string {
  if (!key) return "";
  return key.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function hoursLeft(until?: string | null): number | null {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  return ms > 0 ? Math.floor(ms / 3_600_000) : 0;
}

/** Situação fiscal resumida das linhas visíveis de uma lista. */
export function useFiscalSummary(
  kind: "SALE" | "PURCHASE" | "EXCHANGE",
  ids: number[]
): { summary: FiscalSummary; reload: () => void } {
  const [summary, setSummary] = useState<FiscalSummary>({});
  const key = ids.join(",");
  const reload = useCallback(() => {
    if (!key) {
      setSummary({});
      return;
    }
    api.fiscal
      .resumo(
        kind,
        key.split(",").map((value) => Number(value))
      )
      .then(setSummary)
      .catch(() => setSummary({}));
  }, [kind, key]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { summary, reload };
}

// Situação fiscal do servidor (ambiente, divergências). Compartilhada entre
// componentes e atualizada quando alguém emite/cancela (refreshFiscalStatus).
let cache: FiscalStatusInfo | null = null;
let inflight: Promise<FiscalStatusInfo> | null = null;
const listeners = new Set<(info: FiscalStatusInfo | null) => void>();

export async function refreshFiscalStatus(): Promise<FiscalStatusInfo | null> {
  if (!inflight) {
    inflight = api.fiscal
      .status()
      .then((info) => {
        cache = info;
        listeners.forEach((fn) => fn(info));
        return info;
      })
      .finally(() => {
        inflight = null;
      });
  }
  try {
    return await inflight;
  } catch {
    return null;
  }
}

export function useFiscalStatus(enabled: boolean = true): {
  info: FiscalStatusInfo | null;
  reload: () => Promise<FiscalStatusInfo | null>;
} {
  const [info, setInfo] = useState<FiscalStatusInfo | null>(cache);
  useEffect(() => {
    listeners.add(setInfo);
    if (enabled && !cache) void refreshFiscalStatus();
    return () => {
      listeners.delete(setInfo);
    };
  }, [enabled]);
  const reload = useCallback(() => refreshFiscalStatus(), []);
  return { info, reload };
}
