"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import { cn } from "@/lib/utils";
import type { FipeConsultaResponse, FipeModel, FipeYearPrice, PlateLookupResponse } from "@/types";

const FUEL_LABEL: Record<string, string> = {
  GASOLINA: "Gasolina",
  ETANOL: "Etanol",
  FLEX: "Flex",
  ELETRICO: "Elétrico",
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="truncate font-medium text-ink">{value}</dd>
    </div>
  );
}

type PlateLookupCardProps = {
  result: PlateLookupResponse;
  /** Modelo FIPE escolhido (auto ou clique) + consulta de preço. */
  onFipeChange?: (model: FipeModel | null, consulta: FipeConsultaResponse | null) => void;
};

/**
 * Resultado da placa + ponte para a FIPE (Brasil API continua sendo a fonte do valor).
 * O backend já manda o valor do ano da placa e dos outros anos para o melhor palpite;
 * só busca de novo quando a pessoa troca o modelo.
 */
export function PlateLookupCard({ result, onFipeChange }: PlateLookupCardProps) {
  const vehicle = result.vehicle;
  const meta = result.metadata;
  const fipe = result.fipe;
  const kind = fipe?.vehicleKind ?? "motos";
  const initial = fipe?.selected ?? fipe?.autoSelect ?? null;
  const [picked, setPicked] = useState<FipeModel | null>(initial);
  const [consulta, setConsulta] = useState<FipeConsultaResponse | null>(null);
  const [years, setYears] = useState<FipeYearPrice[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);

  useEffect(() => {
    setPicked(result.fipe?.selected ?? result.fipe?.autoSelect ?? null);
  }, [result]);

  useEffect(() => {
    const year = vehicle?.modelYear ?? vehicle?.manufactureYear;
    if (!picked || !vehicle?.brand) {
      setConsulta(null);
      setYears([]);
      onFipeChange?.(picked, null);
      return;
    }
    // O palpite do backend já vem com preço e anos: nada a buscar.
    if (fipe?.selected && picked.codigoModelo === fipe.selected.codigoModelo && (fipe.price || fipe.years?.length)) {
      const price = fipe.price ?? { available: true };
      setConsulta(price);
      setYears(fipe.years ?? []);
      onFipeChange?.(picked, price);
      return;
    }
    let cancelled = false;
    setLoadingFipe(true);
    Promise.all([
      year ? api.fipe.consulta(vehicle.brand, picked.codigoModelo, year, kind) : Promise.resolve(null),
      api.fipe.precos(vehicle.brand, picked.codigoModelo, kind).catch(() => null),
    ])
      .then(([res, precos]) => {
        if (cancelled) return;
        setConsulta(res);
        setYears(
          (precos?.items ?? []).map((item) => ({ ...item, plateYear: year != null && item.ano === year }))
        );
        onFipeChange?.(picked, res);
      })
      .catch(() => {
        if (cancelled) return;
        setConsulta({ available: false });
        setYears([]);
        onFipeChange?.(picked, null);
      })
      .finally(() => {
        if (!cancelled) setLoadingFipe(false);
      });
    return () => {
      cancelled = true;
    };
    // onFipeChange é callback do pai; não deve redisparar a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, fipe, kind, vehicle?.brand, vehicle?.modelYear, vehicle?.manufactureYear]);

  const maxValor = useMemo(() => Math.max(0, ...years.map((item) => item.valor ?? 0)), [years]);

  if (!vehicle) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-subtle">{result.plate}</p>
          <h2 className="truncate text-xl font-semibold text-ink">
            {vehicle.brand.replace(/_/g, " ")} {vehicle.modelName}
          </h2>
          <p className="text-sm text-ink-muted">
            {vehicle.manufactureYear ?? "—"}/{vehicle.modelYear ?? "—"}
            {result.cached ? " · consulta recente (sem nova cobrança)" : ""}
            {result.ocr ? ` · lida pela foto (${Math.round(result.ocr.confidence * 100)}%)` : ""}
          </p>
        </div>
        {vehicle.color ? (
          <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-ink-muted">
            <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ backgroundColor: vehicle.color }} />
            {vehicle.colorLabel}
          </span>
        ) : vehicle.colorLabel ? (
          <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-muted">{vehicle.colorLabel}</span>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Row label="Cilindrada" value={vehicle.engineCc ? `${vehicle.engineCc} cc` : null} />
        <Row label="Combustível" value={vehicle.fuelType ? FUEL_LABEL[vehicle.fuelType] : meta?.fuelRaw} />
        <Row label="Tipo" value={meta?.vehicleType} />
        <Row label="Município" value={meta?.city ? `${meta.city}${meta.state ? `/${meta.state}` : ""}` : null} />
        <Row label="Espécie" value={meta?.species} />
        <Row label="Procedência" value={meta?.origin} />
      </dl>

      <div className="space-y-3 rounded-xl border border-line p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <BadgeDollarSign className="h-4 w-4 text-brand" /> Referência FIPE (Brasil API)
          {kind !== "motos" && <span className="text-xs font-normal text-ink-subtle">· tabela de {kind}</span>}
        </p>
        {fipe && !fipe.available && (
          <p className="text-sm text-ink-muted">FIPE indisponível agora. O cadastro segue normalmente.</p>
        )}
        {fipe?.available && fipe.candidates.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhum modelo FIPE parecido. Escolha o modelo no formulário.</p>
        )}
        {fipe && fipe.candidates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fipe.candidates.map((item) => {
              const active = picked?.codigoModelo === item.codigoModelo;
              return (
                <button
                  key={item.codigoModelo}
                  type="button"
                  onClick={() => setPicked(active ? null : item)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active ? "border-brand bg-brand text-white" : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {item.nome}
                </button>
              );
            })}
          </div>
        )}
        {loadingFipe && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Consultando tabela FIPE…
          </p>
        )}
        {!loadingFipe && consulta?.available && consulta.valor != null && (
          <p className="text-sm text-ink">
            <span className="text-2xl font-semibold tabular-nums">{formatBRL(consulta.valor)}</span>{" "}
            <span className="text-ink-subtle">
              {consulta.codigoFipe ? `· ${consulta.codigoFipe}` : ""} {consulta.mesReferencia ? `· ${consulta.mesReferencia}` : ""}
            </span>
          </p>
        )}
        {!loadingFipe && picked && consulta && (!consulta.available || consulta.valor == null) && (
          <p className="text-sm text-ink-muted">Sem valor FIPE para o ano da placa.</p>
        )}
        {!loadingFipe && picked && years.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Outros anos deste modelo</p>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {years.map((item) => (
                <li
                  key={item.codigoAno}
                  className={cn(
                    "relative flex items-center justify-between gap-3 px-3 py-2 text-sm",
                    item.plateYear && "bg-brand/10"
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-brand/10"
                    style={{ width: maxValor && item.valor ? `${(item.valor / maxValor) * 100}%` : 0 }}
                  />
                  <span className="relative truncate text-ink">
                    {item.zeroKm ? "Zero KM" : item.nome}
                    {item.plateYear && <span className="ml-2 text-xs font-medium text-brand">ano da placa</span>}
                  </span>
                  <span className="relative font-medium tabular-nums text-ink">
                    {item.valor != null ? formatBRL(item.valor) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
