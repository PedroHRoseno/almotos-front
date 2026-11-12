"use client";

import { useCallback, useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlateBalanceBadge } from "@/components/plates/plate-balance-badge";
import { api } from "@/lib/api";
import { setPlateBalanceFromLookup, usePlateBalance } from "@/lib/plate-balance-store";
import { cn } from "@/lib/utils";
import type { PlateLookupResponse } from "@/types";

const PLATE_PATTERN = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/;

export function isLookupablePlate(plate: string | null | undefined): boolean {
  return PLATE_PATTERN.test((plate || "").trim().toUpperCase());
}

/** Toast padrão para cada `outcome`. O cadastro nunca trava: falha = preencher à mão. */
export function notifyPlateOutcome(res: PlateLookupResponse) {
  switch (res.outcome) {
    case "FOUND":
      toast.success(
        res.ocr
          ? `Placa ${res.plate} lida pela foto.`
          : res.cached
            ? "Dados da placa (consulta recente, sem nova cobrança)."
            : "Dados da placa preenchidos."
      );
      if (res.balance.status === "LOW") {
        toast.warning("Saldo da Simples API baixo. Programe uma recarga.");
      }
      break;
    case "INSUFFICIENT_BALANCE":
      toast.error(res.message || "O saldo da Simples API acabou. Preencha os dados manualmente.");
      break;
    case "NOT_FOUND":
      toast.warning(res.message || "Nenhum dado encontrado para esta placa (consulta cobrada).");
      break;
    case "INVALID_PLATE":
      toast.error(res.message || "Placa em formato inválido.");
      break;
    case "OCR_LOW_CONFIDENCE":
      toast.warning(res.message || "Li a placa com pouca certeza. Confira e consulte.");
      break;
    case "OCR_NO_PLATE":
      toast.warning(res.message || "Não consegui ler a placa nesta foto.");
      break;
    default:
      toast.warning(res.message || "Consulta de placa indisponível. Preencha manualmente.");
  }
}

export function usePlateLookup() {
  const [loading, setLoading] = useState(false);
  const lookup = useCallback(async (plate: string, forceRefresh = false) => {
    setLoading(true);
    try {
      const res = await api.plates.lookup(plate, { forceRefresh });
      setPlateBalanceFromLookup(res.balance);
      notifyPlateOutcome(res);
      return res;
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? `Consulta de placa falhou: ${error.message}`
          : "Consulta de placa falhou. Preencha manualmente."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { lookup, loading };
}

/** Reduz a foto (lado maior 1600 px, JPEG 0,82) e devolve um data URI: a Simples API aceita até 10 MB. */
export async function imageFileToDataUrl(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Foto → POST /plates/ocr. Mesmo contrato do lookup (resultado + saldo). */
export function usePlateOcr() {
  const [loading, setLoading] = useState(false);
  const read = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const image = await imageFileToDataUrl(file);
      const res = await api.plates.ocr(image);
      setPlateBalanceFromLookup(res.balance);
      notifyPlateOutcome(res);
      return res;
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? `Leitura da placa falhou: ${error.message}`
          : "Leitura da placa falhou. Digite a placa."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { read, loading };
}

type PlateLookupButtonProps = {
  plate: string | null | undefined;
  onResult: (res: PlateLookupResponse) => void;
  className?: string;
};

/** Botão "Buscar pela placa" + saldo ao lado. Usado no form de moto (compra/troca embutem o mesmo form). */
export function PlateLookupButton({ plate, onResult, className }: PlateLookupButtonProps) {
  const { balance } = usePlateBalance();
  const { lookup, loading } = usePlateLookup();
  const empty = balance?.status === "EMPTY";
  const valid = isLookupablePlate(plate);

  const run = async () => {
    if (!plate || !valid) return;
    const res = await lookup(plate);
    if (res) onResult(res);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={!valid || loading || empty}
        title={
          empty
            ? "Saldo da Simples API esgotado: preencha os dados manualmente."
            : !valid
              ? "Digite uma placa completa (ex.: ABC-1B23). Elétrica sem placa: deixe em branco."
              : "Busca marca, modelo, ano, cor e cilindrada pela placa (consulta cobrada)."
        }
      >
        {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-1.5 h-4 w-4" />}
        Buscar pela placa
      </Button>
      <PlateBalanceBadge compact />
    </div>
  );
}
