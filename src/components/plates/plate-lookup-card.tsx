"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BadgeDollarSign, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import { cn } from "@/lib/utils";
import type { FipeConsultaResponse, FipeModel, PlateLookupResponse } from "@/types";

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

/** Resultado da placa + ponte para a FIPE (Brasil API continua sendo a fonte do valor). */
export function PlateLookupCard({ result, onFipeChange }: PlateLookupCardProps) {
  const vehicle = result.vehicle;
  const meta = result.metadata;
  const fipe = result.fipe;
  const [picked, setPicked] = useState<FipeModel | null>(fipe?.autoSelect ?? null);
  const [consulta, setConsulta] = useState<FipeConsultaResponse | null>(null);
  const [loadingFipe, setLoadingFipe] = useState(false);

  useEffect(() => {
    setPicked(result.fipe?.autoSelect ?? null);
  }, [result]);

  useEffect(() => {
    const year = vehicle?.modelYear ?? vehicle?.manufactureYear;
    if (!picked || !vehicle?.brand || !year) {
      setConsulta(null);
      onFipeChange?.(picked, null);
      return;
    }
    let cancelled = false;
    setLoadingFipe(true);
    api.fipe
      .consulta(vehicle.brand, picked.codigoModelo, year)
      .then((res) => {
        if (cancelled) return;
        setConsulta(res);
        onFipeChange?.(picked, res);
      })
      .catch(() => {
        if (cancelled) return;
        setConsulta({ available: false });
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
  }, [picked, vehicle?.brand, vehicle?.modelYear, vehicle?.manufactureYear]);

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

      {meta && !meta.isMotorcycle && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Esta placa é de um {meta.vehicleType ?? "veículo"}, não de uma moto. Confira antes de cadastrar.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Row label="Cilindrada" value={vehicle.engineCc ? `${vehicle.engineCc} cc` : null} />
        <Row label="Combustível" value={vehicle.fuelType ? FUEL_LABEL[vehicle.fuelType] : meta?.fuelRaw} />
        <Row label="Tipo" value={meta?.vehicleType} />
        <Row label="Município" value={meta?.city ? `${meta.city}${meta.state ? `/${meta.state}` : ""}` : null} />
        <Row label="Espécie" value={meta?.species} />
        <Row label="Procedência" value={meta?.origin} />
      </dl>

      <div className="space-y-2 rounded-xl border border-line p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <BadgeDollarSign className="h-4 w-4 text-brand" /> Referência FIPE (Brasil API)
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
          <p className="text-sm text-ink-muted">Sem valor FIPE para este ano.</p>
        )}
      </div>
    </section>
  );
}
