"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compraSchema, type CompraFormData } from "@/lib/validations/schemas";
import { api } from "@/lib/api";
import { digitsOnly } from "@/lib/masks";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormParceiro } from "./form-parceiro";
import { FormVeiculo } from "./form-veiculo";

const defaultValues: Partial<CompraFormData> = {
  vehicleLicensePlate: "",
  customerDocument: "",
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().split("T")[0], // yyyy-MM-dd
};

export interface FormCompraProps {
  onSuccess?: () => void;
  insideModal?: boolean;
}

export function FormCompra({ onSuccess, insideModal }: FormCompraProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<Array<{ licensePlate: string; brand: string; modelName: string }>>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [partners, setPartners] = useState<Array<{ document: string; name: string; city?: string }>>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [modalParceiroOpen, setModalParceiroOpen] = useState(false);
  const [modalVeiculoOpen, setModalVeiculoOpen] = useState(false);

  const form = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues,
  });

  // Buscar veículos disponíveis
  useEffect(() => {
    setLoadingVeiculos(true);
    api.vehicles
      .listar(0, 1000)
      .then((response) => {
        setVeiculos(
          (response.content || []).map((v) => ({
            licensePlate: v.licensePlate,
            brand: v.brand,
            modelName: v.modelName,
          }))
        );
      })
      .catch(() => {
        setVeiculos([]);
      })
      .finally(() => setLoadingVeiculos(false));
  }, []);

  // Buscar parceiros
  useEffect(() => {
    setLoadingPartners(true);
    api.customers
      .listar(0, 1000)
      .then((response) => {
        setPartners(response.content || []);
      })
      .catch(() => {
        setPartners([]);
      })
      .finally(() => setLoadingPartners(false));
  }, []);

  const veiculoOptions = useMemo(
    () =>
      [...veiculos]
        .sort((a, b) => a.licensePlate.localeCompare(b.licensePlate))
        .map((v) => ({
          value: v.licensePlate,
          label: `${v.brand} ${v.modelName} - ${v.licensePlate}`,
          searchText: `${v.brand} ${v.modelName} ${v.licensePlate}`,
        })),
    [veiculos]
  );

  const parceiroOptions = useMemo(
    () =>
      partners.map((p) => {
        const d = p.document;
        const fmt = d.length === 11
          ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          : d.length === 14
            ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
            : d;
        return {
          value: p.document,
          label: `${p.name} - ${fmt}`,
          searchText: `${p.name} ${p.document} ${fmt} ${p.city || ""}`,
        };
      }),
    [partners]
  );

  const handleParceiroCriado = (document: string) => {
    setModalParceiroOpen(false);
    api.customers
      .listar(0, 100)
      .then((response) => {
        setPartners(response.content || []);
        form.setValue("customerDocument", document);
      })
      .catch(() => {});
  };

  const handleVeiculoCriado = (licensePlate: string) => {
    setModalVeiculoOpen(false);
    // Recarregar lista e selecionar exatamente o veículo criado (não o "primeiro da lista")
    api.vehicles
      .listar(0, 1000)
      .then((response) => {
        setVeiculos(
          (response.content || []).map((v) => ({
            licensePlate: v.licensePlate,
            brand: v.brand,
            modelName: v.modelName,
          }))
        );
        form.setValue("vehicleLicensePlate", licensePlate);
        toast.success(`Veículo ${licensePlate} cadastrado e selecionado para esta compra.`);
      })
      .catch(() => {});
  };

  const onSubmit = async (data: CompraFormData) => {
    setSuccess(null);
    setError(null);
    try {
      // Veículo deve ter sido selecionado ou cadastrado via botão +
      // Criar a compra
      await api.purchases.criar({
        vehicle: { licensePlate: data.vehicleLicensePlate.trim().toUpperCase() },
        customer: { document: digitsOnly(data.customerDocument) },
        purchasePrice: data.purchasePrice,
        purchaseDate: data.purchaseDate,
      });

      setSuccess("Compra registrada com sucesso.");
      if (!insideModal) {
        form.reset(defaultValues);
      }
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar compra.");
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

      <div className="grid gap-6">
        <FormField
          name="vehicleLicensePlate"
          label="Veículo"
          required
          error={form.formState.errors.vehicleLicensePlate}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Controller
                control={form.control}
                name="vehicleLicensePlate"
                render={({ field }) => (
                  <SearchableSelect
                    options={veiculoOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={loadingVeiculos ? "Carregando…" : "Buscar veículo..."}
                    disabled={loadingVeiculos}
                    emptyMessage="Nenhum veículo encontrado"
                    error={!!form.formState.errors.vehicleLicensePlate}
                    allowClear
                  />
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setModalVeiculoOpen(true)}
              title="Cadastrar novo veículo"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione um veículo existente ou cadastre um novo clicando no botão +.
          </p>
        </FormField>

        <FormField
          name="customerDocument"
          label="Fornecedor/Parceiro"
          required
          error={form.formState.errors.customerDocument}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Controller
                control={form.control}
                name="customerDocument"
                render={({ field }) => (
                  <SearchableSelect
                    options={parceiroOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={loadingPartners ? "Carregando…" : "Buscar fornecedor/parceiro..."}
                    disabled={loadingPartners}
                    emptyMessage="Nenhum parceiro encontrado"
                    error={!!form.formState.errors.customerDocument}
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

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            name="purchasePrice"
            label="Valor da compra (R$)"
            required
            error={form.formState.errors.purchasePrice}
          >
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="Ex.: 15000,00"
              {...form.register("purchasePrice", { valueAsNumber: true })}
              className={cn(form.formState.errors.purchasePrice && "border-destructive")}
            />
          </FormField>

          <FormField
            name="purchaseDate"
            label="Data da compra"
            required
            error={form.formState.errors.purchaseDate}
          >
            <Input
              id="purchaseDate"
              type="date"
              {...form.register("purchaseDate")}
              className={cn(form.formState.errors.purchaseDate && "border-destructive")}
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset(defaultValues)}
        >
          Limpar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting || loadingVeiculos || loadingPartners}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando…
            </>
          ) : (
            "Registrar compra"
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
            <CardTitle>Registrar compra</CardTitle>
            <CardDescription>
              Registre a compra de um veículo. Selecione um veículo existente ou cadastre um novo pelo botão +; selecione ou cadastre um fornecedor/parceiro da mesma forma.
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
              Cadastre um novo parceiro/fornecedor para realizar a compra. Após o cadastro, ele será automaticamente selecionado.
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

      <Dialog open={modalVeiculoOpen} onOpenChange={setModalVeiculoOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo para realizar a compra. Após o cadastro, ele será automaticamente selecionado.
            </DialogDescription>
          </DialogHeader>
          <FormVeiculo
            insideModal
            onSuccessWithPlate={handleVeiculoCriado}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
