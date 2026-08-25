"use client";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/masks";
import type { FipeConsultaResponse } from "@/types";

type FipeConsultaCardProps = {
  data: FipeConsultaResponse | null;
  loading?: boolean;
  onUseSuggestedPrice?: (valor: number) => void;
};

export function FipeConsultaCard({
  data,
  loading,
  onUseSuggestedPrice,
}: FipeConsultaCardProps) {
  if (loading) {
    return (
      <p className="text-sm text-ink-muted">Consultando tabela FIPE…</p>
    );
  }
  if (!data) return null;
  if (!data.available) {
    return (
      <p className="text-sm text-ink-muted">
        FIPE indisponível — o cadastro segue normalmente.
      </p>
    );
  }
  const hasDetail = Boolean(
    data.codigoFipe || data.valor != null || data.modelo || data.combustivel
  );
  if (!hasDetail) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhum detalhe FIPE para este ano. Você pode seguir com o modelo livre.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface p-3">
      <p className="text-sm font-medium text-ink">Referência FIPE</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {data.valor != null || data.valorTexto ? (
          <div>
            <dt className="text-xs text-ink-subtle">Valor</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {data.valor != null ? formatBRL(data.valor) : data.valorTexto}
            </dd>
          </div>
        ) : null}
        {data.combustivel ? (
          <div>
            <dt className="text-xs text-ink-subtle">Combustível</dt>
            <dd className="text-ink">{data.combustivel}</dd>
          </div>
        ) : null}
        {data.mesReferencia ? (
          <div>
            <dt className="text-xs text-ink-subtle">Mês de referência</dt>
            <dd className="text-ink">{data.mesReferencia}</dd>
          </div>
        ) : null}
        {data.codigoFipe ? (
          <div>
            <dt className="text-xs text-ink-subtle">Código FIPE</dt>
            <dd className="font-mono text-ink">{data.codigoFipe}</dd>
          </div>
        ) : null}
        {data.modelo ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-subtle">Modelo oficial</dt>
            <dd className="text-ink">{data.modelo}</dd>
          </div>
        ) : null}
        {data.dataConsulta ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-subtle">Consulta</dt>
            <dd className="text-ink-muted">{data.dataConsulta}</dd>
          </div>
        ) : null}
      </dl>
      {onUseSuggestedPrice && data.valor != null ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onUseSuggestedPrice(data.valor as number)}
        >
          Usar como preço sugerido
        </Button>
      ) : null}
    </div>
  );
}
