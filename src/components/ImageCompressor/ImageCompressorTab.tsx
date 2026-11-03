import { useState, useEffect, useCallback, useRef } from 'react';
import { MagneticDropzone } from '../MagneticDropzone';
import { ImageSettings } from './ImageSettings';
import { ImageFileList } from './ImageFileList';
import { BeforeAfterModal } from './BeforeAfterModal';
import type { ImageConversionOptions, ProcessedImageItem } from '../../types/media';
import { getImageDimensions, processSingleImage } from '../../services/imageProcessor';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { Images } from 'lucide-react';

export const ImageCompressorTab: React.FC = () => {
  const [items, setItems] = useState<ProcessedImageItem[]>([]);
  const [options, setOptions] = useState<ImageConversionOptions>({
    format: 'webp',
    quality: 80,
    resize: {
      mode: 'original',
      scalePercent: 100,
      maxDimension: 1920,
      keepAspectRatio: true,
    },
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<ProcessedImageItem | null>(null);

  // Use a ref to track current options to avoid stale closures in batch loops
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|tiff|svg)$/i.test(f.name));
    if (validImageFiles.length === 0) return;

    const newItems: ProcessedImageItem[] = [];

    for (const file of validImageFiles) {
      try {
        const { width, height, previewUrl } = await getImageDimensions(file);
        newItems.push({
          id: `${file.name}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: width,
          originalHeight: height,
          previewUrl,
          status: 'idle',
          progress: 0,
        });
      } catch (e) {
        console.error('Error loading image metadata', e);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Process all idle items
  const runCompression = useCallback(async (itemsToProcess: ProcessedImageItem[], currentOptions: ImageConversionOptions) => {
    setIsProcessing(true);

    for (const item of itemsToProcess) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', progress: 10 } : i))
      );

      try {
        const result = await processSingleImage(item.file, currentOptions, (progress) => {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
          );
        });

        const resultUrl = URL.createObjectURL(result.blob);

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  progress: 100,
                  resultBlob: result.blob,
                  resultUrl,
                  resultSize: result.size,
                  resultWidth: result.width,
                  resultHeight: result.height,
                  resultFormat: result.format,
                  reductionPercentage: result.reductionPercentage,
                }
              : i
          )
        );
      } catch (err: unknown) {
        const error = err as Error;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  progress: 0,
                  errorMessage: error?.message || 'Erreur lors du traitement',
                }
              : i
          )
        );
      }
    }

    setIsProcessing(false);
    triggerSuccessConfetti();
  }, []);

  // Auto trigger compression when new items are added with status 'idle'
  useEffect(() => {
    const idleItems = items.filter((i) => i.status === 'idle');
    if (idleItems.length > 0 && !isProcessing) {
      runCompression(idleItems, optionsRef.current);
    }
  }, [items, isProcessing, runCompression]);

  const handleRecompressAll = useCallback(() => {
    if (items.length === 0) return;
    const resetItems = items.map((i) => ({ ...i, status: 'idle' as const, progress: 0 }));
    setItems(resetItems);
    runCompression(resetItems, options);
  }, [items, options, runCompression]);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    items.forEach((i) => {
      if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
    });
    setItems([]);
  }, [items]);

  // Generate a high resolution sample image for instant testing
  const handleLoadSample = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw rich colorful background gradient
    const grad = ctx.createLinearGradient(0, 0, 2400, 1600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.3, '#312e81');
    grad.addColorStop(0.6, '#4c1d95');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2400, 1600);

    // Draw glowing circles and artwork
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const x = Math.random() * 2400;
      const y = Math.random() * 1600;
      const r = Math.random() * 180 + 20;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${Math.random() * 360}, 90%, 65%, ${Math.random() * 0.4 + 0.1})`;
      ctx.fill();
    }

    // Add typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('MediaForge WASM Studio', 200, 750);
    ctx.font = '42px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Haute Définition (2400 × 1600px) — Test de Compression WebAssembly', 200, 840);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'photo_paysage_haute_resolution.png', { type: 'image/png' });
        handleFilesAdded([file]);
      }
    }, 'image/png');
  }, [handleFilesAdded]);

  return (
    <div className="space-y-6">
      {/* Magnetic Dropzone */}
      <MagneticDropzone
        onFilesSelected={handleFilesAdded}
        accept="image/*"
        multiple={true}
        title="Glissez-déposez vos images ici pour compression en masse"
        subtitle="Formats acceptés : PNG, JPG, JPEG, WEBP, AVIF, BMP, TIFF (Conversion 100% Client-Side)"
        icon={<Images className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />}
        onLoadSample={handleLoadSample}
        sampleLabel="Tester avec une image HD exemple (2.4K)"
        disabled={isProcessing}
      />

      {/* Settings Panel */}
      <ImageSettings
        options={options}
        onChange={(newOpts) => {
          setOptions(newOpts);
        }}
        disabled={isProcessing}
      />

      {/* Batch Files List */}
      <ImageFileList
        items={items}
        onRemoveItem={handleRemoveItem}
        onClearAll={handleClearAll}
        onCompare={(item) => setSelectedForComparison(item)}
        onRecompressAll={handleRecompressAll}
        isProcessing={isProcessing}
      />

      {/* Interactive Before/After Modal */}
      <BeforeAfterModal
        item={selectedForComparison}
        onClose={() => setSelectedForComparison(null)}
      />
    </div>
  );
};
