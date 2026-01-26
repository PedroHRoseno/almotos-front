"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { VehicleBrand } from "@/types";
import { VEHICLE_BRANDS } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormParceiro } from "./form-parceiro";
import { FormVeiculo } from "./form-veiculo";

const defaultValues: Partial<CompraFormData> = {
  vehicleLicensePlate: "",
  customerCpf: "",
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().split("T")[0], // yyyy-MM-dd
  cadastrarVeiculo: false,
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
  const [partners, setPartners] = useState<Array<{ cpf: string; name: string; city?: string }>>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [modalParceiroOpen, setModalParceiroOpen] = useState(false);
  const [modalVeiculoOpen, setModalVeiculoOpen] = useState(false);

  const form = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues,
  });

  const cadastrarVeiculo = form.watch("cadastrarVeiculo");

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
      veiculos.map((v) => ({
        value: v.licensePlate,
        label: `${v.brand} ${v.modelName} - ${v.licensePlate}`,
        searchText: `${v.brand} ${v.modelName} ${v.licensePlate}`,
      })),
    [veiculos]
  );

  const parceiroOptions = useMemo(
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

  const cpfSomenteDigitos = (cpf: string) => {
    return cpf.replace(/\D/g, "");
  };

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

  const handleVeiculoCriado = (licensePlate: string) => {
    setModalVeiculoOpen(false);
    // Recarregar lista de veículos
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
        // Selecionar o veículo recém-criado
        form.setValue("vehicleLicensePlate", licensePlate);
        form.setValue("cadastrarVeiculo", false);
      })
      .catch(() => {});
  };

  const onSubmit = async (data: CompraFormData) => {
    setSuccess(null);
    setError(null);
    try {
      // Se estiver cadastrando um novo veículo, primeiro criar o veículo
      if (data.cadastrarVeiculo && data.vehicleBrand && data.vehicleModelName) {
        await api.vehicles.criar({
          licensePlate: data.vehicleLicensePlate.trim().toUpperCase(),
          brand: data.vehicleBrand as VehicleBrand,
          modelName: data.vehicleModelName.trim(),
          manufactureYear: data.vehicleManufactureYear!,
          modelYear: data.vehicleModelYear!,
          color: data.vehicleColor!.trim().toLowerCase(),
          kilometersDriven: data.vehicleKilometersDriven!,
          inStock: true, // Compras sempre entram como disponível
        });
      }

      // Criar a compra
      await api.purchases.criar({
        vehicle: { licensePlate: data.vehicleLicensePlate.trim().toUpperCase() },
        customer: { cpf: cpfSomenteDigitos(data.customerCpf) },
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
          name="cadastrarVeiculo"
          label="Cadastrar novo veículo"
          error={form.formState.errors.cadastrarVeiculo}
        >
          <div className="flex items-center space-x-2">
            <Controller
              control={form.control}
              name="cadastrarVeiculo"
              render={({ field }) => (
                <Checkbox
                  id="cadastrarVeiculo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              htmlFor="cadastrarVeiculo"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cadastrar um novo veículo nesta compra
            </label>
          </div>
        </FormField>

        {!cadastrarVeiculo ? (
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
        ) : (
          <>
            <FormField
              name="vehicleLicensePlate"
              label="Placa do Veículo"
              required
              error={form.formState.errors.vehicleLicensePlate}
            >
              <Input
                id="vehicleLicensePlate"
                placeholder="Ex.: ABC-1D23"
                {...form.register("vehicleLicensePlate")}
                className={cn(form.formState.errors.vehicleLicensePlate && "border-destructive")}
              />
            </FormField>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField name="vehicleBrand" label="Marca" required error={form.formState.errors.vehicleBrand}>
                <Controller
                  control={form.control}
                  name="vehicleBrand"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="vehicleBrand"
                        className={cn(form.formState.errors.vehicleBrand && "border-destructive")}
                      >
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_BRANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                name="vehicleModelName"
                label="Modelo"
                required
                error={form.formState.errors.vehicleModelName}
              >
                <Input
                  id="vehicleModelName"
                  placeholder="Ex.: CG 160 Titan"
                  {...form.register("vehicleModelName")}
                  className={cn(form.formState.errors.vehicleModelName && "border-destructive")}
                />
              </FormField>

              <FormField
                name="vehicleManufactureYear"
                label="Ano de Fabricação"
                required
                error={form.formState.errors.vehicleManufactureYear}
              >
                <Input
                  id="vehicleManufactureYear"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  placeholder="Ex.: 2023"
                  {...form.register("vehicleManufactureYear", { valueAsNumber: true })}
                  className={cn(form.formState.errors.vehicleManufactureYear && "border-destructive")}
                />
              </FormField>

              <FormField
                name="vehicleModelYear"
                label="Ano do Modelo"
                required
                error={form.formState.errors.vehicleModelYear}
              >
                <Input
                  id="vehicleModelYear"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  placeholder="Ex.: 2023"
                  {...form.register("vehicleModelYear", { valueAsNumber: true })}
                  className={cn(form.formState.errors.vehicleModelYear && "border-destructive")}
                />
              </FormField>

              <FormField
                name="vehicleColor"
                label="Cor (hexadecimal)"
                required
                error={form.formState.errors.vehicleColor}
              >
                <Input
                  id="vehicleColor"
                  type="color"
                  {...form.register("vehicleColor")}
                  className={cn(form.formState.errors.vehicleColor && "border-destructive")}
                />
              </FormField>

              <FormField
                name="vehicleKilometersDriven"
                label="Quilometragem"
                required
                error={form.formState.errors.vehicleKilometersDriven}
              >
                <Input
                  id="vehicleKilometersDriven"
                  type="number"
                  min={0}
                  placeholder="Ex.: 15000"
                  {...form.register("vehicleKilometersDriven", { valueAsNumber: true })}
                  className={cn(form.formState.errors.vehicleKilometersDriven && "border-destructive")}
                />
              </FormField>
            </div>
          </>
        )}

        <FormField
          name="customerCpf"
          label="Fornecedor/Parceiro"
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
                    placeholder={loadingPartners ? "Carregando…" : "Buscar fornecedor/parceiro..."}
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
              Registre a compra de um veículo. Você pode selecionar um veículo existente ou cadastrar um novo, assim como selecionar ou cadastrar um fornecedor/parceiro.
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
            onSuccess={() => {
              // Recarregar lista de veículos após cadastro
              setModalVeiculoOpen(false);
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
                  // Selecionar o último veículo cadastrado (assumindo que é o mais recente)
                  if (response.content && response.content.length > 0) {
                    const latestVehicle = response.content[0]; // Primeiro da lista (mais recente)
                    form.setValue("vehicleLicensePlate", latestVehicle.licensePlate);
                    form.setValue("cadastrarVeiculo", false);
                  }
                })
                .catch(() => {});
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
