"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { formatLicensePlate, partnerSelectLabel } from "@/lib/masks";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import type {
  AcquisitionOrigin,
  FipeConsultaResponse,
  PartnerSummary,
  Vehicle,
  VehicleBrand,
} from "@/types";
import { VEHICLE_BRANDS } from "@/types";
import { cn } from "@/lib/utils";
import { VehiclePhotoPipeline } from "@/components/vehicle/vehicle-photo-pipeline";
import { CurrencyInput } from "@/components/ui/currency-input";
import { KilometersInput } from "@/components/ui/kilometers-input";
import { FipeModelAutocomplete } from "@/components/forms/fipe-model-autocomplete";
import { FipeConsultaCard } from "@/components/forms/fipe-consulta-card";
import { TagInput } from "@/components/forms/tag-input";
import { FIELD_HINTS } from "@/lib/field-hints";

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
  ownershipKind: "OWN",
  ownerId: "",
  baseCost: undefined,
  agreedPayout: undefined,
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
    ownershipKind: vehicle.ownershipKind ?? "OWN",
    baseCost: vehicle.baseCost ?? undefined,
    agreedPayout: vehicle.agreedPayout ?? undefined,
    ownerId: vehicle.ownerId ?? "",
  };
}

function resolveAcquisitionOrigin(
  ownershipKind: string | undefined,
  vehicle: Vehicle | undefined
): AcquisitionOrigin {
  if (ownershipKind === "THIRD_PARTY") return "CONSIGNMENT";
  if (vehicle?.acquisitionOrigin && vehicle.acquisitionOrigin !== "CONSIGNMENT") {
    return vehicle.acquisitionOrigin;
  }
  return "STOCK_ADJUSTMENT";
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
  /** Publicação e descrição ficam no card Vitrine da ficha. */
  includeCatalogFields?: boolean;
  onSuccess?: () => void;
  /** Chamado com a placa resultante (nova, se alterada). */
  onSuccessWithPlate?: (licensePlate: string) => void;
  insideModal?: boolean;
  readOnly?: boolean;
  /** Oculta custo, repasse, lucro e tags internas (perfil FINANCE). */
  hideFinancial?: boolean;
}

export function FormVeiculo({
  mode = "create",
  vehicle,
  currentPlate,
  includePhotos = false,
  includeCatalogFields = true,
  onSuccess,
  onSuccessWithPlate,
  insideModal,
  readOnly = false,
  hideFinancial = false,
}: FormVeiculoProps = {}) {
  const isEdit = mode === "edit";
  const showPhotos = includePhotos;
  const showCatalogFields = includeCatalogFields;
  const showFinancial = !hideFinancial;
  const plateForPath = currentPlate ?? vehicle?.licensePlate ?? "";

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleImageUrls, setVehicleImageUrls] = useState<string[]>(
    vehicle?.imageUrlList ?? []
  );
  const [photosBlockingSave, setPhotosBlockingSave] = useState(false);
  const [codigoModelo, setCodigoModelo] = useState<string | null>(null);
  const [fipeConsulta, setFipeConsulta] = useState<FipeConsultaResponse | null>(null);
  const [fipeLoading, setFipeLoading] = useState(false);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: vehicle ? valuesFromVehicle(vehicle) : emptyDefaults,
  });

  const loadedPlateRef = useRef<string | null>(
    vehicle ? formatLicensePlate(vehicle.licensePlate) : null
  );

  useEffect(() => {
    if (!isEdit || !vehicle) return;
    const nextPlate = formatLicensePlate(vehicle.licensePlate);
    if (loadedPlateRef.current === nextPlate) return;
    loadedPlateRef.current = nextPlate;
    form.reset(valuesFromVehicle(vehicle));
    setVehicleImageUrls(vehicle.imageUrlList ?? []);
  }, [form, isEdit, vehicle]);

  const watchedPlate = form.watch("licensePlate");
  const watchedInStock = form.watch("inStock");
  const watchedOwnership = form.watch("ownershipKind");

  useEffect(() => {
    api.customers
      .listar(0, 100)
      .then((response) => setPartners(response.content || []))
      .catch(() => setPartners([]));
  }, []);

  const ownerOptions: SearchableSelectOption[] = useMemo(
    () =>
      partners.map((p) => ({
        value: p.id,
        label: partnerSelectLabel(p.name, p.document),
        searchText: `${p.name} ${p.document || ""}`,
      })),
    [partners]
  );
  const watchedBrand = form.watch("brand");
  const watchedModelYear = form.watch("modelYear");
  const plateChanged = useMemo(() => {
    if (!isEdit || !plateForPath) return false;
    return formatLicensePlate(watchedPlate || "") !== formatLicensePlate(plateForPath);
  }, [isEdit, plateForPath, watchedPlate]);

  useEffect(() => {
    if (!watchedBrand || !codigoModelo || !watchedModelYear) {
      setFipeConsulta(null);
      return;
    }
    let cancelled = false;
    setFipeLoading(true);
    api.fipe
      .consulta(watchedBrand, codigoModelo, watchedModelYear)
      .then((res) => {
        if (!cancelled) setFipeConsulta(res);
      })
      .catch(() => {
        if (!cancelled) setFipeConsulta({ available: false });
      })
      .finally(() => {
        if (!cancelled) setFipeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchedBrand, codigoModelo, watchedModelYear]);

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
      published: showCatalogFields ? data.published : Boolean(vehicle?.published),
      description: showCatalogFields
        ? data.description?.trim() || null
        : vehicle?.description ?? null,
      imageUrlList,
      internalTags: data.internalTags ?? [],
      publicTags: data.publicTags ?? [],
      ownershipKind: data.ownershipKind ?? "OWN",
      ownerId: data.ownershipKind === "THIRD_PARTY" ? data.ownerId || null : null,
      acquisitionOrigin: resolveAcquisitionOrigin(data.ownershipKind, vehicle),
      baseCost: data.ownershipKind === "THIRD_PARTY" ? data.agreedPayout ?? 0 : data.baseCost ?? 0,
      agreedPayout: data.ownershipKind === "THIRD_PARTY" ? data.agreedPayout ?? 0 : null,
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
        <form onSubmit={readOnly ? (e) => e.preventDefault() : form.handleSubmit(onSubmit)} className="@container min-w-0 space-y-6">
      <fieldset disabled={readOnly} className="min-w-0 space-y-6 border-0 p-0">
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

      <div className="grid min-w-0 gap-6 @lg:grid-cols-2">
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
                  setCodigoModelo(null);
                  setFipeConsulta(null);
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
                onModelChange={(modelName, codigoFipe, nextCodigoModelo) => {
                  field.onChange(modelName);
                  form.setValue("codigoFipe", codigoFipe);
                  if (nextCodigoModelo !== undefined) {
                    setCodigoModelo(nextCodigoModelo);
                  }
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
          <Controller
            control={form.control}
            name="kilometersDriven"
            render={({ field }) => (
              <KilometersInput
                id="kilometersDriven"
                placeholder="Ex.: 25.000"
                value={field.value}
                onValueChange={(next) => field.onChange(next ?? 0)}
                onBlur={field.onBlur}
                error={!!form.formState.errors.kilometersDriven}
              />
            )}
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

        {showFinancial && (
        <FormField name="ownershipKind" label="Propriedade" error={form.formState.errors.ownershipKind}>
          <Controller
            control={form.control}
            name="ownershipKind"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "OWN") form.setValue("ownerId", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWN">Estoque próprio</SelectItem>
                  <SelectItem value="THIRD_PARTY">De terceiro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        )}

        {showFinancial && watchedOwnership === "OWN" && (
          <FormField
            name="baseCost"
            label="Custo base"
            required
            error={form.formState.errors.baseCost}
            hint={FIELD_HINTS.baseCost}
          >
            <Controller
              control={form.control}
              name="baseCost"
              render={({ field }) => (
                <CurrencyInput
                  id="baseCost"
                  placeholder="R$ 0,00"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!form.formState.errors.baseCost}
                  disabled={readOnly}
                />
              )}
            />
          </FormField>
        )}

        {showFinancial && watchedOwnership === "THIRD_PARTY" && (
          <FormField
            name="ownerId"
            label="Dono / consignante"
            required
            error={form.formState.errors.ownerId}
          >
            <Controller
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <SearchableSelect
                  options={ownerOptions}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Buscar contato dono..."
                  emptyMessage="Nenhum contato encontrado"
                  error={!!form.formState.errors.ownerId}
                  allowClear
                />
              )}
            />
          </FormField>
        )}

        {showFinancial && watchedOwnership === "THIRD_PARTY" && (
          <FormField
            name="agreedPayout"
            label="Valor de repasse combinado"
            required
            error={form.formState.errors.agreedPayout}
            hint={FIELD_HINTS.payoutAmount}
          >
            <Controller
              control={form.control}
              name="agreedPayout"
              render={({ field }) => (
                <CurrencyInput
                  id="agreedPayout"
                  placeholder="R$ 0,00"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!form.formState.errors.agreedPayout}
                  disabled={readOnly}
                />
              )}
            />
          </FormField>
        )}

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

        {(fipeLoading || fipeConsulta) && (
          <div className="@lg:col-span-2">
            <FipeConsultaCard
              data={fipeConsulta}
              loading={fipeLoading}
              onUseSuggestedPrice={(valor) =>
                form.setValue("suggestedPrice", valor, { shouldDirty: true })
              }
            />
          </div>
        )}

        {showFinancial && (
        <FormField
          name="internalTags"
          label="Tags internas"
          error={form.formState.errors.internalTags}
          className="@lg:col-span-2"
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
        )}

        <FormField
          name="publicTags"
          label="Tags públicas"
          error={form.formState.errors.publicTags}
          className="@lg:col-span-2"
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

        {showCatalogFields && (
        <FormField
          name="description"
          label="Descrição (opcional)"
          error={form.formState.errors.description}
          className="@lg:col-span-2"
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
        )}

        {showPhotos && (
          <div className="@lg:col-span-2 space-y-2">
            <p className="text-sm font-medium leading-none text-ink-muted">Fotos do catálogo</p>
            <p className="text-xs text-ink-subtle">
              Recorte 4:3 no editor antes de enviar. Arraste para ordenar; a primeira é a capa.
            </p>
            <VehiclePhotoPipeline
              committedImageUrls={vehicleImageUrls}
              onCommittedImageUrlsChange={setVehicleImageUrls}
              onBlockingChange={setPhotosBlockingSave}
              disabled={form.formState.isSubmitting}
            />
          </div>
        )}

        {showCatalogFields && (
        <FormField
          name="published"
          label="Publicar no Catálogo Público"
          error={form.formState.errors.published}
          className="@lg:col-span-2"
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
        )}
      </div>
      </fieldset>

      <div className="flex flex-wrap justify-end gap-3">
        {readOnly ? null : !isEdit && (
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
        {readOnly ? null : (
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
        )}
      </div>
    </form>
  );

  if (insideModal) return formContent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hideFinancial ? "Ficha comercial" : isEdit ? "Editar veículo" : "Cadastrar veículo"}
        </CardTitle>
        <CardDescription>
          {hideFinancial
            ? "Dados para simulação de financiamento. Custos e lucro não aparecem neste perfil."
            : isEdit
            ? "Atualize os dados estruturais, inclusive a placa."
            : "Preencha os dados do veículo para adicionar ao estoque."}
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
