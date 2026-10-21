/**
 * Сжатие фото в браузере перед загрузкой: телефон снимает 5–15 МБ, нам достаточно 0,3–1,5 МБ.
 * Плюсы: быстрее на мобильном интернете, укладываемся в лимит запроса хостинга,
 * EXIF (в т.ч. GPS-координаты из камеры!) не уходит на сервер — canvas его отбрасывает.
 */

export interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  maxBytes: number;
  quality?: number;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      // imageOrientation: фото с iPhone не «лягут на бок»
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* старый Safari — fallback ниже */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Не удалось прочитать изображение"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Не удалось сжать изображение"))), "image/jpeg", quality),
  );
}

export async function compressImage(file: File, opts: CompressOptions): Promise<CompressedImage> {
  const { source, width, height, close } = await decode(file);
  try {
    let scale = Math.min(1, opts.maxWidth / width, opts.maxHeight / height);
    let quality = opts.quality ?? 0.82;
    // Несколько попыток: сначала снижаем качество, затем размер
    for (let attempt = 0; attempt < 6; attempt++) {
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas недоступен");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, w, h);
      const blob = await toBlob(canvas, quality);
      canvas.width = canvas.height = 0; // освобождаем память GPU на iOS
      if (blob.size <= opts.maxBytes) return { blob, width: w, height: h };
      if (quality > 0.6) quality -= 0.1;
      else scale *= 0.8;
    }
    throw new Error("Изображение слишком большое даже после сжатия");
  } finally {
    close();
  }
}

/** Только размеры (для проверки пропорций 2:1 у панорам) — без полной перекодировки. */
export async function readImageSize(file: File): Promise<{ width: number; height: number }> {
  const { width, height, close } = await decode(file);
  close();
  return { width, height };
}
