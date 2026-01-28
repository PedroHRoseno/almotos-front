"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { FormField } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trocaSchema, type TrocaFormData } from "@/lib/validations/schemas";
import { api } from "@/lib/api";
import { digitsOnly } from "@/lib/masks";
import type { Vehicle, PartnerSummary } from "@/types";
import { useState, useEffect, useMemo } from "react";

const defaultValues: Partial<TrocaFormData> = {
  veiculoEntradaLicensePlate: "",
  veiculoSaidaLicensePlate: "",
  tipoDiferenca: "cliente_paga",
  valorAbsoluto: undefined,
  customerDocument: "",
};

export interface FormTrocaProps {
  onSuccess?: () => void;
  insideModal?: boolean;
}

export function FormTroca({ onSuccess, insideModal }: FormTrocaProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const form = useForm<TrocaFormData>({
    resolver: zodResolver(trocaSchema),
    defaultValues,
  });

  useEffect(() => {
    setLoadingVeiculos(true);
    // Buscar todos os veículos para entrada (pode ser qualquer um)
    api.vehicles
      .listar(0, 100)
      .then((response) => setVeiculos(response.content || []))
      .catch(() => setVeiculos([]))
      .finally(() => setLoadingVeiculos(false));

    // Buscar parceiros para seleção
    setLoadingPartners(true);
    api.customers
      .listar(0, 100)
      .then((response) => setPartners(response.content || []))
      .catch(() => setPartners([]))
      .finally(() => setLoadingPartners(false));
  }, []);

  const entradaPlaca = form.watch("veiculoEntradaLicensePlate");
  // Para saída, apenas veículos disponíveis
  const disponiveis = veiculos.filter((v) => v.inStock || v.status === "DISPONIVEL");

  // Preparar opções de veículos para entrada (todos os veículos)
  const veiculoEntradaOptions: SearchableSelectOption[] = useMemo(
    () =>
      veiculos.map((v) => ({
        value: v.licensePlate,
        label: `${v.brand} ${v.modelName} (${v.modelYear}) – ${v.licensePlate}`,
        searchText: `${v.brand} ${v.modelName} ${v.modelYear} ${v.licensePlate} ${v.color}`,
      })),
    [veiculos]
  );

  // Preparar opções de veículos para saída (apenas disponíveis, excluindo o de entrada)
  const veiculoSaidaOptions: SearchableSelectOption[] = useMemo(
    () =>
      disponiveis
        .filter((v) => v.licensePlate !== entradaPlaca)
        .map((v) => ({
          value: v.licensePlate,
          label: `${v.brand} ${v.modelName} (${v.modelYear}) – ${v.licensePlate}`,
          searchText: `${v.brand} ${v.modelName} ${v.modelYear} ${v.licensePlate} ${v.color}`,
        })),
    [disponiveis, entradaPlaca]
  );

  // Preparar opções de parceiros para o SearchableSelect
  const parceiroOptions: SearchableSelectOption[] = useMemo(
    () => {
      const options: SearchableSelectOption[] = [
        {
          value: "__NONE__",
          label: "Não especificar (buscar por venda anterior)",
        },
      ];
      partners.forEach((p) => {
        const d = p.document;
        const fmt = d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : d;
        options.push({ value: p.document, label: `${p.name} - ${fmt}`, searchText: `${p.name} ${p.document} ${fmt} ${p.city || ""}` });
      });
      return options;
    },
    [partners]
  );

  const onSubmit = async (data: TrocaFormData) => {
    setSuccess(null);
    setError(null);
    try {
      const docVal = data.customerDocument?.trim();
      const customerDocument = docVal && docVal !== "__NONE__" ? digitsOnly(docVal) : undefined;
      const valorDiferenca = data.tipoDiferenca === "cliente_paga" ? Number(data.valorAbsoluto) : -Number(data.valorAbsoluto);

      const payload = {
        veiculoEntradaLicensePlate: data.veiculoEntradaLicensePlate,
        veiculoSaidaLicensePlate: data.veiculoSaidaLicensePlate,
        valorDiferenca,
        ...(customerDocument && (customerDocument.length === 11 || customerDocument.length === 14) ? { customerDocument } : {}),
      };

      await api.exchanges.realizar(payload);
      setSuccess("Troca realizada com sucesso.");
      if (!insideModal) {
        form.reset(defaultValues);
      }
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao realizar troca.");
    }
  };

  const renderVeiculoLabel = (v: Vehicle) =>
    `${v.brand} ${v.modelName} (${v.modelYear}) – ${v.licensePlate}`;

  const formContent = (
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
            <div className="sm:col-span-2">
              <FormField
                name="customerDocument"
                label="Documento do Parceiro (opcional)"
                error={form.formState.errors.customerDocument}
              >
                <Controller
                  control={form.control}
                  name="customerDocument"
                  render={({ field }) => (
                    <SearchableSelect
                      options={parceiroOptions}
                      value={field.value || "__NONE__"}
                      onValueChange={(val) => {
                        if (val === "__NONE__") field.onChange("");
                        else field.onChange(val);
                      }}
                      placeholder={loadingPartners ? "Carregando…" : "Buscar parceiro (opcional)..."}
                      disabled={loadingPartners}
                      emptyMessage="Nenhum parceiro encontrado"
                      error={!!form.formState.errors.customerDocument}
                      allowClear
                    />
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  <strong>Recomendado:</strong> Selecione o parceiro para garantir que a troca seja registrada corretamente. 
                  Se não especificado, o sistema tentará encontrar o parceiro através da última venda do veículo de entrada 
                  (apenas se o veículo foi vendido anteriormente pelo sistema).
                </p>
              </FormField>
            </div>
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
                  <SearchableSelect
                    options={veiculoEntradaOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={loadingVeiculos ? "Carregando…" : "Buscar veículo de entrada..."}
                    disabled={loadingVeiculos}
                    emptyMessage="Nenhum veículo encontrado"
                    error={!!form.formState.errors.veiculoEntradaLicensePlate}
                    allowClear
                  />
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
                  <SearchableSelect
                    options={veiculoSaidaOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={loadingVeiculos ? "Carregando…" : "Buscar veículo de saída..."}
                    disabled={loadingVeiculos}
                    emptyMessage="Nenhum veículo disponível encontrado"
                    error={!!form.formState.errors.veiculoSaidaLicensePlate}
                    allowClear
                  />
                )}
              />
            </FormField>

            <FormField
              name="tipoDiferenca"
              label="Quem paga a diferença?"
              required
              error={form.formState.errors.tipoDiferenca}
            >
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="cliente_paga"
                    {...form.register("tipoDiferenca")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Cliente paga a diferença
                  </span>
                  <span className="text-xs text-muted-foreground">(entrada para a loja)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="loja_paga"
                    {...form.register("tipoDiferenca")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Loja paga a diferença
                  </span>
                  <span className="text-xs text-muted-foreground">(saída da loja)</span>
                </label>
              </div>
            </FormField>

            <FormField
              name="valorAbsoluto"
              label="Valor da diferença (R$)"
              required
              error={form.formState.errors.valorAbsoluto}
            >
              <Input
                id="valorAbsoluto"
                type="number"
                step="0.01"
                min={0}
                placeholder="Ex.: 5.000,00"
                {...form.register("valorAbsoluto", { valueAsNumber: true })}
                className={form.formState.errors.valorAbsoluto ? "border-destructive" : ""}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Informe apenas o valor em R$. O tipo (quem paga) já está definido acima.
              </p>
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
  );

  return (
    <>
      {!insideModal && (
        <Card>
          <CardHeader>
            <CardTitle>Realizar troca</CardTitle>
            <CardDescription>
              Registre a troca: veículo que o cliente entrega, veículo que compra e valor da diferença.
            </CardDescription>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      )}

      {insideModal && formContent}
    </>
  );
}
