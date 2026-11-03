import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Archive,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ProcessedImageItem } from '../../types/media';
import { formatBytes } from '../../utils/formatters';
import { downloadBlob, createBatchZip } from '../../services/zipService';
import { LiquidProgress } from '../LiquidProgress';
import { triggerSuccessConfetti } from '../../utils/confetti';

interface ImageFileListProps {
  items: ProcessedImageItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onCompare: (item: ProcessedImageItem) => void;
  onRecompressAll: () => void;
  isProcessing: boolean;
}

export const ImageFileList: React.FC<ImageFileListProps> = ({
  items,
  onRemoveItem,
  onClearAll,
  onCompare,
  onRecompressAll,
  isProcessing,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  if (items.length === 0) return null;

  const completedItems = items.filter((i) => i.status === 'done' && i.resultBlob);
  const totalOriginalBytes = items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalOptimizedBytes = completedItems.reduce((acc, i) => acc + (i.resultSize || 0), 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalOptimizedBytes);
  const overallReduction = totalOriginalBytes > 0
    ? Math.round(((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100)
    : 0;

  const handleDownloadSingle = (item: ProcessedImageItem) => {
    if (!item.resultBlob) return;
    const ext = item.resultFormat || 'webp';
    const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    downloadBlob(item.resultBlob, `${base}_optimized.${ext}`);
  };

  const handleDownloadAllZip = async () => {
    if (completedItems.length === 0) return;
    try {
      setIsZipping(true);
      setZipProgress(10);
      const zipBlob = await createBatchZip(completedItems, (pct) => setZipProgress(pct));
      downloadBlob(zipBlob, `images_optimisees_${Date.now()}.zip`);
      triggerSuccessConfetti();
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Batch Summary Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/80 border border-indigo-500/30 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-4 text-center md:text-left w-full md:w-auto justify-center md:justify-start">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2 justify-center md:justify-start">
              {items.length} {items.length > 1 ? 'images sélectionnées' : 'image sélectionnée'}
              {completedItems.length === items.length && !isProcessing && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Prêt ({overallReduction}% de gain)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>Original : {formatBytes(totalOriginalBytes)}</span>
              {completedItems.length > 0 && (
                <>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-emerald-400 font-semibold">
                    Optimisé : {formatBytes(totalOptimizedBytes)}
                  </span>
                  <span className="text-emerald-300 font-bold hidden sm:inline">
                    (-{formatBytes(totalSavedBytes)})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={onRecompressAll}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Relancer avec les nouveaux paramètres"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Recalculer</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-800/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Effacer toute la liste"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>

          {completedItems.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              <span>{isZipping ? `Création du ZIP (${zipProgress}%)` : `Télécharger tout (${completedItems.length}) en .ZIP`}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Zipping Progress Bar */}
      {isZipping && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40">
          <LiquidProgress progress={zipProgress} label="Archivage ZIP haute compression..." />
        </div>
      )}

      {/* Image Items List */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {items.map((item) => {
            const isDone = item.status === 'done' && item.resultBlob;
            const isError = item.status === 'error';
            const isItemProcessing = item.status === 'processing';
            const reduction = item.reductionPercentage ?? 0;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all shadow-md gap-3"
              >
                {/* Thumbnail & Name */}
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {isDone && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500 text-slate-950 shadow">
                        <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">
                      {item.name}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatBytes(item.originalSize)}</span>
                      <span>•</span>
                      <span>
                        {item.originalWidth} × {item.originalHeight}px
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress / Result info */}
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 justify-end">
                  {isItemProcessing && (
                    <div className="w-full sm:w-48">
                      <LiquidProgress progress={item.progress} size="sm" showPercentage />
                    </div>
                  )}

                  {isDone && (
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {formatBytes(item.resultSize || 0)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            -{reduction}%
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {item.resultWidth} × {item.resultHeight}px • {item.resultFormat?.toUpperCase()}
                        </span>
                      </div>

                      {/* Compare Before/After button */}
                      <button
                        type="button"
                        onClick={() => onCompare(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-all hover:scale-105 active:scale-95"
                        title="Ouvrir le comparateur interactif avant / après"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Comparer</span>
                      </button>

                      {/* Download single button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95"
                        title="Télécharger cette image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-800/40">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{item.errorMessage || 'Échec de compression'}</span>
                    </div>
                  )}

                  {/* Remove Item button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isItemProcessing}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors disabled:opacity-30"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
