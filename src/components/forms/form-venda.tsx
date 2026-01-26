"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { vendaSchema, type VendaFormData } from "@/lib/validations/schemas";
import { api } from "@/lib/api";
import type { Vehicle, PartnerSummary } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FormParceiro } from "@/components/forms/form-parceiro";

function cpfSomenteDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

const defaultValues: Partial<VendaFormData> = {
  vehicleLicensePlate: "",
  customerCpf: "",
  salePrice: 0,
};

export interface FormVendaProps {
  onSuccess?: () => void;
  insideModal?: boolean;
}

export function FormVenda({ onSuccess, insideModal }: FormVendaProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [modalParceiroOpen, setModalParceiroOpen] = useState(false);

  const form = useForm<VendaFormData>({
    resolver: zodResolver(vendaSchema),
    defaultValues,
  });

  useEffect(() => {
    setLoadingVeiculos(true);
    // Buscar apenas veículos disponíveis
    api.vehicles
      .listarDisponiveis(0, 100) // Buscar até 100 veículos disponíveis
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

  const disponiveis = veiculos.filter((v) => v.inStock || v.status === "DISPONIVEL");

  // Preparar opções de veículos para o SearchableSelect
  const veiculoOptions: SearchableSelectOption[] = useMemo(
    () =>
      disponiveis.map((v) => ({
        value: v.licensePlate,
        label: `${v.brand} ${v.modelName} (${v.modelYear}) – ${v.licensePlate}`,
        searchText: `${v.brand} ${v.modelName} ${v.modelYear} ${v.licensePlate} ${v.color}`,
      })),
    [disponiveis]
  );

  // Preparar opções de parceiros para o SearchableSelect
  const parceiroOptions: SearchableSelectOption[] = useMemo(
    () =>
      partners.map((p) => {
        const cpfFormatado = p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        return {
          value: p.cpf,
          label: `${p.name} - ${cpfFormatado}`,
          searchText: `${p.name} ${p.cpf} ${cpfFormatado} ${p.city || ""}`,
        };
      }),
    [partners]
  );

  const handleParceiroCriado = (cpf: string) => {
    setModalParceiroOpen(false);
    // Recarregar lista de parceiros
    api.customers
      .listar(0, 100)
      .then((response) => {
        setPartners(response.content || []);
        // Selecionar o parceiro recém-criado
        form.setValue("customerCpf", cpf);
      })
      .catch(() => {});
  };

  const onSubmit = async (data: VendaFormData) => {
    setSuccess(null);
    setError(null);
    try {
      await api.sales.criar({
        vehicle: { licensePlate: data.vehicleLicensePlate },
        customer: { cpf: cpfSomenteDigitos(data.customerCpf) },
        salePrice: data.salePrice,
      });
      setSuccess("Venda registrada com sucesso.");
      if (!insideModal) {
        form.reset(defaultValues);
      }
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar venda.");
    }
  };

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
            <FormField
              name="vehicleLicensePlate"
              label="Veículo"
              required
              error={form.formState.errors.vehicleLicensePlate}
            >
              <>
                {!loadingVeiculos && disponiveis.length === 0 && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Nenhum veículo em estoque. Cadastre veículos em Motos primeiro.
                  </p>
                )}
                <Controller
                  control={form.control}
                  name="vehicleLicensePlate"
                  render={({ field }) => (
                    <SearchableSelect
                      options={veiculoOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={loadingVeiculos ? "Carregando…" : "Buscar veículo..."}
                      disabled={loadingVeiculos || disponiveis.length === 0}
                      emptyMessage="Nenhum veículo encontrado"
                      error={!!form.formState.errors.vehicleLicensePlate}
                      allowClear
                    />
                  )}
                />
              </>
            </FormField>

            <FormField
              name="customerCpf"
              label="Cliente/Parceiro"
              required
              error={form.formState.errors.customerCpf}
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <Controller
                    control={form.control}
                    name="customerCpf"
                    render={({ field }) => (
                      <SearchableSelect
                        options={parceiroOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={loadingPartners ? "Carregando…" : "Buscar cliente/parceiro..."}
                        disabled={loadingPartners}
                        emptyMessage="Nenhum parceiro encontrado"
                        error={!!form.formState.errors.customerCpf}
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
                  title="Cadastrar novo parceiro"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione um parceiro existente ou cadastre um novo clicando no botão +.
              </p>
            </FormField>

            <FormField
              name="salePrice"
              label="Valor da venda (R$)"
              required
              error={form.formState.errors.salePrice}
            >
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min={0.01}
                placeholder="Ex.: 18500,00"
                {...form.register("salePrice", { valueAsNumber: true })}
                className={cn(form.formState.errors.salePrice && "border-destructive")}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset(defaultValues)}
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
  );

  return (
    <>
      {!insideModal && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar venda</CardTitle>
            <CardDescription>
              Selecione o veículo disponível, escolha o cliente/parceiro (ou cadastre um novo) e informe o valor da venda. A data é definida automaticamente pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      )}

      {insideModal && formContent}

      <Dialog open={modalParceiroOpen} onOpenChange={setModalParceiroOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Parceiro</DialogTitle>
            <DialogDescription>
              Cadastre um novo parceiro para realizar a venda. Após o cadastro, ele será automaticamente selecionado.
            </DialogDescription>
          </DialogHeader>
          <FormParceiro
            insideModal
            onSuccessWithCpf={(cpf) => {
              handleParceiroCriado(cpf);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
