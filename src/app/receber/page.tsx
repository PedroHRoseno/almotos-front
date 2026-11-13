"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleDollarSign,
  FileText,
  HandCoins,
  Loader2,
  Plus,
  Receipt,
  Search,
  Undo2,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NewReceivableDialog } from "@/components/receivables/new-receivable-dialog";
import { api } from "@/lib/api";
import { buildDocumentHref, todayLocalIso } from "@/lib/documents";
import { formatBRL, formatStoredPhone } from "@/lib/masks";
import { accountTone, formatShortDate, receivableDocumentHref, type AccountTone } from "@/lib/receivables";
import { cn } from "@/lib/utils";
import { plateLabel, vehicleKey } from "@/lib/vehicle-ref";
import type {
  ReceivableAccount,
  ReceivableFilter,
  ReceivableInstallment,
  ReceivableSummary,
} from "@/types";

const PAGE_SIZE = 20;
const OVERDUE_RED = "#eb0b0b";

const FILTERS: { value: ReceivableFilter; label: string }[] = [
  { value: "OPEN", label: "Todos em aberto" },
  { value: "OVERDUE", label: "Atrasados" },
  { value: "DUE_SOON", label: "Vence em breve" },
  { value: "SETTLED", label: "Quitados" },
];

const TONE_CLASS: Record<AccountTone, string> = {
  overdue: "bg-red-600/15 text-red-500 border-red-600/30",
  today: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  soon: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  ok: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  settled: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-surface text-ink-muted border-line",
};

const TONE_DOT: Record<AccountTone, string> = {
  overdue: "bg-red-600",
  today: "bg-orange-500",
  soon: "bg-amber-500",
  ok: "bg-sky-500",
  settled: "bg-emerald-500",
  cancelled: "bg-ink-subtle",
};

type PendingAction =
  | { kind: "pay"; account: ReceivableAccount; installment: ReceivableInstallment }
  | { kind: "unpay"; account: ReceivableAccount; installment: ReceivableInstallment }
  | { kind: "cancel"; account: ReceivableAccount };

function StatusPill({ tone, label }: { tone: AccountTone; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
      {label}
    </span>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  className,
  valueStyle,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  className?: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <CardContent className="space-y-1 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
          <span>{title}</span>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <div className="text-xl font-bold tabular-nums text-ink md:text-2xl" style={valueStyle}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function plural(count: number, singular: string, pluralWord: string) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

export default function ReceberPage() {
  const [summary, setSummary] = useState<ReceivableSummary | null>(null);
  const [accounts, setAccounts] = useState<ReceivableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReceivableFilter>("OPEN");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<PendingAction | null>(null);
  const [actionDate, setActionDate] = useState(todayLocalIso());
  const [acting, setActing] = useState(false);
  const todayIso = todayLocalIso();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [filter, debouncedSearch]);

  const loadSummary = useCallback(() => {
    api.receivables
      .resumo()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    api.receivables
      .listar({ page, size: PAGE_SIZE, search: debouncedSearch, status: filter })
      .then((data) => {
        setAccounts(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Erro ao carregar contas a receber"))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refresh = () => {
    loadAccounts();
    loadSummary();
  };

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openAction = (next: PendingAction) => {
    setActionDate(todayLocalIso());
    setAction(next);
  };

  async function confirmAction() {
    if (!action) return;
    setActing(true);
    try {
      if (action.kind === "pay") {
        await api.receivables.darBaixa(action.installment.id, actionDate);
        toast.success(`Parcela ${action.installment.installmentNumber} baixada e lançada no caixa.`);
      } else if (action.kind === "unpay") {
        await api.receivables.estornar(action.installment.id);
        toast.success(`Baixa da parcela ${action.installment.installmentNumber} estornada.`);
      } else {
        await api.receivables.cancelar(action.account.id);
        toast.success("Conta cancelada.");
      }
      setAction(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir.");
    } finally {
      setActing(false);
    }
  }

  const overdueStyle = summary && summary.overdueAccounts > 0 ? { color: OVERDUE_RED } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Crediário e promissórias. Cada baixa entra no Fluxo de Caixa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total a receber (aberto)"
          value={summary ? formatBRL(summary.openAmount) : "—"}
          hint={summary ? plural(summary.openAccounts, "conta em aberto", "contas em aberto") : "Carregando..."}
          icon={Wallet}
        />
        <KpiCard
          title="Em atraso"
          value={summary ? formatBRL(summary.overdueAmount) : "—"}
          hint={summary ? plural(summary.overdueAccounts, "conta atrasada", "contas atrasadas") : "Carregando..."}
          icon={CircleAlert}
          valueStyle={overdueStyle}
          className={summary && summary.overdueAccounts > 0 ? "border-[#eb0b0b]/50 bg-[#eb0b0b]/5" : undefined}
        />
        <KpiCard
          title="Vence em 7 dias"
          value={summary ? formatBRL(summary.dueSoonAmount) : "—"}
          hint={summary ? plural(summary.dueSoonAccounts, "conta", "contas") : "Carregando..."}
          icon={AlarmClock}
          valueStyle={summary && summary.dueSoonAccounts > 0 ? { color: "#d97706" } : undefined}
          className={summary && summary.dueSoonAccounts > 0 ? "border-amber-500/40 bg-amber-500/5" : undefined}
        />
        <KpiCard
          title="Recebido no mês"
          value={summary ? formatBRL(summary.receivedThisMonth) : "—"}
          hint="Parcelas baixadas neste mês"
          icon={CircleDollarSign}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <FilterChip key={item.value} active={filter === item.value} onClick={() => setFilter(item.value)}>
              {item.label}
            </FilterChip>
          ))}
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente, CPF, placa ou modelo"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Descrição</th>
                <th className="px-3 py-3 font-medium">Parcelas</th>
                <th className="px-3 py-3 font-medium">Saldo</th>
                <th className="px-3 py-3 font-medium">Próximo vencimento</th>
                <th className="px-3 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-muted" />
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    todayIso={todayIso}
                    expanded={expanded.has(account.id)}
                    onToggle={() => toggle(account.id)}
                    onAction={openAction}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
            <span>
              Página {page + 1} de {totalPages} · {totalElements} contas
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <NewReceivableDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          setExpanded((current) => new Set(current).add(created.id));
          refresh();
        }}
      />

      <AlertDialog open={action !== null} onOpenChange={(open) => !open && !acting && setAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action?.kind === "pay"
                ? "Dar baixa na parcela"
                : action?.kind === "unpay"
                  ? "Estornar baixa"
                  : "Cancelar conta a receber"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action?.kind === "pay"
                ? `Parcela ${action.installment.installmentNumber}/${action.account.installmentsCount} de ${action.account.partner.name}, ${formatBRL(action.installment.amount)}. Vai entrar como Recebimento de crediário no Fluxo de Caixa.`
                : action?.kind === "unpay"
                  ? `A parcela ${action.installment.installmentNumber}/${action.account.installmentsCount} volta a ficar pendente e o lançamento de ${formatBRL(action.installment.amount)} no caixa é cancelado.`
                  : action
                    ? `As parcelas pendentes de "${action.account.description}" serão canceladas. As já pagas continuam no caixa.`
                    : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {action?.kind === "pay" ? (
            <div className="space-y-2">
              <Label htmlFor="paid-date">Data do pagamento</Label>
              <Input
                id="paid-date"
                type="date"
                value={actionDate}
                max={todayIso}
                onChange={(event) => setActionDate(event.target.value)}
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={acting}
              onClick={(event) => {
                event.preventDefault();
                void confirmAction();
              }}
              className={action?.kind === "pay" ? undefined : "bg-red-600 text-white hover:bg-red-700"}
            >
              {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {action?.kind === "pay" ? "Dar baixa" : action?.kind === "unpay" ? "Estornar" : "Cancelar conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountRow({
  account,
  todayIso,
  expanded,
  onToggle,
  onAction,
}: {
  account: ReceivableAccount;
  todayIso: string;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: PendingAction) => void;
}) {
  const { tone, label } = accountTone(account, todayIso);
  const total = account.installmentsCount;
  const progress = total ? Math.round((account.paidInstallmentsCount / total) * 100) : 0;
  const single = total === 1 ? account.installments[0] : undefined;
  const isActive = account.status === "ACTIVE";
  const vehicle = account.vehicle;

  return (
    <Fragment>
      <tr
        className={cn(
          "cursor-pointer border-b border-line-soft border-l-4 transition-colors hover:bg-surface/50",
          account.hasOverdue && isActive ? "border-l-red-600" : "border-l-transparent",
          expanded && "bg-surface/40"
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-3 align-top">
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label={expanded ? "Recolher parcelas" : "Ver parcelas"}
              aria-expanded={expanded}
              className="mt-0.5 rounded p-0.5 text-ink-muted hover:bg-surface hover:text-ink"
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <Link
                href={`/contatos/${account.partner.id}`}
                onClick={(event) => event.stopPropagation()}
                className="whitespace-nowrap font-medium text-ink hover:underline"
              >
                {account.partner.name}
              </Link>
              <div className="whitespace-nowrap text-xs text-ink-muted">{formatStoredPhone(account.partner.phone)}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 align-top">
          <div className="max-w-[260px] truncate text-ink" title={account.description}>
            {account.description}
          </div>
          {vehicle ? (
            <span className="mt-1 inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs text-ink-muted">
              {vehicle.modelName} · {plateLabel(vehicle.licensePlate)}
            </span>
          ) : null}
        </td>
        <td className="px-3 py-3 align-top">
          {total === 1 ? (
            <span className="text-ink-muted">Pagamento único</span>
          ) : (
            <div className="w-28 space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className={cn("h-full rounded-full", account.status === "SETTLED" ? "bg-emerald-500" : "bg-brand")}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-ink-muted tabular-nums">
                {account.paidInstallmentsCount}/{total} pagas
              </div>
            </div>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums">
          {account.status === "SETTLED" ? (
            <div className="font-semibold text-emerald-500">Quitado</div>
          ) : (
            <div className={cn("font-semibold", account.hasOverdue ? "text-red-500" : "text-ink")}>
              Falta {formatBRL(account.remainingAmount)}
            </div>
          )}
          <div className="text-xs text-ink-muted">de {formatBRL(account.totalAmount)}</div>
        </td>
        <td className="px-3 py-3 align-top">
          <div className="space-y-1">
            <div className="tabular-nums text-ink">{account.nextDueDate ? formatShortDate(account.nextDueDate) : "—"}</div>
            <StatusPill tone={tone} label={label} />
          </div>
        </td>
        <td className="px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
          <div className="flex justify-end gap-2">
            {single && single.status === "PENDING" && isActive ? (
              <Button size="sm" onClick={() => onAction({ kind: "pay", account, installment: single })}>
                <HandCoins className="mr-1.5 h-4 w-4" />
                Baixa
              </Button>
            ) : null}
            {account.status !== "CANCELLED" ? (
              <Button size="sm" variant="outline" asChild>
                <Link
                  href={receivableDocumentHref(account)}
                  title={total > 1 ? "Gerar carnê de pagamento" : "Gerar nota promissória"}
                >
                  <FileText className="h-4 w-4 2xl:mr-1.5" />
                  <span className="sr-only 2xl:not-sr-only">{total > 1 ? "Carnê" : "Promissória"}</span>
                </Link>
              </Button>
            ) : null}
            {isActive ? (
              <Button
                size="sm"
                variant="ghost"
                title="Cancelar conta"
                aria-label="Cancelar conta"
                onClick={() => onAction({ kind: "cancel", account })}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-line-soft bg-surface/20">
          {/* max-w-0: a sub-tabela não alarga as colunas da tabela principal. */}
          <td colSpan={6} className="max-w-0 px-3 pb-4 pt-1 md:pl-12">
            <InstallmentsTable account={account} todayIso={todayIso} onAction={onAction} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function InstallmentStatus({ installment, todayIso }: { installment: ReceivableInstallment; todayIso: string }) {
  if (installment.status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-500">
        <CheckCircle2 className="h-4 w-4" /> Paga
      </span>
    );
  }
  if (installment.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-muted">
        <XCircle className="h-4 w-4" /> Cancelada
      </span>
    );
  }
  if (installment.daysOverdue > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-500">
        <CircleAlert className="h-4 w-4" /> Atrasada há {installment.daysOverdue} dia{installment.daysOverdue === 1 ? "" : "s"}
      </span>
    );
  }
  if (installment.dueDate === todayIso) {
    return (
      <span className="inline-flex items-center gap-1.5 text-orange-500">
        <CalendarClock className="h-4 w-4" /> Vence hoje
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sky-500">
      <Circle className="h-4 w-4" /> Pendente
    </span>
  );
}

function InstallmentsTable({
  account,
  todayIso,
  onAction,
}: {
  account: ReceivableAccount;
  todayIso: string;
  onAction: (action: PendingAction) => void;
}) {
  const isActive = account.status === "ACTIVE";
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-canvas">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line-soft text-left text-xs text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Parcela</th>
            <th className="px-3 py-2 font-medium">Vencimento</th>
            <th className="px-3 py-2 font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Pagamento</th>
            <th className="px-3 py-2 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {account.installments.map((installment) => (
            <tr key={installment.id} className="tabular-nums">
              <td className="px-3 py-2 text-ink-muted">
                {installment.installmentNumber}/{account.installmentsCount}
              </td>
              <td className="px-3 py-2">{formatShortDate(installment.dueDate)}</td>
              <td className="px-3 py-2 font-medium text-ink">{formatBRL(installment.amount)}</td>
              <td className="px-3 py-2">
                <InstallmentStatus installment={installment} todayIso={todayIso} />
              </td>
              <td className="px-3 py-2 text-ink-muted">{formatShortDate(installment.paidDate)}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-2">
                  {installment.status === "PENDING" && isActive ? (
                    <Button size="sm" onClick={() => onAction({ kind: "pay", account, installment })}>
                      <HandCoins className="mr-1.5 h-4 w-4" />
                      Dar baixa
                    </Button>
                  ) : null}
                  {installment.status === "PAID" ? (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={buildDocumentHref({
                            type: "recibo",
                            contactId: account.partner.id,
                            vehicleId: account.vehicle ? vehicleKey(account.vehicle) : null,
                            amount: installment.amount,
                            date: installment.paidDate,
                          })}
                        >
                          <Receipt className="mr-1.5 h-4 w-4" />
                          Recibo
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAction({ kind: "unpay", account, installment })}
                      >
                        <Undo2 className="mr-1.5 h-4 w-4" />
                        Estornar
                      </Button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
