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
  Upload,
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
  const [committedCrop, setCommittedCrop] = useState<{
    url: string;
    index: number;
    file: File;
    previewUrl: string;
  } | null>(null);
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
  const idlePending = pending.filter((p) => p.uploadStatus !== "uploading");

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
      openCropModal(next[0]);
    },
    [disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    disabled,
    noClick: disabled,
    noKeyboard: disabled,
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
    if (item.uploadStatus === "uploading") return;
    if (committedCrop) revokePreview(committedCrop.previewUrl);
    setCommittedCrop(null);
    setCropTargetId(item.id);
    setCropImageSrc(item.previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    croppedPixelsRef.current = null;
    setCropOpen(true);
  };

  const openNextCropAfter = (exceptId: string) => {
    const next = pendingRef.current.find(
      (p) => p.id !== exceptId && p.uploadStatus === "idle" && !p.isEdited
    );
    if (next) openCropModal(next);
  };

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedPixelsRef.current = {
      x: areaPixels.x,
      y: areaPixels.y,
      width: areaPixels.width,
      height: areaPixels.height,
    };
  }, []);

  const closeCropModal = () => {
    if (committedCrop) revokePreview(committedCrop.previewUrl);
    setCommittedCrop(null);
    setCropOpen(false);
    setCropTargetId(null);
    setCropImageSrc(null);
  };

  const confirmCrop = async () => {
    if (!croppedPixelsRef.current) {
      toast.error("Ajuste o enquadramento antes de confirmar.");
      return;
    }
    setCropping(true);
    try {
      if (committedCrop) {
        const newFile = await processImage(committedCrop.file, croppedPixelsRef.current);
        startInflight();
        try {
          const { url } = await uploadVehicleImageWithProgress(newFile, () => undefined);
          const trimmed = url.trim();
          if (!trimmed) throw new Error("URL vazia no retorno do servidor.");
          const copy = [...committedRef.current];
          copy[committedCrop.index] = trimmed;
          committedRef.current = copy;
          onCommittedImageUrlsChange(copy);
          toast.success("Foto atualizada.");
        } finally {
          endInflight();
        }
        closeCropModal();
        return;
      }
      if (!cropTarget) {
        toast.error("Ajuste o enquadramento antes de confirmar.");
        return;
      }
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
      pendingRef.current = pendingRef.current.map((p) =>
        p.id === cropTarget.id ? updated : p
      );
      closeCropModal();
      openNextCropAfter(updated.id);
      void uploadItem(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setCropping(false);
    }
  };

  const openCommittedCrop = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Não foi possível carregar a foto.");
      const blob = await response.blob();
      const file = new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);
      setCropTargetId(null);
      setCommittedCrop({ url, index, file, previewUrl });
      setCropImageSrc(previewUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      croppedPixelsRef.current = null;
      setCropOpen(true);
    } catch {
      toast.error("Não foi possível editar esta foto. Remova e envie de novo.");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-50",
          !disabled && "hover:border-primary/60 hover:bg-muted/40"
        )}
      >
        <input {...getInputProps()} />
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">Arraste imagens ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">
            Várias fotos • PNG/JPG/WebP • até 8MB • recorte 4:3 antes de enviar
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
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    onClick={() => void openCommittedCrop(url, idx)}
                    title="Editar enquadramento"
                  >
                    <Pencil className="h-4 w-4" />
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Fila de pendências</p>
            {idlePending.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => idlePending.forEach((item) => void uploadItem(item))}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Enviar {idlePending.length === 1 ? "foto" : "todas"}
              </Button>
            )}
          </div>
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
                    disabled={idx === 0 || item.uploadStatus === "uploading"}
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
                    disabled={idx === pending.length - 1 || item.uploadStatus === "uploading"}
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
                    disabled={item.uploadStatus === "uploading"}
                    onClick={() => openCropModal(item)}
                    title="Editar enquadramento"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 shadow"
                    disabled={item.uploadStatus === "uploading"}
                    onClick={() => void uploadItem(item)}
                    title="Enviar com recorte atual"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 shadow"
                    disabled={item.uploadStatus === "uploading"}
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
            Ajuste o enquadramento 4:3 no editor (abre ao selecionar). Confirmar envia a foto.
            Cancele para revisar na fila e enviar depois. A primeira foto já no veículo é a capa.
          </p>
        </div>
      )}

      <Dialog open={cropOpen} onOpenChange={(o) => !cropping && (o ? setCropOpen(true) : closeCropModal())}>
        <DialogContent className="max-w-4xl" showClose={!cropping}>
          <DialogHeader>
            <DialogTitle>Editar enquadramento</DialogTitle>
            <DialogDescription>
              Proporção fixa 4:3. Arraste e use o zoom. Confirmar aplica o recorte e envia a foto.
            </DialogDescription>
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
            <Button type="button" variant="outline" disabled={cropping} onClick={closeCropModal}>
              Cancelar
            </Button>
            <Button type="button" disabled={cropping} onClick={() => void confirmCrop()}>
              {cropping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando…
                </>
              ) : (
                "Confirmar e enviar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
