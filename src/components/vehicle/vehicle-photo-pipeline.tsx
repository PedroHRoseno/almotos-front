"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { type Area } from "react-easy-crop";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ImageIcon,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  defaultCropAreaPixels,
  processImage,
  readImageNaturalSize,
} from "@/lib/processImage";
import { uploadVehicleImageWithProgress } from "@/lib/api";
import { toast } from "sonner";

const ASPECT = 4 / 3;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

type PendingItem = {
  id: string;
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Usuário confirmou o recorte no modal; o arquivo já está enquadrado em 4:3. */
  isEdited: boolean;
  uploadProgress: number;
  uploadStatus: "idle" | "uploading" | "error";
  errorMessage?: string;
};

export type VehiclePhotoPipelineProps = {
  committedImageUrls: string[];
  onCommittedImageUrlsChange: (urls: string[]) => void;
  onBlockingChange?: (blocking: boolean) => void;
  disabled?: boolean;
  className?: string;
};

function revokePreview(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function VehiclePhotoPipeline({
  committedImageUrls,
  onCommittedImageUrlsChange,
  onBlockingChange,
  disabled,
  className,
}: VehiclePhotoPipelineProps) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropping, setCropping] = useState(false);
  const croppedPixelsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  const cropTarget = useMemo(
    () => (cropTargetId ? pending.find((p) => p.id === cropTargetId) : undefined),
    [cropTargetId, pending]
  );

  const blocking = batchUploading;
  useEffect(() => {
    onBlockingChange?.(blocking);
  }, [blocking, onBlockingChange]);

  const inflightRef = useRef(0);
  const dragIndexRef = useRef<number | null>(null);
  const committedRef = useRef(committedImageUrls);
  committedRef.current = committedImageUrls;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const startInflight = () => {
    inflightRef.current += 1;
    setBatchUploading(true);
  };
  const endInflight = () => {
    inflightRef.current = Math.max(0, inflightRef.current - 1);
    if (inflightRef.current === 0) setBatchUploading(false);
  };

  const uploadItem = useCallback(
    async (item: PendingItem) => {
      startInflight();
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, uploadStatus: "uploading", uploadProgress: 0, errorMessage: undefined }
            : p
        )
      );
      try {
        let fileToSend: File;
        if (item.isEdited) {
          const dim = await readImageNaturalSize(item.file);
          fileToSend = await processImage(item.file, {
            x: 0,
            y: 0,
            width: dim.width,
            height: dim.height,
          });
        } else {
          fileToSend = await processImage(
            item.file,
            defaultCropAreaPixels(item.naturalWidth, item.naturalHeight, ASPECT)
          );
        }
        const { url } = await uploadVehicleImageWithProgress(fileToSend, (pct) => {
          setPending((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, uploadProgress: pct } : p))
          );
        });
        const trimmed = url.trim();
        if (!trimmed) throw new Error("URL vazia no retorno do servidor.");
        const current = committedRef.current;
        if (!current.includes(trimmed)) {
          const nextUrls = [...current, trimmed];
          committedRef.current = nextUrls;
          onCommittedImageUrlsChange(nextUrls);
        }
        setPending((prev) => {
          const cur = prev.find((p) => p.id === item.id);
          if (cur) revokePreview(cur.previewUrl);
          return prev.filter((p) => p.id !== item.id);
        });
        toast.success("Foto enviada.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro no upload";
        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, uploadStatus: "error", uploadProgress: 0, errorMessage: msg }
              : p
          )
        );
        toast.error(`${item.file.name}: ${msg}`);
      } finally {
        endInflight();
      }
    },
    [onCommittedImageUrlsChange]
  );
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => revokePreview(p.previewUrl));
    };
  }, []);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (disabled) return;
      const imageFiles = accepted.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        toast.error("Selecione apenas arquivos de imagem.");
        return;
      }
      const next: PendingItem[] = [];
      for (const file of imageFiles) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name}: arquivo acima de 8MB.`);
          continue;
        }
        try {
          const { width, height } = await readImageNaturalSize(file);
          const previewUrl = URL.createObjectURL(file);
          next.push({
            id: crypto.randomUUID(),
            file,
            previewUrl,
            naturalWidth: width,
            naturalHeight: height,
            isEdited: false,
            uploadProgress: 0,
            uploadStatus: "idle",
          });
        } catch {
          toast.error(`Não foi possível ler: ${file.name}`);
        }
      }
      if (next.length === 0) return;
      setPending((prev) => [...prev, ...next]);
      next.forEach((item) => {
        void uploadItem(item);
      });
    },
    [disabled, uploadItem]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    disabled: disabled || batchUploading,
    noClick: disabled || batchUploading,
    noKeyboard: disabled || batchUploading,
  });

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) revokePreview(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const movePending = (id: string, dir: -1 | 1) => {
    setPending((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const moveCommitted = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= committedImageUrls.length) return;
    const copy = [...committedImageUrls];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    onCommittedImageUrlsChange(copy);
  };

  const removeCommitted = (url: string) => {
    onCommittedImageUrlsChange(committedImageUrls.filter((u) => u !== url));
    toast.success("Foto removida da lista.");
  };

  const openCropModal = (item: PendingItem) => {
    setCropTargetId(item.id);
    setCropImageSrc(item.previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    croppedPixelsRef.current = null;
    setCropOpen(true);
  };

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedPixelsRef.current = {
      x: areaPixels.x,
      y: areaPixels.y,
      width: areaPixels.width,
      height: areaPixels.height,
    };
  }, []);

  const confirmCrop = async () => {
    if (!cropTarget || !croppedPixelsRef.current) {
      toast.error("Ajuste o enquadramento antes de confirmar.");
      return;
    }
    setCropping(true);
    try {
      const newFile = await processImage(cropTarget.file, croppedPixelsRef.current);
      const dim = await readImageNaturalSize(newFile);
      const nextPreview = URL.createObjectURL(newFile);
      revokePreview(cropTarget.previewUrl);
      const updated: PendingItem = {
        ...cropTarget,
        file: newFile,
        previewUrl: nextPreview,
        naturalWidth: dim.width,
        naturalHeight: dim.height,
        isEdited: true,
        uploadProgress: 0,
        uploadStatus: "idle",
        errorMessage: undefined,
      };
      setPending((prev) => prev.map((p) => (p.id === cropTarget.id ? updated : p)));
      setCropOpen(false);
      setCropTargetId(null);
      setCropImageSrc(null);
      void uploadItem(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5",
          (disabled || batchUploading) && "pointer-events-none opacity-50",
          !disabled && !batchUploading && "hover:border-primary/60 hover:bg-muted/40"
        )}
      >
        <input {...getInputProps()} />
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">Arraste imagens ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">
            Várias fotos • PNG/JPG/WebP • até 8MB • recorte 4:3 e envio automáticos
          </p>
        </div>
      </div>

      {committedImageUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fotos já no veículo</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {committedImageUrls.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                draggable
                onDragStart={() => {
                  dragIndexRef.current = idx;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = dragIndexRef.current;
                  dragIndexRef.current = null;
                  if (from == null || from === idx) return;
                  const copy = [...committedImageUrls];
                  const [moved] = copy.splice(from, 1);
                  copy.splice(idx, 0, moved);
                  onCommittedImageUrlsChange(copy);
                }}
                className="relative cursor-grab overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing"
              >
                {idx === 0 && (
                  <span className="absolute left-1 top-1 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                    Capa
                  </span>
                )}
                <div className="relative aspect-[4/3] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URLs dinâmicas S3/blob */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={idx === 0}
                    onClick={() => moveCommitted(idx, -1)}
                    title="Mover para esquerda"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={idx === committedImageUrls.length - 1}
                    onClick={() => moveCommitted(idx, 1)}
                    title="Mover para direita"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 shadow"
                    onClick={() => removeCommitted(url)}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fila de pendências</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pending.map((item, idx) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-lg border border-border bg-muted"
              >
                <div className="relative aspect-[4/3] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  {item.uploadStatus === "uploading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-xs text-white">
                      <Loader2 className="mb-1 h-6 w-6 animate-spin" />
                      {item.uploadProgress}%
                    </div>
                  )}
                  {item.uploadStatus === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 p-1 text-center text-[10px] text-white">
                      Erro
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap justify-center gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={idx === 0 || batchUploading}
                    onClick={() => movePending(item.id, -1)}
                    title="Subir na fila"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={idx === pending.length - 1 || batchUploading}
                    onClick={() => movePending(item.id, 1)}
                    title="Descer na fila"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={batchUploading}
                    onClick={() => openCropModal(item)}
                    title="Editar enquadramento"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 shadow"
                    disabled={batchUploading}
                    onClick={() => removePending(item.id)}
                    title="Remover da fila"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            O envio começa ao soltar as fotos (recorte 4:3 automático). Use Editar só se o
            upload ainda não começou ou falhou. Arraste as miniaturas para ordenar; a primeira é a capa.
          </p>
        </div>
      )}

      <Dialog open={cropOpen} onOpenChange={(o) => !cropping && setCropOpen(o)}>
        <DialogContent className="max-w-4xl" showClose={!cropping}>
          <DialogHeader>
            <DialogTitle>Editar enquadramento</DialogTitle>
            <DialogDescription>Proporção fixa 4:3. Arraste e use o zoom. Ao confirmar, a foto é enviada.</DialogDescription>
          </DialogHeader>
          {cropImageSrc && (
            <div className="relative h-[420px] w-full overflow-hidden rounded-md bg-black md:h-[480px]">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
          )}
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={cropping} onClick={() => setCropOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={cropping} onClick={confirmCrop}>
              {cropping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando…
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
