"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DivergencePill, FiscalStatusPill } from "@/components/fiscal/fiscal-status-pill";
import { api } from "@/lib/api";
import {
  DIRECTION_LABEL,
  ENVIRONMENT_LABEL,
  formatDateTime,
  formatMoney,
} from "@/lib/fiscal";
import type { FiscalDocument, Vehicle } from "@/types";

function origem(doc: FiscalDocument): string {
  if (doc.sourceKind === "RETURN") return "devolução";
  if (doc.saleId) return `venda #${doc.saleId}`;
  if (doc.purchaseId) return `compra #${doc.purchaseId}`;
  if (doc.exchangeId) return `troca #${doc.exchangeId}`;
  return "";
}

/** Identificação fiscal + linha do tempo das notas desta moto (todas as tentativas). */
export function VehicleFiscalCard({ vehicle }: { vehicle: Vehicle }) {
  const [docs, setDocs] = useState<FiscalDocument[] | null>(null);

  useEffect(() => {
    if (!vehicle.id) return;
    api.fiscal
      .listar({ vehicleId: vehicle.id, environment: "ALL", size: 50 })
      .then((page) => setDocs([...page.content].reverse()))
      .catch(() => setDocs([]));
  }, [vehicle.id]);

  const live = (docs ?? []).filter(
    (doc) => doc.currentEnvironment !== false && (doc.status === "AUTORIZADA" || doc.status === "PROCESSANDO")
  );
  const lastLive = live[live.length - 1];
  const faltando = [
    !vehicle.chassis && "chassi",
    !vehicle.renavam && "RENAVAM",
    !vehicle.engineCc && vehicle.fuelType !== "ELETRICO" && "cilindrada",
  ].filter(Boolean) as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fiscal</CardTitle>
        <CardDescription>Identificação para a NF-e e as notas desta moto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-muted">Chassi</dt>
            <dd className="font-mono font-medium text-ink">{vehicle.chassis || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">RENAVAM</dt>
            <dd className="font-mono font-medium text-ink">{vehicle.renavam || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Cilindrada · combustível</dt>
            <dd className="font-medium text-ink">
              {vehicle.engineCc ? `${vehicle.engineCc} cc` : "—"} · {vehicle.fuelType ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">NCM da nota</dt>
            <dd className="font-medium text-ink">{vehicle.ncmEffective ?? "—"}</dd>
          </div>
        </dl>
        {faltando.length > 0 && (
          <p className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            Falta {faltando.join(", ")} para emitir nota desta moto. Use &quot;Editar&quot; para completar.
          </p>
        )}

        {docs === null ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando notas…
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma nota fiscal emitida para esta moto.</p>
        ) : (
          <ol className="space-y-0">
            {docs.map((doc, index) => (
              <li key={doc.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 h-3 w-3 rounded-full ${
                      doc.status === "AUTORIZADA" ? "bg-emerald-600" : doc.status === "PROCESSANDO" ? "bg-sky-600" : "bg-zinc-400"
                    }`}
                    aria-hidden="true"
                  />
                  {index < docs.length - 1 && <span className="w-0.5 flex-1 bg-line" aria-hidden="true" />}
                </div>
                <div className="space-y-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {DIRECTION_LABEL[doc.direction]} · {origem(doc)}
                    </span>
                    <FiscalStatusPill status={doc.status} />
                    {doc.divergence === "PENDING" && <DivergencePill />}
                    {doc.currentEnvironment === false && (
                      <span className="text-xs text-ink-subtle">{ENVIRONMENT_LABEL[doc.environment]} · não conta nas regras</span>
                    )}
                  </div>
                  <div className="text-sm text-ink-muted">
                    {doc.number ? `NF-e nº ${doc.number} · ` : ""}CFOP {doc.cfop} · {formatDateTime(doc.authorizedAt || doc.createdAt)} ·{" "}
                    {formatMoney(doc.amount)} · {doc.counterpartName}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {lastLive?.direction === "SAIDA" && (
          <p className="rounded-xl border border-sky-400/50 bg-sky-500/10 p-3 text-sm text-sky-900 dark:text-sky-200">
            Este chassi tem uma nota de saída valendo (nº {lastLive.number ?? "—"}). Uma nova venda dele
            só emite NF-e depois que essa nota for cancelada ou devolvida.{" "}
            <Link href="/notas-fiscais?tab=divergencias" className="font-semibold underline">
              Ver divergências
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
