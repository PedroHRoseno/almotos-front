"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trocaSchema, type TrocaFormData } from "@/lib/validations/schemas";
import { api } from "@/lib/api";
import { partnerSelectLabel } from "@/lib/masks";
import type { Vehicle, PartnerSummary } from "@/types";
import { useState, useEffect, useMemo, useRef } from "react";
import { FormParceiro } from "@/components/forms/form-parceiro";
import { BankAccountSelect } from "@/components/forms/bank-account-select";
import { FIELD_HINTS } from "@/lib/field-hints";
import { isVehicleAvailable } from "@/lib/vehicle-status";
import { formatBRL } from "@/lib/masks";

const defaultValues: Partial<TrocaFormData> = {
  veiculoEntradaLicensePlate: "",
  veiculoSaidaLicensePlate: "",
  salePriceLoja: undefined,
  tradeInEvaluation: undefined,
  customerId: "",
  bankAccountId: "",
};

export interface FormTrocaProps {
  onSuccess?: () => void;
  insideModal?: boolean;
  defaultSaidaPlate?: string;
}

export function FormTroca({ onSuccess, insideModal, defaultSaidaPlate }: FormTrocaProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [modalParceiroOpen, setModalParceiroOpen] = useState(false);

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
  const saidaPlaca = form.watch("veiculoSaidaLicensePlate");
  const salePriceLoja = form.watch("salePriceLoja") ?? 0;
  const tradeInEvaluation = form.watch("tradeInEvaluation") ?? 0;
  const cashDifference = salePriceLoja - tradeInEvaluation;
  const disponiveis = useMemo(
    () => veiculos.filter((v) => isVehicleAvailable(v)),
    [veiculos]
  );
  const prefilledSaidaPlate = useRef<string>("");

  useEffect(() => {
    if (defaultSaidaPlate) {
      form.setValue("veiculoSaidaLicensePlate", defaultSaidaPlate);
    }
  }, [defaultSaidaPlate, form]);

  useEffect(() => {
    if (!saidaPlaca) {
      prefilledSaidaPlate.current = "";
      return;
    }
    if (prefilledSaidaPlate.current === saidaPlaca) return;
    const saida = disponiveis.find((v) => v.licensePlate === saidaPlaca);
    if (!saida) return;
    if (saida.suggestedPrice != null) {
      form.setValue("salePriceLoja", saida.suggestedPrice);
    }
    prefilledSaidaPlate.current = saidaPlaca;
  }, [disponiveis, form, saidaPlaca]);

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

  const parceiroOptions: SearchableSelectOption[] = useMemo(
    () =>
      partners.map((p) => ({
        value: p.id,
        label: partnerSelectLabel(p.name, p.document),
        searchText: `${p.name} ${p.document || ""} ${p.city || ""}`,
      })),
    [partners]
  );

  const handleParceiroCriado = (id: string) => {
    setModalParceiroOpen(false);
    api.customers
      .listar(0, 100)
      .then((response) => {
        setPartners(response.content || []);
        form.setValue("customerId", id);
      })
      .catch(() => {});
  };

  const onSubmit = async (data: TrocaFormData) => {
    setSuccess(null);
    setError(null);
    try {
      const payload = {
        veiculoEntradaLicensePlate: data.veiculoEntradaLicensePlate,
        veiculoSaidaLicensePlate: data.veiculoSaidaLicensePlate,
        salePriceLoja: data.salePriceLoja,
        tradeInEvaluation: data.tradeInEvaluation,
        customerId: data.customerId.trim(),
        ...(data.bankAccountId ? { bankAccountId: data.bankAccountId } : {}),
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="@container min-w-0 space-y-6">
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

          <div className="grid min-w-0 gap-6 @lg:grid-cols-2">
            <div className="@lg:col-span-2">
              <FormField
                name="customerId"
                label="Cliente"
                required
                error={form.formState.errors.customerId}
              >
                <div className="flex min-w-0 gap-2">
                  <div className="min-w-0 flex-1">
                    <Controller
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <SearchableSelect
                          options={parceiroOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={loadingPartners ? "Carregando…" : "Buscar cliente..."}
                          disabled={loadingPartners}
                          emptyMessage="Nenhum contato encontrado"
                          error={!!form.formState.errors.customerId}
                          allowClear
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setModalParceiroOpen(true)}
                    title="Cadastrar novo contato"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quem entrega a moto e leva a da loja. Cadastre um novo contato pelo botão +.
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
              name="salePriceLoja"
              label="Preço da moto da loja"
              required
              error={form.formState.errors.salePriceLoja}
              hint={FIELD_HINTS.salePrice}
            >
              <Controller
                control={form.control}
                name="salePriceLoja"
                render={({ field }) => (
                  <CurrencyInput
                    id="salePriceLoja"
                    placeholder="R$ 0,00"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!form.formState.errors.salePriceLoja}
                  />
                )}
              />
            </FormField>

            <FormField
              name="tradeInEvaluation"
              label="Avaliação da moto do cliente"
              required
              error={form.formState.errors.tradeInEvaluation}
              hint={FIELD_HINTS.tradeInEvaluation}
            >
              <Controller
                control={form.control}
                name="tradeInEvaluation"
                render={({ field }) => (
                  <CurrencyInput
                    id="tradeInEvaluation"
                    placeholder="R$ 0,00"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!form.formState.errors.tradeInEvaluation}
                  />
                )}
              />
            </FormField>
          </div>

          <div
            className={`rounded-xl border p-3 text-sm ${
              cashDifference > 0
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                : cashDifference < 0
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-line bg-surface text-ink"
            }`}
          >
            <p className="font-medium" title={FIELD_HINTS.cashDifference}>Diferença de caixa</p>
            <p>
              {cashDifference > 0
                ? `A loja recebe ${formatBRL(cashDifference)} do cliente.`
                : cashDifference < 0
                  ? `A loja devolve ${formatBRL(Math.abs(cashDifference))} ao cliente.`
                  : "Troca sem movimentação de caixa."}
            </p>
          </div>

          {cashDifference !== 0 && (
            <Controller
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <BankAccountSelect
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.bankAccountId}
                />
              )}
            />
          )}

          <div className="flex flex-wrap justify-end gap-3">
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

      <Dialog open={modalParceiroOpen} onOpenChange={setModalParceiroOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar contato</DialogTitle>
            <DialogDescription>
              Cadastre o cliente desta troca. Depois do cadastro, ele será selecionado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <FormParceiro
            insideModal
            onSuccessWithId={(id) => {
              handleParceiroCriado(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
