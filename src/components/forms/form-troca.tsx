"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trocaSchema, type TrocaFormData } from "@/lib/validations/schemas";
import { api, type Veiculo } from "@/lib/api";
import { useState, useEffect } from "react";

const defaultValues: Partial<TrocaFormData> = {
  veiculoEntradaLicensePlate: "",
  veiculoSaidaLicensePlate: "",
  valorDiferenca: 0,
};

export function FormTroca() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);

  const form = useForm<TrocaFormData>({
    resolver: zodResolver(trocaSchema),
    defaultValues,
  });

  useEffect(() => {
    api.veiculos
      .listar()
      .then((data) => setVeiculos(Array.isArray(data) ? data : []))
      .catch(() => setVeiculos([]))
      .finally(() => setLoadingVeiculos(false));
  }, []);

  const entradaPlaca = form.watch("veiculoEntradaLicensePlate");
  const disponiveis = veiculos.filter((v) => v.inStock);

  const onSubmit = async (data: TrocaFormData) => {
    setSuccess(null);
    setError(null);
    try {
      await api.trocas.realizar({
        veiculoEntradaLicensePlate: data.veiculoEntradaLicensePlate,
        veiculoSaidaLicensePlate: data.veiculoSaidaLicensePlate,
        valorDiferenca: data.valorDiferenca,
      });
      setSuccess("Troca realizada com sucesso.");
      form.reset(defaultValues);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao realizar troca.");
    }
  };

  const renderVeiculoLabel = (v: Veiculo) =>
    `${v.brand} ${v.modelName} (${v.modelYear}) – ${v.licensePlate}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realizar troca</CardTitle>
        <CardDescription>
          Registre a troca: veículo que o cliente entrega, veículo que compra e valor da diferença.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-800 dark:text-green-200">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              name="veiculoEntradaLicensePlate"
              label="Veículo de entrada"
              required
              error={form.formState.errors.veiculoEntradaLicensePlate}
            >
              <Controller
                control={form.control}
                name="veiculoEntradaLicensePlate"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingVeiculos}
                  >
                    <SelectTrigger
                      id="veiculoEntradaLicensePlate"
                      className={form.formState.errors.veiculoEntradaLicensePlate ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder={loadingVeiculos ? "Carregando…" : "Veículo que o cliente entregou"} />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.licensePlate} value={v.licensePlate}>
                          {renderVeiculoLabel(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              name="veiculoSaidaLicensePlate"
              label="Veículo de saída"
              required
              error={form.formState.errors.veiculoSaidaLicensePlate}
            >
              <Controller
                control={form.control}
                name="veiculoSaidaLicensePlate"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingVeiculos}
                  >
                    <SelectTrigger
                      id="veiculoSaidaLicensePlate"
                      className={form.formState.errors.veiculoSaidaLicensePlate ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder={loadingVeiculos ? "Carregando…" : "Veículo que o cliente comprou"} />
                    </SelectTrigger>
                    <SelectContent>
                      {disponiveis
                        .filter((v) => v.licensePlate !== entradaPlaca)
                        .map((v) => (
                          <SelectItem key={v.licensePlate} value={v.licensePlate}>
                            {renderVeiculoLabel(v)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              name="valorDiferenca"
              label="Valor da diferença (R$)"
              required
              error={form.formState.errors.valorDiferenca}
            >
              <Input
                id="valorDiferenca"
                type="number"
                step="0.01"
                min={0}
                placeholder="Ex.: 5000,00"
                {...form.register("valorDiferenca", { valueAsNumber: true })}
                className={form.formState.errors.valorDiferenca ? "border-destructive" : ""}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => form.reset(defaultValues)}>
              Limpar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || loadingVeiculos}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Realizando…
                </>
              ) : (
                "Realizar troca"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
