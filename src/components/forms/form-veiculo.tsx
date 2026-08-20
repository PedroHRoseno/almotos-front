"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { Vehicle, VehicleBrand } from "@/types";
import { VEHICLE_BRANDS } from "@/types";
import { cn } from "@/lib/utils";
import { VehiclePhotoPipeline } from "@/components/vehicle/vehicle-photo-pipeline";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FipeModelAutocomplete } from "@/components/forms/fipe-model-autocomplete";
import { TagInput } from "@/components/forms/tag-input";

const emptyDefaults: Partial<VeiculoFormData> = {
  licensePlate: "",
  brand: "HONDA",
  modelName: "",
  manufactureYear: new Date().getFullYear(),
  modelYear: new Date().getFullYear(),
  color: "#000000",
  kilometersDriven: 0,
  inStock: true,
  published: false,
  description: "",
  codigoFipe: null,
  suggestedPrice: undefined,
  internalTags: [],
  publicTags: [],
};

function valuesFromVehicle(vehicle: Vehicle): VeiculoFormData {
  return {
    licensePlate: formatLicensePlate(vehicle.licensePlate),
    brand: vehicle.brand,
    modelName: vehicle.modelName,
    manufactureYear: vehicle.manufactureYear,
    modelYear: vehicle.modelYear,
    color: vehicle.color,
    kilometersDriven: vehicle.kilometersDriven,
    inStock: vehicle.inStock,
    published: Boolean(vehicle.published),
    description: vehicle.description ?? "",
    codigoFipe: vehicle.codigoFipe ?? null,
    suggestedPrice: vehicle.suggestedPrice ?? undefined,
    internalTags: (vehicle.internalTags ?? []).map((tag) => tag.name),
    publicTags: (vehicle.publicTags ?? []).map((tag) => tag.name),
  };
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message.trim();
  try {
    const parsed = JSON.parse(raw) as { error?: unknown; detail?: unknown };
    if (typeof parsed.error === "string" && parsed.error) return parsed.error;
    if (typeof parsed.detail === "string" && parsed.detail) return parsed.detail;
  } catch {
    /* texto puro */
  }
  return raw || fallback;
}

export interface FormVeiculoProps {
  mode?: "create" | "edit";
  /** Snapshot do GET/listagem; obrigatório em `edit`. */
  vehicle?: Vehicle;
  /** Placa usada no path do PUT. Default: `vehicle.licensePlate`. */
  currentPlate?: string;
  /** Na página de detalhe, a galeria fica no PATCH /catalog — não reabrir o pipeline aqui. */
  includePhotos?: boolean;
  onSuccess?: () => void;
  /** Chamado com a placa resultante (nova, se alterada). */
  onSuccessWithPlate?: (licensePlate: string) => void;
  insideModal?: boolean;
}

export function FormVeiculo({
  mode = "create",
  vehicle,
  currentPlate,
  includePhotos,
  onSuccess,
  onSuccessWithPlate,
  insideModal,
}: FormVeiculoProps = {}) {
  const isEdit = mode === "edit";
  const showPhotos = includePhotos ?? true;
  const plateForPath = currentPlate ?? vehicle?.licensePlate ?? "";

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleImageUrls, setVehicleImageUrls] = useState<string[]>(
    vehicle?.imageUrlList ?? []
  );
  const [photosBlockingSave, setPhotosBlockingSave] = useState(false);

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: vehicle ? valuesFromVehicle(vehicle) : emptyDefaults,
  });

  useEffect(() => {
    if (isEdit && vehicle) {
      form.reset(valuesFromVehicle(vehicle));
      setVehicleImageUrls(vehicle.imageUrlList ?? []);
    }
  }, [form, isEdit, vehicle]);

  const watchedPlate = form.watch("licensePlate");
  const watchedInStock = form.watch("inStock");
  const plateChanged = useMemo(() => {
    if (!isEdit || !plateForPath) return false;
    return formatLicensePlate(watchedPlate || "") !== formatLicensePlate(plateForPath);
  }, [isEdit, plateForPath, watchedPlate]);

  const onSubmit = async (data: VeiculoFormData) => {
    setSuccess(null);
    setError(null);
    const plateFormatted = formatLicensePlate(data.licensePlate);
    const imageUrlList = showPhotos
      ? vehicleImageUrls
      : vehicle?.imageUrlList ?? [];
    const body = {
      licensePlate: plateFormatted,
      brand: data.brand as VehicleBrand,
      modelName: data.modelName.trim(),
      codigoFipe: data.codigoFipe?.trim() || null,
      manufactureYear: data.manufactureYear,
      modelYear: data.modelYear,
      color: data.color.trim().toLowerCase(),
      kilometersDriven: data.kilometersDriven,
      suggestedPrice: data.suggestedPrice ?? null,
      inStock: data.inStock,
      published: data.published,
      description: data.description?.trim() || null,
      imageUrlList,
      internalTags: data.internalTags ?? [],
      publicTags: data.publicTags ?? [],
    };

    try {
      if (isEdit) {
        if (!plateForPath) {
          setError("Placa atual ausente. Recarregue a página.");
          return;
        }
        await api.vehicles.atualizar(plateForPath, body);
        setSuccess("Veículo atualizado com sucesso.");
      } else {
        await api.vehicles.criar(body);
        setSuccess("Veículo cadastrado com sucesso.");
        form.reset(emptyDefaults);
        setVehicleImageUrls([]);
      }
      onSuccessWithPlate?.(plateFormatted);
      onSuccess?.();
    } catch (e) {
      setError(
        apiErrorMessage(
          e,
          isEdit ? "Erro ao atualizar veículo." : "Erro ao cadastrar veículo."
        )
      );
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {success && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {plateChanged && (
        <p className="rounded-xl border border-line bg-surface p-3 text-sm text-ink-muted">
          A identidade do veículo não muda: compras, vendas e trocas continuam
          vinculadas. Só a placa cadastral é corrigida.
        </p>
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
                placeholder="Ex.: KIU-1437 ou ABC-1B23"
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
              <Select
                value={field.value}
                onValueChange={(next) => {
                  field.onChange(next);
                  form.setValue("codigoFipe", null);
                }}
              >
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
          <Controller
            control={form.control}
            name="modelName"
            render={({ field }) => (
              <FipeModelAutocomplete
                id="modelName"
                brand={form.watch("brand")}
                year={form.watch("modelYear")}
                value={field.value}
                codigoFipe={form.watch("codigoFipe")}
                error={!!form.formState.errors.modelName}
                onModelChange={(modelName, codigoFipe) => {
                  field.onChange(modelName);
                  form.setValue("codigoFipe", codigoFipe);
                }}
              />
            )}
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
                  className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-transparent p-1"
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
                  className="h-4 w-4 rounded border-line"
                />
                <span className="text-sm text-ink">Sim, veículo disponível em estoque</span>
              </label>
            )}
          />
          {isEdit && watchedInStock === false && (
            <p className="text-xs text-ink-subtle">
              Fora de estoque o SoR marca como vendido e remove a publicação no catálogo.
            </p>
          )}
        </FormField>

        <FormField
          name="suggestedPrice"
          label="Preço sugerido"
          error={form.formState.errors.suggestedPrice}
        >
          <Controller
            control={form.control}
            name="suggestedPrice"
            render={({ field }) => (
              <CurrencyInput
                id="suggestedPrice"
                placeholder="R$ 0,00"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={!!form.formState.errors.suggestedPrice}
              />
            )}
          />
          <p className="text-xs text-ink-subtle">
            Valor público do catálogo. A IA de atendimento usa este número — não inventa preço.
          </p>
        </FormField>

        <FormField
          name="internalTags"
          label="Tags internas"
          error={form.formState.errors.internalTags}
          className="sm:col-span-2"
        >
          <Controller
            control={form.control}
            name="internalTags"
            render={({ field }) => (
              <TagInput
                id="internalTags"
                visibility="INTERNAL"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Ex.: Consignado, Aguardando peça"
              />
            )}
          />
          <p className="text-xs text-ink-subtle">Só o painel admin vê estas tags.</p>
        </FormField>

        <FormField
          name="publicTags"
          label="Tags públicas"
          error={form.formState.errors.publicTags}
          className="sm:col-span-2"
        >
          <Controller
            control={form.control}
            name="publicTags"
            render={({ field }) => (
              <TagInput
                id="publicTags"
                visibility="PUBLIC"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Ex.: Único dono, Placa Mercosul"
              />
            )}
          />
          <p className="text-xs text-ink-subtle">
            Aparecem no catálogo e na API pública para a IA.
          </p>
        </FormField>

        <FormField
          name="description"
          label="Descrição (opcional)"
          error={form.formState.errors.description}
          className="sm:col-span-2"
        >
          <textarea
            id="description"
            rows={3}
            placeholder="Observações internas ou texto da vitrine"
            {...form.register("description")}
            className={cn(
              "flex w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-brand focus-visible:outline-none",
              form.formState.errors.description && "border-destructive"
            )}
          />
        </FormField>

        {showPhotos && (
          <div className="sm:col-span-2 space-y-2">
            <p className="text-sm font-medium leading-none text-ink-muted">Fotos do catálogo</p>
            <p className="text-xs text-ink-subtle">
              Envie imagens ao armazenamento, edite o recorte 4:3 se quiser e use &quot;Finalizar e publicar
              fotos&quot; antes de salvar o veículo.
            </p>
            <VehiclePhotoPipeline
              committedImageUrls={vehicleImageUrls}
              onCommittedImageUrlsChange={setVehicleImageUrls}
              onBlockingChange={setPhotosBlockingSave}
              disabled={form.formState.isSubmitting}
            />
          </div>
        )}

        <FormField
          name="published"
          label="Publicar no Catálogo Público"
          error={form.formState.errors.published}
          className="sm:col-span-2"
        >
          <Controller
            control={form.control}
            name="published"
            render={({ field }) => (
              <label className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                <span className="text-sm text-ink">Publicar no Catálogo Público</span>
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    field.value ? "bg-emerald-500" : "bg-muted"
                  )}
                  aria-pressed={field.value}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      field.value ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </label>
            )}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3">
        {!isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset(emptyDefaults);
              setVehicleImageUrls([]);
            }}
          >
            Limpar
          </Button>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting || photosBlockingSave}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Salvando…" : "Cadastrando…"}
            </>
          ) : isEdit ? (
            "Salvar alterações"
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
        <CardTitle>{isEdit ? "Editar veículo" : "Cadastrar veículo"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize os dados estruturais, inclusive a placa."
            : "Preencha os dados do veículo para adicionar ao estoque."}
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
