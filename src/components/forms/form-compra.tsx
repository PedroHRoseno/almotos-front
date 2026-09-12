"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compraSchema, type CompraFormData } from "@/lib/validations/schemas";
import { api, API_MAX_PAGE_SIZE } from "@/lib/api";
import { partnerSelectLabel } from "@/lib/masks";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormParceiro } from "./form-parceiro";
import { FormVeiculo } from "./form-veiculo";
import { BankAccountSelect } from "./bank-account-select";

const defaultValues: Partial<CompraFormData> = {
  vehicleLicensePlate: "",
  customerId: "",
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().split("T")[0], // yyyy-MM-dd
  bankAccountId: "",
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
  const [partners, setPartners] = useState<Array<{ id: string; document?: string | null; name: string; city?: string }>>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [modalParceiroOpen, setModalParceiroOpen] = useState(false);
  const [modalVeiculoOpen, setModalVeiculoOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [debouncedVehicleSearch, setDebouncedVehicleSearch] = useState("");

  const form = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedVehicleSearch(vehicleSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [vehicleSearch]);

  // Busca no SoR (size máximo 200). Sem termo, lista os mais recentes; com termo, filtra placa/modelo/marca.
  useEffect(() => {
    let cancelled = false;
    const isInitial = debouncedVehicleSearch === "";
    if (isInitial) setLoadingVeiculos(true);
    api.vehicles
      .listar(0, API_MAX_PAGE_SIZE, {
        search: debouncedVehicleSearch || undefined,
      })
      .then((response) => {
        if (cancelled) return;
        setVeiculos(
          (response.content || []).map((v) => ({
            licensePlate: v.licensePlate,
            brand: v.brand,
            modelName: v.modelName,
          }))
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVeiculos([]);
        toast.error(
          err instanceof Error && err.message
            ? `Erro ao carregar veículos: ${err.message}`
            : "Erro ao carregar veículos. Tente novamente."
        );
      })
      .finally(() => {
        if (!cancelled && isInitial) setLoadingVeiculos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedVehicleSearch]);

  const handleVehicleSearchChange = useCallback((term: string) => {
    setVehicleSearch(term);
  }, []);

  // Buscar parceiros
  useEffect(() => {
    setLoadingPartners(true);
    api.customers
      .listar(0, API_MAX_PAGE_SIZE)
      .then((response) => {
        setPartners(response.content || []);
      })
      .catch((err: unknown) => {
        setPartners([]);
        toast.error(
          err instanceof Error && err.message
            ? `Erro ao carregar parceiros: ${err.message}`
            : "Erro ao carregar parceiros. Tente novamente."
        );
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

  const handleVeiculoCriado = (licensePlate: string) => {
    setModalVeiculoOpen(false);
    // Recarregar lista e selecionar exatamente o veículo criado (não o "primeiro da lista")
    api.vehicles
      .listar(0, API_MAX_PAGE_SIZE)
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
        customer: { id: data.customerId },
        purchasePrice: data.purchasePrice,
        ...(data.bankAccountId ? { bankAccountId: data.bankAccountId } : {}),
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

      <div className="grid gap-6">
        <FormField
          name="vehicleLicensePlate"
          label="Veículo"
          required
          error={form.formState.errors.vehicleLicensePlate}
        >
          <div className="flex min-w-0 gap-2">
            <div className="min-w-0 flex-1">
              <Controller
                control={form.control}
                name="vehicleLicensePlate"
                render={({ field }) => (
                  <SearchableSelect
                    options={veiculoOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    onSearchChange={handleVehicleSearchChange}
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
          name="customerId"
          label="Fornecedor/Parceiro"
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
                    placeholder={loadingPartners ? "Carregando…" : "Buscar fornecedor/parceiro..."}
                    disabled={loadingPartners}
                    emptyMessage="Nenhum parceiro encontrado"
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
              title="Cadastrar novo parceiro"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione um parceiro existente ou cadastre um novo clicando no botão +.
          </p>
        </FormField>

        <div className="grid min-w-0 gap-6 @lg:grid-cols-2">
          <FormField
            name="purchasePrice"
            label="Valor da compra (R$)"
            required
            error={form.formState.errors.purchasePrice}
          >
            <Controller
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <CurrencyInput
                  id="purchasePrice"
                  placeholder="R$ 0,00"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!form.formState.errors.purchasePrice}
                />
              )}
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

      <div className="flex flex-wrap justify-end gap-3">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Parceiro</DialogTitle>
            <DialogDescription>
              Cadastre um novo parceiro/fornecedor para realizar a compra. Após o cadastro, ele será automaticamente selecionado.
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

      <Dialog open={modalVeiculoOpen} onOpenChange={setModalVeiculoOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo para realizar a compra. Fotos e recorte ficam na ficha do veículo depois.
            </DialogDescription>
          </DialogHeader>
          <FormVeiculo
            insideModal
            includePhotos={false}
            includeCatalogFields
            onSuccessWithPlate={handleVeiculoCriado}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
