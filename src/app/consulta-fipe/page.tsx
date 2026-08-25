"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FipeModelAutocomplete } from "@/components/forms/fipe-model-autocomplete";
import { FipeConsultaCard } from "@/components/forms/fipe-consulta-card";
import { api } from "@/lib/api";
import type { FipeAno, FipeConsultaResponse, VehicleBrand } from "@/types";
import { VEHICLE_BRANDS } from "@/types";

function yearFromCodigo(codigoAno: string): number | null {
  const match = codigoAno.match(/^(\d{4})/);
  if (!match) return null;
  return Number(match[1]);
}

export default function ConsultaFipePage() {
  const [brand, setBrand] = useState<VehicleBrand>("HONDA");
  const [modelName, setModelName] = useState("");
  const [codigoModelo, setCodigoModelo] = useState<string | null>(null);
  const [anos, setAnos] = useState<FipeAno[]>([]);
  const [anosAvailable, setAnosAvailable] = useState(true);
  const [codigoAno, setCodigoAno] = useState<string>("");
  const [consulta, setConsulta] = useState<FipeConsultaResponse | null>(null);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [loadingConsulta, setLoadingConsulta] = useState(false);

  useEffect(() => {
    setAnos([]);
    setCodigoAno("");
    setConsulta(null);
    if (!brand || !codigoModelo) return;
    let cancelled = false;
    setLoadingAnos(true);
    api.fipe
      .anos(brand, codigoModelo)
      .then((res) => {
        if (cancelled) return;
        setAnosAvailable(res.available);
        setAnos(res.items ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setAnosAvailable(false);
        setAnos([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAnos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brand, codigoModelo]);

  useEffect(() => {
    if (!brand || !codigoModelo || !codigoAno) {
      setConsulta(null);
      return;
    }
    const year = yearFromCodigo(codigoAno);
    if (year == null) return;
    let cancelled = false;
    setLoadingConsulta(true);
    api.fipe
      .consulta(brand, codigoModelo, year)
      .then((res) => {
        if (!cancelled) setConsulta(res);
      })
      .catch(() => {
        if (!cancelled) setConsulta({ available: false });
      })
      .finally(() => {
        if (!cancelled) setLoadingConsulta(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brand, codigoModelo, codigoAno]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Consulta FIPE
        </h1>
        <p className="text-ink-muted">
          Consulte valor de tabela e dados de uma moto na Brasil API, sem cadastrar veículo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" />
            Tabela FIPE (motos)
          </CardTitle>
          <CardDescription>
            Escolha marca, modelo e ano. O valor FIPE é só referência — não grava no estoque.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consulta-brand">Marca</Label>
              <Select
                value={brand}
                onValueChange={(next) => {
                  setBrand(next as VehicleBrand);
                  setModelName("");
                  setCodigoModelo(null);
                }}
              >
                <SelectTrigger id="consulta-brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_BRANDS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consulta-modelo">Modelo</Label>
              <FipeModelAutocomplete
                id="consulta-modelo"
                brand={brand}
                year={codigoAno ? yearFromCodigo(codigoAno) ?? undefined : undefined}
                value={modelName}
                codigoFipe={consulta?.codigoFipe}
                onModelChange={(name, _codigoFipe, nextCodigo) => {
                  setModelName(name);
                  if (nextCodigo !== undefined) setCodigoModelo(nextCodigo);
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="consulta-ano">Ano</Label>
              <Select
                value={codigoAno}
                onValueChange={setCodigoAno}
                disabled={!codigoModelo || loadingAnos || anos.length === 0}
              >
                <SelectTrigger id="consulta-ano">
                  <SelectValue
                    placeholder={
                      loadingAnos
                        ? "Carregando anos…"
                        : !codigoModelo
                          ? "Selecione um modelo FIPE"
                          : anos.length === 0
                            ? "Nenhum ano encontrado"
                            : "Selecione o ano"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano.codigoAno} value={ano.codigoAno}>
                      {ano.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!anosAvailable ? (
                <p className="text-xs text-ink-subtle">FIPE indisponível no momento.</p>
              ) : null}
            </div>
          </div>

          <FipeConsultaCard data={consulta} loading={loadingConsulta} />
        </CardContent>
      </Card>
    </div>
  );
}
