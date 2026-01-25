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
import { vendaSchema, type VendaFormData } from "@/lib/validations/schemas";
import { api, type Veiculo } from "@/lib/api";
import { useState, useEffect } from "react";

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const defaultValues: Partial<VendaFormData> = {
  veiculoLicensePlate: "",
  clienteNome: "",
  valorVenda: 0,
  dataVenda: toDatetimeLocal(new Date()),
};

export function FormVenda() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);

  const form = useForm<VendaFormData>({
    resolver: zodResolver(vendaSchema),
    defaultValues,
  });

  useEffect(() => {
    api.veiculos
      .listar()
      .then((data) => setVeiculos(Array.isArray(data) ? data : []))
      .catch(() => setVeiculos([]))
      .finally(() => setLoadingVeiculos(false));
  }, []);

  const disponiveis = veiculos.filter((v) => v.inStock);

  const onSubmit = async (data: VendaFormData) => {
    setSuccess(null);
    setError(null);
    try {
      const dataVendaISO =
        data.dataVenda.includes("T") ? data.dataVenda : `${data.dataVenda}T12:00:00`;
      await api.vendas.registrar({
        veiculoLicensePlate: data.veiculoLicensePlate,
        clienteNome: data.clienteNome,
        valorVenda: data.valorVenda,
        dataVenda: new Date(dataVendaISO).toISOString(),
      });
      setSuccess("Venda registrada com sucesso.");
      form.reset({ ...defaultValues, dataVenda: toDatetimeLocal(new Date()) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar venda.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar venda</CardTitle>
        <CardDescription>
          Preencha os dados da venda para registrar no sistema.
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
              name="veiculoLicensePlate"
              label="Veículo"
              required
              error={form.formState.errors.veiculoLicensePlate}
            >
              <>
                {!loadingVeiculos && disponiveis.length === 0 && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Nenhum veículo em estoque. Cadastre veículos em Motos primeiro.
                  </p>
                )}
                <Controller
                  control={form.control}
                  name="veiculoLicensePlate"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingVeiculos || disponiveis.length === 0}
                    >
                      <SelectTrigger
                        id="veiculoLicensePlate"
                        className={form.formState.errors.veiculoLicensePlate ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder={loadingVeiculos ? "Carregando…" : "Selecione o veículo"} />
                      </SelectTrigger>
                      <SelectContent>
                        {disponiveis.map((v) => (
                          <SelectItem key={v.licensePlate} value={v.licensePlate}>
                            {v.brand} {v.modelName} ({v.modelYear}) – {v.licensePlate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </>
            </FormField>

            <FormField
              name="clienteNome"
              label="Nome do cliente"
              required
              error={form.formState.errors.clienteNome}
            >
              <Input
                id="clienteNome"
                placeholder="Ex.: João Silva"
                {...form.register("clienteNome")}
                className={form.formState.errors.clienteNome ? "border-destructive" : ""}
              />
            </FormField>

            <FormField
              name="valorVenda"
              label="Valor da venda (R$)"
              required
              error={form.formState.errors.valorVenda}
            >
              <Input
                id="valorVenda"
                type="number"
                step="0.01"
                min={0.01}
                placeholder="Ex.: 18500,00"
                {...form.register("valorVenda", { valueAsNumber: true })}
                className={form.formState.errors.valorVenda ? "border-destructive" : ""}
              />
            </FormField>

            <FormField
              name="dataVenda"
              label="Data e hora da venda"
              required
              error={form.formState.errors.dataVenda}
            >
              <Input
                id="dataVenda"
                type="datetime-local"
                {...form.register("dataVenda")}
                className={form.formState.errors.dataVenda ? "border-destructive" : ""}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset({ ...defaultValues, dataVenda: toDatetimeLocal(new Date()) })}
            >
              Limpar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || loadingVeiculos}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando…
                </>
              ) : (
                "Registrar venda"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
