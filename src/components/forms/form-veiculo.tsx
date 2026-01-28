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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { veiculoSchema, type VeiculoFormData } from "@/lib/validations/schemas";
import { formatLicensePlate } from "@/lib/masks";
import { api } from "@/lib/api";
import type { VehicleBrand } from "@/types";
import { VEHICLE_BRANDS } from "@/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

const defaultValues: Partial<VeiculoFormData> = {
  licensePlate: "",
  brand: "HONDA",
  modelName: "",
  manufactureYear: new Date().getFullYear(),
  modelYear: new Date().getFullYear(),
  color: "#000000",
  kilometersDriven: 0,
  inStock: true,
};

export interface FormVeiculoProps {
  onSuccess?: () => void;
  /** Chamado com a placa do veículo recém-criado; use para selecionar esse veículo no formulário pai. */
  onSuccessWithPlate?: (licensePlate: string) => void;
  insideModal?: boolean;
}

export function FormVeiculo({ onSuccess, onSuccessWithPlate, insideModal }: FormVeiculoProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues,
  });

  const onSubmit = async (data: VeiculoFormData) => {
    setSuccess(null);
    setError(null);
    try {
      const plateFormatted = formatLicensePlate(data.licensePlate);
      await api.vehicles.criar({
        licensePlate: plateFormatted,
        brand: data.brand as VehicleBrand,
        modelName: data.modelName.trim(),
        manufactureYear: data.manufactureYear,
        modelYear: data.modelYear,
        color: data.color.trim().toLowerCase(),
        kilometersDriven: data.kilometersDriven,
        inStock: data.inStock,
      });
      const plate = formatLicensePlate(data.licensePlate);
      setSuccess("Veículo cadastrado com sucesso.");
      form.reset(defaultValues);
      onSuccessWithPlate?.(plate);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar veículo.");
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
          name="licensePlate"
          label="Placa"
          required
          error={form.formState.errors.licensePlate}
        >
          <Controller
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <Input
                id="licensePlate"
                placeholder="Ex.: KIU-1437"
                value={field.value}
                onChange={(e) => field.onChange(formatLicensePlate(e.target.value))}
                onBlur={field.onBlur}
                maxLength={8}
                className={cn(form.formState.errors.licensePlate && "border-destructive")}
              />
            )}
          />
        </FormField>

        <FormField name="brand" label="Marca" required error={form.formState.errors.brand}>
          <Controller
            control={form.control}
            name="brand"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="brand"
                  className={cn(form.formState.errors.brand && "border-destructive")}
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

        <FormField name="modelName" label="Modelo" required error={form.formState.errors.modelName}>
          <Input
            id="modelName"
            placeholder="Ex.: Civic"
            {...form.register("modelName")}
            className={cn(form.formState.errors.modelName && "border-destructive")}
          />
        </FormField>

        <FormField
          name="manufactureYear"
          label="Ano de fabricação"
          required
          error={form.formState.errors.manufactureYear}
        >
          <Input
            id="manufactureYear"
            type="number"
            placeholder="Ex.: 1998"
            {...form.register("manufactureYear", { valueAsNumber: true })}
            className={cn(form.formState.errors.manufactureYear && "border-destructive")}
          />
        </FormField>

        <FormField
          name="modelYear"
          label="Ano do modelo"
          required
          error={form.formState.errors.modelYear}
        >
          <Input
            id="modelYear"
            type="number"
            placeholder="Ex.: 1998"
            {...form.register("modelYear", { valueAsNumber: true })}
            className={cn(form.formState.errors.modelYear && "border-destructive")}
          />
        </FormField>

        <FormField name="color" label="Cor" required error={form.formState.errors.color}>
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent p-1"
                  title="Selecionar cor"
                />
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="#000000"
                  className={cn("font-mono uppercase", form.formState.errors.color && "border-destructive")}
                  maxLength={7}
                />
              </div>
            )}
          />
        </FormField>

        <FormField
          name="kilometersDriven"
          label="Quilometragem (km)"
          required
          error={form.formState.errors.kilometersDriven}
        >
          <Input
            id="kilometersDriven"
            type="number"
            step="1"
            min={0}
            placeholder="Ex.: 25000"
            {...form.register("kilometersDriven", { valueAsNumber: true })}
            className={cn(form.formState.errors.kilometersDriven && "border-destructive")}
          />
        </FormField>

        <FormField name="inStock" label="Em estoque" error={form.formState.errors.inStock}>
          <Controller
            control={form.control}
            name="inStock"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Sim, veículo disponível em estoque</span>
              </label>
            )}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => form.reset(defaultValues)}>
          Limpar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando…
            </>
          ) : (
            "Cadastrar veículo"
          )}
        </Button>
      </div>
    </form>
  );

  if (insideModal) return formContent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar veículo</CardTitle>
        <CardDescription>
          Preencha os dados do veículo para adicionar ao estoque.
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
