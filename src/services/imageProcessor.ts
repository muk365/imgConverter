import type { ImageConversionOptions, ImageFormat } from '../types/media';
import { ffmpegService } from './ffmpegService';

export interface ProcessedResult {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  reductionPercentage: number;
  format: ImageFormat;
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        previewUrl,
      });
    };
    img.onerror = () => {
      reject(new Error("Impossible de charger l'image pour déterminer ses dimensions."));
    };
    img.src = previewUrl;
  });
}

export function calculateDimensions(
  origW: number,
  origH: number,
  resize: ImageConversionOptions['resize']
): { width: number; height: number } {
  let targetW = origW;
  let targetH = origH;

  switch (resize.mode) {
    case 'scale': {
      const factor = Math.max(1, Math.min(200, resize.scalePercent)) / 100;
      targetW = Math.round(origW * factor);
      targetH = Math.round(origH * factor);
      break;
    }
    case 'maxDim': {
      const max = resize.maxDimension;
      if (origW > max || origH > max) {
        if (origW >= origH) {
          targetW = max;
          targetH = Math.round((origH * max) / origW);
        } else {
          targetH = max;
          targetW = Math.round((origW * max) / origH);
        }
      }
      break;
    }
    case 'custom': {
      const customW = resize.customWidth || origW;
      const customH = resize.customHeight || origH;
      if (resize.keepAspectRatio) {
        const ratio = origW / origH;
        if (resize.customWidth && !resize.customHeight) {
          targetW = customW;
          targetH = Math.round(customW / ratio);
        } else if (!resize.customWidth && resize.customHeight) {
          targetH = customH;
          targetW = Math.round(customH * ratio);
        } else {
          targetW = customW;
          targetH = Math.round(customW / ratio);
        }
      } else {
        targetW = customW;
        targetH = customH;
      }
      break;
    }
    case 'original':
    default:
      targetW = origW;
      targetH = origH;
      break;
  }

  // Ensure width and height are at least 1px
  return {
    width: Math.max(1, targetW),
    height: Math.max(1, targetH),
  };
}

export async function processSingleImage(
  file: File,
  options: ImageConversionOptions,
  onProgress?: (progress: number) => void
): Promise<ProcessedResult> {
  onProgress?.(15);

  const { width: origW, height: origH } = await getImageDimensions(file);
  const { width: targetW, height: targetH } = calculateDimensions(origW, origH, options.resize);

  onProgress?.(35);

  // Load image to canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('Impossible de créer le contexte Canvas 2D.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    const url = URL.createObjectURL(file);
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Échec du décodage de l'image."));
    };
    el.src = url;
  });

  // If converting to JPEG, draw white background first to avoid black transparency
  if (options.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  onProgress?.(60);

  const qualityRatio = options.quality / 100;
  let targetMime = 'image/webp';
  if (options.format === 'jpeg') targetMime = 'image/jpeg';
  if (options.format === 'png') targetMime = 'image/png';
  if (options.format === 'avif') targetMime = 'image/avif';

  // Canvas toBlob conversion
  let outputBlob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      targetMime,
      options.format === 'png' ? undefined : qualityRatio
    );
  });

  // If user requested AVIF but browser doesn't natively support AVIF canvas export (it falls back to PNG)
  if (options.format === 'avif' && outputBlob && outputBlob.type !== 'image/avif') {
    // Attempt FFmpeg wasm conversion for AVIF or high-efficiency WebP fallback
    try {
      onProgress?.(75);
      await ffmpegService.load();
      const inputBuffer = await file.arrayBuffer();
      const result = await ffmpegService.convertImage(new Uint8Array(inputBuffer), file.name, 'avif', options.quality);
      outputBlob = new Blob([result as unknown as BlobPart], { type: 'image/avif' });
    } catch {
      // If FFmpeg fails, use WebP as high-efficiency alternative
      targetMime = 'image/webp';
      outputBlob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), targetMime, qualityRatio);
      });
    }
  }

  onProgress?.(90);

  if (!outputBlob) {
    throw new Error("La compression de l'image a échoué.");
  }

  const reductionPercentage = file.size > 0
    ? Math.round(((file.size - outputBlob.size) / file.size) * 100)
    : 0;

  onProgress?.(100);

  return {
    blob: outputBlob,
    size: outputBlob.size,
    width: targetW,
    height: targetH,
    reductionPercentage,
    format: options.format,
  };
}
