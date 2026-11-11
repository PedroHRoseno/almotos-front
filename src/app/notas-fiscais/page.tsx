"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  PlugZap,
  Receipt,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DockedForm } from "@/components/layout/form-dock";
import { CancelNfeDialog } from "@/components/fiscal/cancel-nfe-dialog";
import { FiscalEnvironmentBanner } from "@/components/fiscal/environment-banner";
import { FiscalPanel } from "@/components/fiscal/fiscal-panel";
import { DivergencePill, FiscalStatusPill } from "@/components/fiscal/fiscal-status-pill";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  DIRECTION_LABEL,
  DIVERGENCE_LABEL,
  ENVIRONMENT_LABEL,
  formatDateTime,
  formatMoney,
  hoursLeft,
  refreshFiscalStatus,
  useFiscalStatus,
} from "@/lib/fiscal";
import { formatDocumentOrDash } from "@/lib/masks";
import type { FiscalCheckResult, FiscalDocument, PageResponse } from "@/types";

type Tab = "emitidas" | "divergencias" | "configuracao";

function origemLabel(doc: FiscalDocument): string {
  if (doc.sourceKind === "RETURN") return `Devolução da nota #${doc.referencedDocumentId}`;
  if (doc.saleId) return `Venda #${doc.saleId}`;
  if (doc.purchaseId) return `Compra #${doc.purchaseId}`;
  if (doc.exchangeId) return `Troca #${doc.exchangeId}`;
  return "—";
}

async function baixar(doc: FiscalDocument, kind: "xml" | "danfe") {
  try {
    if (kind === "xml") await api.fiscal.baixarXml(doc);
    else await api.fiscal.abrirDanfe(doc);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Arquivo indisponível.");
  }
}

function Emitidas() {
  const { info } = useFiscalStatus();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [environment, setEnvironment] = useState<string>("CURRENT");
  const [data, setData] = useState<PageResponse<FiscalDocument> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!info) return;
    setLoading(true);
    api.fiscal
      .listar({
        page,
        size: 20,
        search: debounced,
        status: status === "ALL" ? undefined : status,
        direction: direction === "ALL" ? undefined : direction,
        environment: environment === "CURRENT" ? info.environment : environment,
      })
      .then(setData)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Erro ao listar notas."))
      .finally(() => setLoading(false));
  }, [page, debounced, status, direction, environment, info]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" /> Notas emitidas
        </CardTitle>
        <CardDescription>
          Para emitir, abra a venda, compra ou troca e use o botão de nota fiscal da linha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <Label htmlFor="nf-busca">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="nf-busca"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nº, chave, chassi, CPF/CNPJ ou nome"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={direction} onValueChange={(value) => { setDirection(value); setPage(0); }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="AUTORIZADA">Autorizada</SelectItem>
                <SelectItem value="PROCESSANDO">Processando</SelectItem>
                <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                <SelectItem value="ERRO">Erro no envio</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ambiente</Label>
            <Select value={environment} onValueChange={(value) => { setEnvironment(value); setPage(0); }}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CURRENT">Atual{info ? ` (${ENVIRONMENT_LABEL[info.environment]})` : ""}</SelectItem>
                <SelectItem value="PRODUCAO">Produção</SelectItem>
                <SelectItem value="HOMOLOGACAO">Homologação</SelectItem>
                <SelectItem value="ALL">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" /></div>
        ) : !data || data.content.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">Nenhuma nota encontrada.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-line">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Nº / Série</TableHead>
                    <TableHead className="min-w-[120px]">Tipo · CFOP</TableHead>
                    <TableHead className="min-w-[180px]">Contraparte</TableHead>
                    <TableHead className="min-w-[200px]">Moto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="min-w-[150px]">Status</TableHead>
                    <TableHead className="text-right">Arquivos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-semibold text-ink">{doc.number ? `${doc.number} / ${doc.series}` : "—"}</div>
                        <div className="text-xs text-ink-muted">{formatDateTime(doc.authorizedAt || doc.createdAt)}</div>
                        <div className="text-xs text-ink-subtle">{origemLabel(doc)}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {DIRECTION_LABEL[doc.direction]}
                        <div className="text-xs text-ink-muted">CFOP {doc.cfop}</div>
                      </TableCell>
                      <TableCell>
                        {doc.counterpartName}
                        <div className="font-mono text-xs text-ink-muted">{formatDocumentOrDash(doc.counterpartDocument)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{doc.description.split(" PL ")[0].replace("MOTOCICLETA USADA ", "")}</div>
                        <div className="font-mono text-xs text-ink-muted">{doc.chassis}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatMoney(doc.amount)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <FiscalStatusPill status={doc.status} />
                          {doc.divergence === "PENDING" && <DivergencePill />}
                          {doc.currentEnvironment === false && (
                            <span className="text-xs text-ink-subtle">{ENVIRONMENT_LABEL[doc.environment]}</span>
                          )}
                        </div>
                        {(doc.status === "REJEITADA" || doc.status === "ERRO") && doc.sefazMessage && (
                          <div className="mt-1 max-w-[260px] text-xs text-red-800 dark:text-red-300">{doc.sefazMessage}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {doc.hasDanfe && (
                          <Button size="sm" variant="outline" className="ml-1" onClick={() => baixar(doc, "danfe")}>
                            <FileText className="mr-1 h-4 w-4" /> DANFE
                          </Button>
                        )}
                        {doc.hasXml && (
                          <Button size="sm" variant="outline" className="ml-1" onClick={() => baixar(doc, "xml")}>
                            <Download className="mr-1 h-4 w-4" /> XML
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
              <span>{data.totalElements} nota(s)</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{page + 1}/{Math.max(1, data.totalPages)}</span>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type Decisao = "cancelar" | "devolucao" | "manter";

function DivergenceCard({ doc, onResolved }: { doc: FiscalDocument; onResolved: () => void }) {
  const [escolha, setEscolha] = useState<Decisao>(doc.canCancel ? "cancelar" : "devolucao");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const left = hoursLeft(doc.cancelUntil);

  const opcoes: { id: Decisao; titulo: string; desc: string; disabled?: boolean }[] = [
    {
      id: "cancelar",
      titulo: "Cancelar a nota na SEFAZ",
      desc: doc.canCancel
        ? `Ainda dá: ${left} h restantes do prazo de 24 h.`
        : "Prazo de 24 h encerrado (ou nota de outro ambiente).",
      disabled: !doc.canCancel,
    },
    {
      id: "devolucao",
      titulo: "Emitir nota de devolução",
      desc: "Para quando o prazo passou ou a moto voltou à loja. Abre a prévia de uma nota que referencia esta.",
    },
    {
      id: "manter",
      titulo: "Manter a nota como está",
      desc: "Quando a nota está certa e só a operação da loja mudou. Exige um motivo.",
    },
  ];

  async function manter() {
    setSaving(true);
    try {
      await api.fiscal.manter(doc.id, motivo);
      toast.success("Divergência resolvida: nota mantida.");
      void refreshFiscalStatus();
      onResolved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-red-400/60 bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft p-4">
        <div>
          <h3 className="font-semibold text-ink">
            NF-e nº {doc.number ?? "—"} · {DIRECTION_LABEL[doc.direction]} · {doc.description.split(" PL ")[0].replace("MOTOCICLETA USADA ", "")}
          </h3>
          <p className="text-sm text-ink-muted">
            {origemLabel(doc)} desfeita em {formatDateTime(doc.divergenceOpenedAt)} · nota autorizada em {formatDateTime(doc.authorizedAt)} · {doc.counterpartName}
          </p>
        </div>
        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-800 dark:text-red-300">
          {doc.canCancel ? `Cancelamento: ${left} h restantes` : "Prazo de cancelamento encerrado"}
        </span>
      </div>
      <fieldset className="space-y-2 p-4">
        <legend className="pb-2 text-sm font-semibold text-ink">O que fazer com a nota?</legend>
        {opcoes.map((opcao) => (
          <label
            key={opcao.id}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 ${
              escolha === opcao.id ? "border-ink bg-surface-hover" : "border-line"
            } ${opcao.disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name={`decisao-${doc.id}`}
              className="mt-1 h-4 w-4"
              checked={escolha === opcao.id}
              disabled={opcao.disabled}
              onChange={() => setEscolha(opcao.id)}
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{opcao.titulo}</span>
              <span className="block text-sm text-ink-muted">{opcao.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-3 border-t border-line-soft bg-surface-hover/50 p-4">
        {escolha === "manter" && (
          <div className="space-y-1.5">
            <Label htmlFor={`motivo-${doc.id}`}>Motivo (fica no histórico da operação)</Label>
            <textarea
              id={`motivo-${doc.id}`}
              rows={3}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Mínimo 15 caracteres."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-ink-muted">A decisão fica registrada com seu usuário e horário.</span>
          {escolha === "cancelar" && (
            <Button variant="destructive" onClick={() => setCancelOpen(true)} disabled={!doc.canCancel}>
              Cancelar NF-e nº {doc.number}…
            </Button>
          )}
          {escolha === "devolucao" && (
            <Button onClick={() => setReturnOpen(true)}>Abrir prévia da devolução</Button>
          )}
          {escolha === "manter" && (
            <Button onClick={manter} disabled={saving || motivo.trim().length < 15}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manter nota e registrar motivo
            </Button>
          )}
        </div>
      </div>
      <CancelNfeDialog doc={doc} open={cancelOpen} onOpenChange={setCancelOpen} onDone={onResolved} />
      <DockedForm
        id={`nfe-return:${doc.id}`}
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title={`Devolução da NF-e nº ${doc.number}`}
        description={<>A devolução referencia a nota original. Quando for autorizada, a divergência fecha sozinha.</>}
      >
        {returnOpen && <FiscalPanel sourceKind="RETURN" sourceId={doc.id} onChanged={onResolved} />}
      </DockedForm>
    </article>
  );
}

function Divergencias() {
  const [pending, setPending] = useState<FiscalDocument[] | null>(null);
  const [resolved, setResolved] = useState<FiscalDocument[]>([]);

  const load = useCallback(async () => {
    try {
      const [aberta, mantidas, canceladas, devolvidas] = await Promise.all([
        api.fiscal.listar({ divergence: "PENDING", size: 100, environment: "ALL" }),
        api.fiscal.listar({ divergence: "KEPT", size: 5, environment: "ALL" }),
        api.fiscal.listar({ divergence: "CANCELLED_AT_SEFAZ", size: 5, environment: "ALL" }),
        api.fiscal.listar({ divergence: "RETURN_ISSUED", size: 5, environment: "ALL" }),
      ]);
      setPending(aberta.content);
      setResolved(
        [...mantidas.content, ...canceladas.content, ...devolvidas.content].sort((a, b) =>
          (b.divergenceResolvedAt ?? "").localeCompare(a.divergenceResolvedAt ?? "")
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar divergências.");
      setPending([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (pending === null) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" /></div>;
  }
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        Vendas, compras e trocas desfeitas na loja que ainda têm nota autorizada. O sistema nunca
        decide sozinho: escolha o que fazer com cada nota.
      </p>
      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-ink-muted">
            Nenhuma divergência aberta.
          </CardContent>
        </Card>
      ) : (
        pending.map((doc) => <DivergenceCard key={doc.id} doc={doc} onResolved={load} />)
      )}
      {resolved.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink-muted">Resolvidas recentemente</h2>
          {resolved.map((doc) => (
            <div key={doc.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <span className="text-ink">
                NF-e nº {doc.number} · {DIVERGENCE_LABEL[doc.divergence!]}
                {doc.divergenceReason ? ` — ${doc.divergenceReason}` : ""}
              </span>
              <span className="text-ink-muted">
                {doc.divergenceResolvedBy} · {formatDateTime(doc.divergenceResolvedAt)}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Configuracao() {
  const { info } = useFiscalStatus();
  const { user } = useAuth();
  const [check, setCheck] = useState<FiscalCheckResult | null>(null);
  const [testing, setTesting] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  async function testar() {
    setTesting(true);
    try {
      const result = await api.fiscal.testarConexao();
      setCheck(result);
      if (result.ok) toast.success("Conexão com a ForeCast OK.");
      else toast.error("A ForeCast respondeu com pendências.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao testar a conexão.");
    } finally {
      setTesting(false);
    }
  }

  const itens = info
    ? [
        { label: "Ambiente", value: ENVIRONMENT_LABEL[info.environment] },
        { label: "Configurado no servidor", value: info.configured ? "Sim" : "Não" },
        { label: "CNPJ emitente", value: formatDocumentOrDash(info.emitterCnpj) },
        { label: "UF", value: info.emitterUf ?? "—" },
        { label: "Webhook da ForeCast", value: info.webhookEnabled ? "Ligado" : "Desligado (usa consulta)" },
        { label: "Divergências abertas", value: String(info.pendingDivergences) },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Configuração fiscal</CardTitle>
          <CardDescription>
            O ambiente e os tokens ficam só no servidor (Railway). Trocar para produção é mudar
            FORECAST_AMBIENTE e o token lá; nada aqui altera configuração.
          </CardDescription>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={testar} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
            Testar conexão
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-hover p-3">
              <div className="text-xs text-ink-muted">{item.label}</div>
              <div className="text-sm font-semibold text-ink">{item.value}</div>
            </div>
          ))}
        </div>
        {check && (
          <div className={`rounded-xl border p-4 text-sm ${check.ok ? "border-emerald-400/50" : "border-red-400/60"}`}>
            <div className="font-semibold text-ink">{check.ok ? "Tudo certo na ForeCast" : "Pendências na ForeCast"}</div>
            <ul className="mt-2 space-y-1 text-ink-muted">
              <li>Empresa: {check.company.name ?? "—"} {check.company.active === false ? "(inativa)" : ""}</li>
              <li>NF-e homologação: {check.company.nfeHomologation ? "ligada" : "desligada"} · produção: {check.company.nfeProduction ? "ligada" : "desligada"}</li>
              <li>Certificado A1 válido até: {formatDateTime(check.certificateValidUntil)}</li>
              {check.problems.map((problem) => (
                <li key={problem} className="text-red-800 dark:text-red-300">{problem}</li>
              ))}
            </ul>
          </div>
        )}
        {!isAdmin && <p className="text-sm text-ink-muted">Só administradores testam a conexão.</p>}
      </CardContent>
    </Card>
  );
}

function NotasFiscaisContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { info } = useFiscalStatus();
  const raw = params.get("tab");
  const tab: Tab = raw === "divergencias" || raw === "configuracao" ? raw : "emitidas";

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "emitidas", label: "Emitidas" },
    { id: "divergencias", label: "Divergências", badge: info?.pendingDivergences },
    { id: "configuracao", label: "Configuração" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          NF-e modelo 55 emitidas pela ForeCast. Separado da operação da loja: nada aqui é automático.
        </p>
      </div>
      <FiscalEnvironmentBanner />
      <div role="tablist" aria-label="Seções de notas fiscais" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => router.replace(item.id === "emitidas" ? "/notas-fiscais" : `/notas-fiscais?tab=${item.id}`)}
            className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${
              tab === item.id ? "border-brand font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{item.badge}</span>
            ) : null}
          </button>
        ))}
      </div>
      {tab === "emitidas" && <Emitidas />}
      {tab === "divergencias" && <Divergencias />}
      {tab === "configuracao" && <Configuracao />}
    </div>
  );
}

export default function NotasFiscaisPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <NotasFiscaisContent />
    </Suspense>
  );
}
