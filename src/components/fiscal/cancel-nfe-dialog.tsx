"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { hoursLeft, refreshFiscalStatus } from "@/lib/fiscal";
import type { FiscalDocument } from "@/types";

/** Cancelar na SEFAZ: justificativa (15+) e o número da nota digitado. */
export function CancelNfeDialog({
  doc,
  open,
  onOpenChange,
  onDone,
}: {
  doc: FiscalDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (doc: FiscalDocument) => void;
}) {
  const [justification, setJustification] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [saving, setSaving] = useState(false);
  if (!doc) return null;
  const left = hoursLeft(doc.cancelUntil);
  const texto = justification.trim();
  const numeroOk = confirmNumber.trim().replace(/^0+/, "") === (doc.number ?? "").replace(/^0+/, "");
  const ok = texto.length >= 15 && texto.length <= 255 && numeroOk;

  async function confirmar() {
    if (!doc || !ok) return;
    setSaving(true);
    try {
      const updated = await api.fiscal.cancelar(doc.id, {
        justification: texto,
        confirmNumber: confirmNumber.trim(),
      });
      toast.success(`NF-e nº ${doc.number} cancelada na SEFAZ.`);
      void refreshFiscalStatus();
      onDone(updated);
      onOpenChange(false);
      setJustification("");
      setConfirmNumber("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancelar NF-e nº {doc.number}</DialogTitle>
          <DialogDescription>
            O cancelamento vai para a SEFAZ e não pode ser desfeito.
            {left != null && ` Prazo: ${left} h restantes.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nfe-justificativa">Justificativa (vai para a SEFAZ)</Label>
            <textarea
              id="nfe-justificativa"
              rows={3}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Mínimo 15 caracteres. Ex.: venda desfeita a pedido do cliente no mesmo dia."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <p className="text-xs text-ink-muted">{texto.length}/255 caracteres</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nfe-confirmar-numero">Digite o número da nota para confirmar</Label>
            <Input
              id="nfe-confirmar-numero"
              inputMode="numeric"
              value={confirmNumber}
              onChange={(event) => setConfirmNumber(event.target.value)}
              placeholder={doc.number}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={!ok || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar NF-e nº {doc.number}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
