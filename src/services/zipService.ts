import JSZip from 'jszip';
import type { ProcessedImageItem } from '../types/media';

export async function createBatchZip(
  items: ProcessedImageItem[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  // Filter only completed items with a result blob
  const completedItems = items.filter((item) => item.status === 'done' && item.resultBlob);

  if (completedItems.length === 0) {
    throw new Error('Aucun fichier compressé prêt à être téléchargé.');
  }

  // Track filenames to avoid duplicates
  const nameCounts: Record<string, number> = {};

  for (const item of completedItems) {
    const ext = item.resultFormat || 'webp';
    let base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    base = `${base}_optimized`;

    let finalName = `${base}.${ext}`;
    if (nameCounts[finalName]) {
      nameCounts[finalName]++;
      finalName = `${base}_${nameCounts[finalName]}.${ext}`;
    } else {
      nameCounts[finalName] = 1;
    }

    if (item.resultBlob) {
      zip.file(finalName, item.resultBlob);
    }
  }

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
