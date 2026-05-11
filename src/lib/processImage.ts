/** Área de recorte em pixels (coordenadas na imagem natural), compatível com `croppedAreaPixels` do react-easy-crop. */
export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_OUTPUT_WIDTH = 1200;
const JPEG_QUALITY = 0.8;

/** Recorte 4:3 centralizado na imagem natural (quando o usuário não abre o editor). */
export function defaultCropAreaPixels(
  naturalWidth: number,
  naturalHeight: number,
  aspectRatio = 4 / 3
): CropAreaPixels {
  const imgAspect = naturalWidth / naturalHeight;
  let cropW: number;
  let cropH: number;
  if (imgAspect > aspectRatio) {
    cropH = naturalHeight;
    cropW = naturalHeight * aspectRatio;
  } else {
    cropW = naturalWidth;
    cropH = naturalWidth / aspectRatio;
  }
  const x = Math.round((naturalWidth - cropW) / 2);
  const y = Math.round((naturalHeight - cropH) / 2);
  return {
    x,
    y,
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
      img.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Recorta conforme `cropArea`, limita a largura máxima a 1200px e exporta JPEG (qualidade 0,8).
 * Retorna um `File` pronto para upload.
 */
export async function processImage(
  imageFile: File,
  cropArea: CropAreaPixels
): Promise<File> {
  const source = await loadBitmap(imageFile);
  const { x, y, width, height } = cropArea;

  let outW = Math.max(1, Math.round(width));
  let outH = Math.max(1, Math.round(height));
  if (outW > MAX_OUTPUT_WIDTH) {
    const scale = MAX_OUTPUT_WIDTH / outW;
    outW = MAX_OUTPUT_WIDTH;
    outH = Math.max(1, Math.round(outH * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in source && typeof source.close === "function") source.close();
    throw new Error("Canvas 2D indisponível");
  }

  ctx.drawImage(
    source as CanvasImageSource,
    Math.round(x),
    Math.round(y),
    Math.round(width),
    Math.round(height),
    0,
    0,
    outW,
    outH
  );

  if ("close" in source && typeof source.close === "function") {
    source.close();
  } else if (source instanceof HTMLImageElement && source.src.startsWith("blob:")) {
    URL.revokeObjectURL(source.src);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar JPEG"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });

  const base =
    imageFile.name.replace(/\.[^.]+$/i, "").replace(/[^\w.-]+/g, "_") || "foto";
  return new File([blob], `${base}-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export async function readImageNaturalSize(file: File): Promise<{ width: number; height: number }> {
  const source = await loadBitmap(file);
  const width = "width" in source ? source.width : (source as HTMLImageElement).naturalWidth;
  const height = "height" in source ? source.height : (source as HTMLImageElement).naturalHeight;
  if ("close" in source && typeof source.close === "function") {
    source.close();
  } else if (source instanceof HTMLImageElement && source.src.startsWith("blob:")) {
    URL.revokeObjectURL(source.src);
  }
  return { width, height };
}
