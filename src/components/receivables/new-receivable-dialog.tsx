"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ContactPicker } from "@/components/forms/contact-picker";
import { api } from "@/lib/api";
import { todayLocalIso } from "@/lib/documents";
import { formatBRL } from "@/lib/masks";
import { addMonthsIso, formatShortDate, MAX_INSTALLMENTS, previewInstallments } from "@/lib/receivables";
import { plateLabel } from "@/lib/vehicle-ref";
import type { ReceivableAccount, Vehicle } from "@/types";

function vehicleLabel(item: Vehicle): string {
  return `${item.brand.replace(/_/g, " ")} ${item.modelName} (${item.modelYear}) - ${plateLabel(item.licensePlate)}`;
}

export function NewReceivableDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (account: ReceivableAccount) => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState<number | undefined>();
  const [countText, setCountText] = useState("1");
  const [firstDueDate, setFirstDueDate] = useState(() => addMonthsIso(todayLocalIso(), 1));
  const [saving, setSaving] = useState(false);

  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPartnerId("");
    setVehicleId(undefined);
    setDescription("");
    setTotal(undefined);
    setCountText("1");
    setFirstDueDate(addMonthsIso(todayLocalIso(), 1));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setVehiclesLoading(true);
      api.vehicles
        .listar(0, 20, { search: vehicleQuery.trim() || undefined })
        .then((response) => {
          if (!cancelled) setVehicles((response.content || []).filter((item) => item.id));
        })
        .catch(() => {
          if (!cancelled) setVehicles([]);
        })
        .finally(() => {
          if (!cancelled) setVehiclesLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [vehicleQuery, open]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const vehicleOptions = useMemo(() => {
    const options = vehicles.map((item) => ({
      value: item.id as string,
      label: vehicleLabel(item),
      searchText: `${item.brand} ${item.modelName} ${item.licensePlate ?? ""} ${item.color}`,
    }));
    if (selectedVehicle?.id && !options.some((option) => option.value === selectedVehicle.id)) {
      options.unshift({ value: selectedVehicle.id, label: vehicleLabel(selectedVehicle), searchText: "" });
    }
    return options;
  }, [vehicles, selectedVehicle]);

  const count = Math.min(Math.max(Number.parseInt(countText, 10) || 0, 0), MAX_INSTALLMENTS);
  const preview = useMemo(() => previewInstallments(total, count, firstDueDate), [total, count, firstDueDate]);
  const kindLabel = count <= 1 ? "Promissória única" : `Carnê parcelado em ${count}x`;

  const canSave = Boolean(partnerId && description.trim() && total && total > 0 && count >= 1 && preview.length);

  async function save() {
    if (!canSave || !total) {
      toast.error("Preencha cliente, descrição, valor, parcelas e 1º vencimento.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.receivables.criar({
        partnerId,
        vehicleId: vehicleId || null,
        description: description.trim(),
        totalAmount: total,
        installmentsCount: count,
        firstDueDate,
      });
      toast.success(count > 1 ? "Carnê criado." : "Promissória criada.");
      onCreated(created);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova conta a receber</DialogTitle>
          <DialogDescription>
            Uma conta é um acordo com o cliente. As parcelas são geradas mês a mês a partir do 1º vencimento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <ContactPicker value={partnerId || null} onValueChange={(id) => setPartnerId(id)} />
          </div>

          <div className="space-y-2">
            <Label>Moto (opcional)</Label>
            <SearchableSelect
              options={vehicleOptions}
              value={vehicleId}
              onValueChange={(value) => {
                setVehicleId(value);
                setSelectedVehicle(vehicles.find((item) => item.id === value) ?? null);
              }}
              onSearchChange={setVehicleQuery}
              placeholder={vehiclesLoading ? "Buscando motos..." : "Buscar moto por placa ou modelo"}
              emptyMessage={vehiclesLoading ? "Buscando..." : "Nenhuma moto encontrada"}
              allowClear
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivable-description">Descrição *</Label>
            <Input
              id="receivable-description"
              value={description}
              maxLength={255}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Restante venda Bros 160"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="receivable-total">Valor total *</Label>
              <CurrencyInput id="receivable-total" value={total} onValueChange={setTotal} placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivable-count">Nº de parcelas *</Label>
              <Input
                id="receivable-count"
                type="number"
                min={1}
                max={MAX_INSTALLMENTS}
                inputMode="numeric"
                value={countText}
                onChange={(event) => setCountText(event.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <p className="text-xs text-muted-foreground">{kindLabel}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivable-first-due">1º vencimento *</Label>
              <Input
                id="receivable-first-due"
                type="date"
                value={firstDueDate}
                onChange={(event) => setFirstDueDate(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface/40">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-2 text-xs font-medium text-ink-muted">
              <span>Prévia das parcelas</span>
              {preview.length ? <span>{kindLabel}</span> : null}
            </div>
            {preview.length ? (
              <ul className="max-h-48 divide-y divide-line-soft overflow-y-auto text-sm">
                {preview.map((item) => (
                  <li key={item.number} className="flex items-center justify-between px-4 py-1.5 tabular-nums">
                    <span className="text-ink-muted">
                      {item.number}/{preview.length}
                    </span>
                    <span>{formatShortDate(item.dueDate)}</span>
                    <span className="font-medium text-ink">{formatBRL(item.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">Informe valor, parcelas e 1º vencimento.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!canSave || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
