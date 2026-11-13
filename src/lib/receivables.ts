import type { ReceivableAccount } from "@/types";

/** Mesmo prazo do backend para "Vence em breve". */
export const DUE_SOON_DAYS = 7;
export const MAX_INSTALLMENTS = 120;

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** dd/mm/aaaa sem passar por Date (evita o dia "voltar" pelo fuso). */
export function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const parts = parseIso(iso);
  if (!parts) return iso;
  return `${String(parts.d).padStart(2, "0")}/${String(parts.m).padStart(2, "0")}/${parts.y}`;
}

/** Diferença em dias (b - a) entre duas datas ISO. */
export function daysBetween(a: string, b: string): number {
  const pa = parseIso(a);
  const pb = parseIso(b);
  if (!pa || !pb) return 0;
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86_400_000);
}

/** Mesmo dia N meses depois; 31 cai no último dia do mês curto. Espelha o backend. */
export function addMonthsIso(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const index = parts.m - 1 + months;
  const y = parts.y + Math.floor(index / 12);
  const m = (((index % 12) + 12) % 12) + 1;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return toIso(y, m, Math.min(parts.d, lastDay));
}

/** Divide em centavos; o resto do arredondamento vai para a última parcela. Espelha o backend. */
export function splitAmount(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  if (count < 1 || cents <= 0) return [];
  const base = Math.floor(cents / count);
  const amounts = Array.from({ length: count }, () => base);
  amounts[count - 1] = cents - base * (count - 1);
  return amounts.map((value) => value / 100);
}

export interface InstallmentPreview {
  number: number;
  amount: number;
  dueDate: string;
}

export function previewInstallments(total: number | undefined, count: number, firstDueDate: string): InstallmentPreview[] {
  if (!total || total <= 0 || !parseIso(firstDueDate) || count < 1) return [];
  return splitAmount(total, count).map((amount, index) => ({
    number: index + 1,
    amount,
    dueDate: addMonthsIso(firstDueDate, index),
  }));
}

export type AccountTone = "overdue" | "today" | "soon" | "ok" | "settled" | "cancelled";

export function accountTone(account: ReceivableAccount, todayIso: string): { tone: AccountTone; label: string } {
  if (account.status === "CANCELLED") return { tone: "cancelled", label: "Cancelado" };
  if (account.status === "SETTLED") return { tone: "settled", label: "Quitado" };
  if (account.hasOverdue) {
    const days = account.maxDaysOverdue;
    return { tone: "overdue", label: `Atrasado há ${days} dia${days === 1 ? "" : "s"}` };
  }
  if (account.nextDueDate) {
    const days = daysBetween(todayIso, account.nextDueDate);
    if (days === 0) return { tone: "today", label: "Vence hoje" };
    if (days > 0 && days <= DUE_SOON_DAYS) {
      return { tone: "soon", label: days === 1 ? "Vence amanhã" : `Vence em ${days} dias` };
    }
  }
  return { tone: "ok", label: "Em dia" };
}

/** Carnê para parceladas, promissória para pagamento único. */
export function receivableDocumentHref(account: Pick<ReceivableAccount, "id" | "installmentsCount">): string {
  const type = account.installmentsCount > 1 ? "carne" : "promissoria";
  return `/documentos?type=${type}&receivableId=${encodeURIComponent(account.id)}`;
}
