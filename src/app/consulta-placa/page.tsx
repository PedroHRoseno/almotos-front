"use client";

import { useEffect, useRef, useState } from "react";
import { History, Loader2, PackagePlus, Repeat, RotateCw, ScanSearch, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormVeiculo } from "@/components/forms/form-veiculo";
import { FormCompra } from "@/components/forms/form-compra";
import { FormTroca } from "@/components/forms/form-troca";
import { useFormDock } from "@/components/layout/form-dock";
import { PlateBalanceBadge } from "@/components/plates/plate-balance-badge";
import { isLookupablePlate, usePlateLookup } from "@/components/plates/plate-lookup-button";
import { PlateLookupCard } from "@/components/plates/plate-lookup-card";
import { formatLicensePlate } from "@/lib/masks";
import { plateToVehicleValues } from "@/lib/plate-prefill";
import { usePlateBalance } from "@/lib/plate-balance-store";
import type { FipeConsultaResponse, FipeModel, PlateLookupResponse } from "@/types";

const RECENTS_KEY = "almotos:placa-recentes";

type Recent = { plate: string; label: string };

function readRecents(): Recent[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecents(list: Recent[]) {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    /* sem storage */
  }
}

type NextStep = "estoque" | "compra" | "troca";

export default function ConsultaPlacaPage() {
  const dock = useFormDock();
  const { balance } = usePlateBalance();
  const { lookup, loading } = usePlateLookup();
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<PlateLookupResponse | null>(null);
  const [recents, setRecents] = useState<Recent[]>([]);
  const fipeRef = useRef<{ model: FipeModel | null; consulta: FipeConsultaResponse | null }>({
    model: null,
    consulta: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(readRecents());
    inputRef.current?.focus();
  }, []);

  const empty = balance?.status === "EMPTY";
  const valid = isLookupablePlate(plate);

  const search = async (value = plate, forceRefresh = false) => {
    if (!isLookupablePlate(value)) return;
    const res = await lookup(value, forceRefresh);
    if (!res) return;
    setResult(res);
    if (res.outcome === "FOUND" && res.vehicle && res.plate) {
      const next = [
        { plate: res.plate, label: `${res.vehicle.brand.replace(/_/g, " ")} ${res.vehicle.modelName}` },
        ...recents.filter((item) => item.plate !== res.plate),
      ];
      setRecents(next);
      writeRecents(next);
    }
  };

  const openVehicleForm = (step: NextStep) => {
    if (!result?.vehicle) return;
    const { model, consulta } = fipeRef.current;
    const values = plateToVehicleValues(result);
    const id = `vehicle:placa:${result.plate}:${step}`;
    const title =
      step === "compra" ? "Registrar compra" : step === "troca" ? "Iniciar troca" : "Cadastrar no estoque";
    dock.open({
      id,
      title: `${title} · ${result.plate}`,
      description:
        step === "estoque"
          ? "Dados vieram da placa. Confira e complete o resto."
          : `Passo 1 de 2: cadastre a moto (dados da placa). Em seguida abre a ${step === "compra" ? "compra" : "troca"}.`,
      content: (
        <FormVeiculo
          insideModal
          includePhotos={false}
          includeCatalogFields
          initialValues={{
            ...values,
            ...(model ? { modelName: model.nome } : {}),
            codigoFipe: consulta?.codigoFipe ?? null,
          }}
          initialCodigoModelo={model?.codigoModelo ?? null}
          onSuccessWithPlate={(ref) => {
            dock.close(id);
            if (step === "compra") {
              const nextId = `purchase:placa:${ref}`;
              dock.open({
                id: nextId,
                title: `Registrar compra · ${result.plate}`,
                description: "A moto já está selecionada. Informe o fornecedor e os valores.",
                content: <FormCompra insideModal defaultVehiclePlate={ref} onSuccess={() => dock.close(nextId)} />,
              });
            } else if (step === "troca") {
              const nextId = `exchange:placa:${ref}`;
              dock.open({
                id: nextId,
                title: `Iniciar troca · ${result.plate}`,
                description: "A moto de entrada já está selecionada. Escolha a moto de saída.",
                content: <FormTroca insideModal defaultEntradaPlate={ref} onSuccess={() => dock.close(nextId)} />,
              });
            }
          }}
        />
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Consulta Placa</h1>
          <p className="text-ink-muted">
            Marca, modelo, ano, cor e cilindrada pela placa (Simples API). O valor de mercado continua vindo da FIPE.
          </p>
        </div>
        <PlateBalanceBadge />
      </div>

      {balance?.status === "LOW" && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Saldo da Simples API baixo. Programe uma recarga para não ficar sem consulta por placa.
        </p>
      )}
      {empty && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          O saldo da Simples API acabou. A consulta por placa está pausada: cadastre a moto preenchendo os dados
          manualmente (a FIPE continua funcionando).
        </p>
      )}

      <form
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <Input
          ref={inputRef}
          aria-label="Placa"
          value={plate}
          onChange={(event) => setPlate(event.target.value.trim() ? formatLicensePlate(event.target.value) : "")}
          placeholder="ABC-1B23"
          maxLength={8}
          autoCapitalize="characters"
          className="h-14 font-mono text-2xl uppercase tracking-[0.2em] sm:max-w-xs"
        />
        <Button type="submit" size="lg" className="h-14" disabled={!valid || loading || empty}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ScanSearch className="mr-2 h-5 w-5" />}
          Consultar placa
        </Button>
        {result?.cached && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void search(plate, true)} disabled={loading || empty}>
            <RotateCw className="mr-1.5 h-4 w-4" /> Reconsultar (cobra)
          </Button>
        )}
      </form>

      {recents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-subtle">
            <History className="h-3.5 w-3.5" /> Recentes
          </span>
          {recents.map((item) => (
            <button
              key={item.plate}
              type="button"
              onClick={() => {
                setPlate(item.plate);
                void search(item.plate);
              }}
              className="flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink transition-colors hover:border-brand/60"
            >
              <span className="font-mono">{item.plate}</span>
              <span className="truncate text-ink-subtle">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setRecents([]);
              writeRecents([]);
            }}
            className="text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
          >
            limpar
          </button>
        </div>
      )}

      {result && result.outcome !== "FOUND" && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-muted">
          {result.message ?? "Sem dados para esta placa."} Você pode{" "}
          <button
            type="button"
            className="font-medium text-brand underline-offset-2 hover:underline"
            onClick={() => {
              const id = `vehicle:placa:manual:${plate}`;
              dock.open({
                id,
                title: "Cadastrar no estoque",
                description: "Preenchimento manual.",
                content: (
                  <FormVeiculo
                    insideModal
                    includePhotos={false}
                    includeCatalogFields
                    initialValues={valid ? { licensePlate: plate } : {}}
                    onSuccessWithPlate={() => dock.close(id)}
                  />
                ),
              });
            }}
          >
            cadastrar manualmente
          </button>
          .
        </p>
      )}

      {result?.outcome === "FOUND" && result.vehicle && (
        <div className="space-y-4">
          <PlateLookupCard
            result={result}
            onFipeChange={(model, consulta) => {
              fipeRef.current = { model, consulta };
            }}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Button type="button" size="lg" onClick={() => openVehicleForm("estoque")}>
              <PackagePlus className="mr-2 h-5 w-5" /> Cadastrar no estoque
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => openVehicleForm("compra")}>
              <ShoppingBag className="mr-2 h-5 w-5" /> Registrar compra
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => openVehicleForm("troca")}>
              <Repeat className="mr-2 h-5 w-5" /> Iniciar troca
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
