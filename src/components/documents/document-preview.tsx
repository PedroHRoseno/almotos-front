"use client";

import { pdf, PDFViewer } from "@react-pdf/renderer";
import { Component, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { documentFileName } from "@/lib/documents";
import type { DocumentDraft } from "./types";
import { SalesContractPdf } from "./SalesContractPdf";
import { ReceiptPdf } from "./ReceiptPdf";
import { ConsignmentTermPdf } from "./ConsignmentTermPdf";
import { PromissoryNotePdf } from "./PromissoryNotePdf";
import { PaymentBookletPdf } from "./PaymentBookletPdf";

type PdfNode = NonNullable<Parameters<typeof pdf>[0]>;

function asPdfNode(node: ReactElement): PdfNode {
  return node as PdfNode;
}

function renderPdfElement(draft: DocumentDraft, logoSrc: string | null): ReactElement {
  if (draft.kind === "recibo") return <ReceiptPdf draft={draft} logoSrc={logoSrc} />;
  if (draft.kind === "consignacao") return <ConsignmentTermPdf draft={draft} logoSrc={logoSrc} />;
  if (draft.kind === "promissoria") return <PromissoryNotePdf draft={draft} logoSrc={logoSrc} />;
  if (draft.kind === "carne") return <PaymentBookletPdf draft={draft} logoSrc={logoSrc} />;
  return <SalesContractPdf draft={draft} logoSrc={logoSrc} />;
}

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || "Não foi possível montar o PDF." };
  }

  render() {
    if (this.state.message) {
      return <p className="text-sm text-destructive">{this.state.message}</p>;
    }
    return this.props.children;
  }
}

export function DocumentPreview({ draft }: { draft: DocumentDraft }) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/logo-documento.png")
      .then((response) => {
        if (!response.ok) throw new Error("Logo indisponível");
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          })
      )
      .then((src) => {
        if (!cancelled) setLogoSrc(src);
      })
      .catch(() => {
        if (!cancelled) setLogoSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const element = useMemo(() => renderPdfElement(draft, logoSrc), [draft, logoSrc]);
  const previewKey = useMemo(() => `${logoSrc ? "logo" : "text"}:${JSON.stringify(draft)}`, [draft, logoSrc]);
  const [busy, setBusy] = useState<"download" | "print" | null>(null);
  const fileName = documentFileName(draft.kind, draft.vehicle.licensePlate, draft.dateIso);

  async function renderBlob() {
    return pdf(asPdfNode(element)).toBlob();
  }

  async function download() {
    setBusy("download");
    try {
      const blob = await renderBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível baixar o PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function print() {
    setBusy("print");
    try {
      const blob = await renderBlob();
      const url = URL.createObjectURL(blob);
      const preview = window.open(url);
      if (!preview) {
        toast.error("O navegador bloqueou a impressão. Baixe o PDF e imprima pelo arquivo.");
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      window.setTimeout(() => {
        preview.focus();
        preview.print();
      }, 700);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível imprimir o PDF.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={download} disabled={busy !== null}>
          {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />}
          Baixar PDF
        </Button>
        <Button type="button" variant="outline" onClick={print} disabled={busy !== null}>
          {busy === "print" ? <Loader2 className="animate-spin" /> : <Printer />}
          Imprimir
        </Button>
      </div>
      <PreviewErrorBoundary key={previewKey}>
        <div className="h-[720px] overflow-hidden rounded-xl border border-line bg-white">
          <PDFViewer width="100%" height={720} showToolbar className="h-[720px] w-full border-0">
            {asPdfNode(element)}
          </PDFViewer>
        </div>
      </PreviewErrorBoundary>
    </div>
  );
}
