"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CancelNfeDialog } from "@/components/fiscal/cancel-nfe-dialog";
import { FiscalEnvironmentBanner } from "@/components/fiscal/environment-banner";
import { DivergencePill, FiscalStatusPill } from "@/components/fiscal/fiscal-status-pill";
import { api } from "@/lib/api";
import {
  DIVERGENCE_LABEL,
  PAYMENT_METHODS,
  PROBLEM_AREA_LABEL,
  formatAccessKey,
  formatDateTime,
  formatMoney,
  hoursLeft,
  refreshFiscalStatus,
  useFiscalStatus,
} from "@/lib/fiscal";
import type { FiscalDocument, FiscalPlan, FiscalPreview, FiscalProblem, FiscalSourceKind } from "@/types";

const POLL_MS = 3000;
const POLL_MAX = 20;

function problemHref(problem: FiscalProblem, plan: FiscalPlan): string | null {
  if (problem.area === "vehicle") return `/motos/${encodeURIComponent(plan.vehicle.plate || plan.vehicle.id)}`;
  if (problem.area === "partner") return `/contatos/${encodeURIComponent(plan.counterpart.id)}`;
  return null;
}

function ProblemList({ plan }: { plan: FiscalPlan }) {
  return (
    <ul className="space-y-1.5">
      {plan.problems.map((problem) => {
        const href = problemHref(problem, plan);
        return (
          <li key={problem.message} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-800 dark:text-red-300">
              {PROBLEM_AREA_LABEL[problem.area]}
            </span>
            <span className="text-ink">{problem.message}</span>
            {href && (
              <Link href={href} className="text-sm font-medium text-brand hover:underline">
                Corrigir →
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DocumentDetails({
  doc,
  onRefresh,
  onCancel,
  refreshing,
}: {
  doc: FiscalDocument;
  onRefresh: () => void;
  onCancel: () => void;
  refreshing: boolean;
}) {
  const left = hoursLeft(doc.cancelUntil);
  async function baixar(kind: "xml" | "danfe") {
    try {
      if (kind === "xml") await api.fiscal.baixarXml(doc);
      else await api.fiscal.abrirDanfe(doc);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Arquivo indisponível.");
    }
  }
  return (
    <div className="space-y-3">
      {doc.status === "AUTORIZADA" || doc.status === "CANCELADA" ? (
        <div className="space-y-1 text-sm">
          <div className="text-ink">
            Nº <strong>{doc.number}</strong> · Série {doc.series} · {formatDateTime(doc.authorizedAt)}
          </div>
          {doc.accessKey && (
            <div className="break-all font-mono text-xs text-ink-muted">{formatAccessKey(doc.accessKey)}</div>
          )}
          {doc.status === "CANCELADA" && doc.cancelReason && (
            <div className="text-xs text-ink-muted">Cancelada: {doc.cancelReason}</div>
          )}
        </div>
      ) : null}
      {doc.status === "PROCESSANDO" && (
        <p className="text-sm text-ink-muted">
          Enviada à SEFAZ em {formatDateTime(doc.createdAt)}. A situação atualiza sozinha; não é
          preciso emitir de novo.
        </p>
      )}
      {(doc.status === "REJEITADA" || doc.status === "ERRO" || doc.status === "DENEGADA") && doc.sefazMessage && (
        <p className="text-sm text-red-800 dark:text-red-300">{doc.sefazMessage}</p>
      )}
      {doc.status === "AUTORIZADA" && doc.sefazMessage?.startsWith("ATENÇÃO") && (
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">{doc.sefazMessage}</p>
      )}
      {doc.divergence && (
        <div
          className={
            doc.divergence === "PENDING"
              ? "rounded-lg border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-200"
              : "rounded-lg border border-line bg-surface-hover p-3 text-sm text-ink-muted"
          }
        >
          <div className="font-semibold">{DIVERGENCE_LABEL[doc.divergence]}</div>
          {doc.divergence === "PENDING" ? (
            <div className="mt-1">
              A operação da loja foi desfeita, mas esta nota continua valendo. Nada foi feito na
              nota automaticamente.{" "}
              <Link href="/notas-fiscais?tab=divergencias" className="font-semibold underline">
                Decidir o que fazer →
              </Link>
            </div>
          ) : (
            doc.divergenceReason && <div className="mt-1">{doc.divergenceReason}</div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {doc.hasDanfe && (
          <Button size="sm" variant="outline" onClick={() => baixar("danfe")}>
            <FileText className="mr-1.5 h-4 w-4" /> DANFE
          </Button>
        )}
        {doc.hasXml && (
          <Button size="sm" variant="outline" onClick={() => baixar("xml")}>
            <Download className="mr-1.5 h-4 w-4" /> XML
          </Button>
        )}
        {(doc.status === "PROCESSANDO" || (doc.status === "AUTORIZADA" && (!doc.hasXml || !doc.hasDanfe))) &&
          doc.currentEnvironment !== false && (
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          )}
        {doc.canCancel && (
          <Button size="sm" variant="ghost" className="text-red-700 dark:text-red-300" onClick={onCancel}>
            Cancelar nota{left != null ? ` (${left} h)` : ""}…
          </Button>
        )}
      </div>
    </div>
  );
}

function EmitDialog({
  plan,
  sourceKind,
  sourceId,
  open,
  onOpenChange,
  onEmitted,
}: {
  plan: FiscalPlan;
  sourceKind: FiscalSourceKind;
  sourceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmitted: (doc: FiscalDocument) => void;
}) {
  const { info } = useFiscalStatus();
  const [current, setCurrent] = useState<FiscalPlan>(plan);
  const [payment, setPayment] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent(plan);
      setPayment("");
      setChecked(false);
    }
  }, [open, plan]);

  async function escolherPagamento(code: string) {
    setPayment(code);
    setLoading(true);
    try {
      const preview = await api.fiscal.previa(sourceKind, sourceId, code);
      const next = preview.plans.find((p) => p.direction === plan.direction);
      if (next) setCurrent(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recalcular a prévia.");
    } finally {
      setLoading(false);
    }
  }

  async function emitir() {
    setSending(true);
    try {
      const doc = await api.fiscal.emitir({
        sourceKind,
        sourceId,
        direction: plan.direction,
        paymentMethod: payment || undefined,
        confirm: true,
      });
      if (doc.status === "AUTORIZADA") toast.success(`NF-e nº ${doc.number} autorizada.`);
      else if (doc.status === "PROCESSANDO") toast.info("NF-e enviada. Aguardando a SEFAZ…");
      else toast.error(doc.sefazMessage || `NF-e ${doc.status.toLowerCase()}.`);
      void refreshFiscalStatus();
      onEmitted(doc);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível emitir.");
    } finally {
      setSending(false);
    }
  }

  const methods = info?.paymentMethods?.length ? info.paymentMethods : PAYMENT_METHODS;
  const production = info?.environment === "PRODUCAO";
  const needsPayment = plan.paymentMethodMissing;
  const blocked = !current.canEmit || (needsPayment && !payment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Emitir NF-e — prévia</DialogTitle>
          <DialogDescription>
            {current.label}. Confira tudo antes de enviar à SEFAZ.
          </DialogDescription>
        </DialogHeader>
        <FiscalEnvironmentBanner />
        <div className="space-y-4 text-sm">
          {current.problems.length > 0 && (
            <div className="rounded-xl border border-red-400/50 bg-red-500/5 p-3">
              <div className="mb-2 font-semibold text-red-900 dark:text-red-200">
                {current.problems.length === 1 ? "Falta 1 coisa" : `Faltam ${current.problems.length} coisas`} para emitir
              </div>
              <ProblemList plan={current} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {current.direction === "SAIDA" ? "Destinatário" : "Remetente (vendedor)"}
              </div>
              <div className="mt-1 font-semibold text-ink">{current.counterpart.name}</div>
              <div className="text-ink-muted">{current.counterpart.document || "sem CPF/CNPJ"}</div>
              <div className="text-ink-muted">
                {[current.counterpart.street, current.counterpart.number].filter(Boolean).join(", ") || "sem logradouro"}
                {" · "}
                {current.counterpart.neighborhood || <span className="font-semibold text-red-700 dark:text-red-300">bairro?</span>}
                {" · "}
                {current.counterpart.city}-{current.counterpart.state} · {current.counterpart.zipCode}
              </div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tributação</div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-ink-muted">CFOP</span>
                <span className="font-semibold text-ink">{current.cfop}</span>
                <span className="text-ink-muted">NCM</span>
                <span className="font-semibold text-ink">{current.ncm}</span>
                <span className="text-ink-muted">CSOSN</span>
                <span className="font-semibold text-ink">{current.csosn}</span>
                <span className="text-ink-muted">PIS/COFINS</span>
                <span className="font-semibold text-ink">CST {current.pisCofinsCst}</span>
              </div>
              <div className="mt-1 text-xs text-ink-muted">{current.nature}</div>
            </div>
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Item · descrição na nota</div>
            <code className="mt-1 block break-words rounded-lg bg-surface-hover p-2 text-xs text-ink">
              {current.description}
            </code>
            <div className="mt-2 text-xs text-ink-muted">{current.additionalInfo}</div>
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Valor e pagamento</span>
              <span className="text-lg font-bold text-ink">{formatMoney(current.amount)}</span>
            </div>
            {needsPayment && (
              <div className="mt-2 space-y-1.5">
                <Label htmlFor="nfe-pagamento">Forma de pagamento (fica gravada na operação)</Label>
                <Select value={payment} onValueChange={escolherPagamento}>
                  <SelectTrigger id="nfe-pagamento">
                    <SelectValue placeholder="Escolha como o cliente pagou" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {current.payments.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-ink-muted">
                {current.payments.map((item) => (
                  <li key={`${item.method}-${item.amount}`}>
                    {item.label} · {formatMoney(item.amount)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
            <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} disabled={blocked} />
            Conferi os dados acima
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Voltar
            </Button>
            <Button onClick={emitir} disabled={blocked || !checked || sending || loading}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {production ? "Confirmar e emitir (produção)" : "Confirmar e emitir"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({
  plan,
  sourceKind,
  sourceId,
  onChanged,
}: {
  plan: FiscalPlan;
  sourceKind: FiscalSourceKind;
  sourceId: number;
  onChanged: () => void;
}) {
  const latest = plan.documents[0];
  const [doc, setDoc] = useState<FiscalDocument | undefined>(latest);
  const [emitOpen, setEmitOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const polls = useRef(0);

  useEffect(() => setDoc(plan.documents[0]), [plan]);

  const refresh = useCallback(
    async (silent = false) => {
      if (!doc) return;
      setRefreshing(true);
      try {
        const updated = await api.fiscal.atualizar(doc.id);
        setDoc(updated);
        if (updated.status !== doc.status) {
          void refreshFiscalStatus();
          onChanged();
        }
      } catch (error) {
        if (!silent) toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
      } finally {
        setRefreshing(false);
      }
    },
    [doc, onChanged]
  );

  useEffect(() => {
    if (doc?.status !== "PROCESSANDO" || doc.currentEnvironment === false) return;
    if (polls.current >= POLL_MAX) return;
    const timer = setTimeout(() => {
      polls.current += 1;
      void refresh(true);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [doc, refresh]);

  const live = doc && (doc.status === "AUTORIZADA" || doc.status === "PROCESSANDO");
  const canReemit = !live && plan.canEmit;
  const problems = live ? [] : plan.problems;
  const pending = doc?.divergence === "PENDING";

  return (
    <section
      className={`space-y-3 rounded-2xl border p-4 ${pending ? "border-red-400/60" : "border-line"} bg-surface`}
      aria-label={plan.label}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">{plan.label}</h3>
          <p className="text-xs text-ink-muted">
            {plan.vehicle.brand} {plan.vehicle.model} · {plan.vehicle.plate || "sem placa"} · CFOP {plan.cfop}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending && <DivergencePill />}
          <FiscalStatusPill status={doc?.status} />
        </div>
      </div>

      {doc && (
        <DocumentDetails
          doc={doc}
          refreshing={refreshing}
          onRefresh={() => refresh(false)}
          onCancel={() => setCancelOpen(true)}
        />
      )}

      {!live && (
        <div className="space-y-3">
          {problems.length > 0 ? (
            <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" /> Antes de emitir
              </div>
              <ProblemList plan={plan} />
            </div>
          ) : (
            !doc && (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Dados completos. Nada vai à
                SEFAZ até você conferir a prévia e confirmar.
              </p>
            )
          )}
          <Button
            onClick={() => setEmitOpen(true)}
            disabled={
              !canReemit &&
              !(
                plan.paymentMethodMissing &&
                plan.problems.every((p) => p.message === "Informe a forma de pagamento.")
              )
            }
            className="w-full sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {doc ? "Revisar e emitir de novo…" : "Emitir NF-e…"}
          </Button>
        </div>
      )}

      {plan.documents.length > 1 && (
        <details className="text-xs text-ink-muted">
          <summary className="cursor-pointer">Tentativas anteriores ({plan.documents.length - 1})</summary>
          <ul className="mt-1 space-y-0.5">
            {plan.documents.slice(1).map((item) => (
              <li key={item.id}>
                {item.ref} · {item.status} · {formatDateTime(item.createdAt)}
                {item.sefazMessage ? ` · ${item.sefazMessage}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      <EmitDialog
        plan={plan}
        sourceKind={sourceKind}
        sourceId={sourceId}
        open={emitOpen}
        onOpenChange={setEmitOpen}
        onEmitted={(created) => {
          polls.current = 0;
          setDoc(created);
          onChanged();
        }}
      />
      <CancelNfeDialog
        doc={doc ?? null}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onDone={(updated) => {
          setDoc(updated);
          onChanged();
        }}
      />
    </section>
  );
}

/**
 * Card "Nota fiscal" de uma venda, compra ou troca. Emitir é sempre um passo
 * separado: prévia → conferi → confirmar. Nada aqui é disparado pela operação.
 */
export function FiscalPanel({
  sourceKind,
  sourceId,
  onChanged,
}: {
  sourceKind: Exclude<FiscalSourceKind, "RETURN"> | "RETURN";
  sourceId: number;
  onChanged?: () => void;
}) {
  const [preview, setPreview] = useState<FiscalPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPreview(await api.fiscal.previa(sourceKind, sourceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a situação fiscal.");
    }
  }, [sourceKind, sourceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = useCallback(() => {
    void load();
    onChanged?.();
  }, [load, onChanged]);

  if (error) {
    return <p className="text-sm text-red-700 dark:text-red-300">{error}</p>;
  }
  if (!preview) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando situação fiscal…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <FiscalEnvironmentBanner />
      {preview.plans.map((plan) => (
        <PlanCard
          key={`${plan.sourceKind}-${plan.direction}`}
          plan={plan}
          sourceKind={sourceKind}
          sourceId={sourceId}
          onChanged={changed}
        />
      ))}
    </div>
  );
}
