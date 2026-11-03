import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Split,
  Columns,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { ProcessedImageItem } from '../../types/media';
import { formatBytes } from '../../utils/formatters';
import { downloadBlob } from '../../services/zipService';

interface BeforeAfterModalProps {
  item: ProcessedImageItem | null;
  onClose: () => void;
}

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({ item, onClose }) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(5, p - 5));
      if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(95, p + 5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateSliderPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPos(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updateSliderPos(e.clientX);
    },
    [isDragging, updateSliderPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) updateSliderPos(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      updateSliderPos(e.touches[0].clientX);
    },
    [isDragging, updateSliderPos]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!item || !item.resultBlob) return null;

  const originalSize = item.originalSize;
  const resultSize = item.resultSize || item.resultBlob.size;
  const savedBytes = Math.max(0, originalSize - resultSize);
  const reduction = item.reductionPercentage ?? Math.round(((originalSize - resultSize) / originalSize) * 100);

  const handleDownload = () => {
    if (item.resultBlob) {
      const ext = item.resultFormat || 'webp';
      const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      downloadBlob(item.resultBlob, `${base}_optimized.${ext}`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Comparateur Avant / Après
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    -{reduction}% de réduction
                  </span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-md">{item.name}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="hidden sm:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'slider'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  Curseur
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sideBySide')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'sideBySide'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Côte à côte
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-medium px-2 text-slate-300">
                  {zoomLevel.toFixed(1)}x
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                  disabled={zoomLevel >= 3}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
                  title="Zoomer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    title="Réinitialiser zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comparison Viewing Area */}
          <div className="relative flex-1 min-h-[350px] sm:min-h-[480px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
            {viewMode === 'slider' ? (
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="relative w-full h-full max-h-[70vh] flex items-center justify-center cursor-ew-resize overflow-hidden"
              >
                {/* Optimized Image (Base layer - right side visible) */}
                <div
                  className="w-full h-full flex items-center justify-center p-4 transition-transform duration-100"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={item.resultUrl || URL.createObjectURL(item.resultBlob)}
                    alt="Optimisé"
                    className="max-w-full max-h-[64vh] object-contain rounded-xl shadow-2xl pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Original Image (Clipped layer - left side visible) */}
                <div
                  className="absolute inset-0 w-full h-full flex items-center justify-center p-4 overflow-hidden pointer-events-none transition-transform duration-100"
                  style={{
                    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                    transform: `scale(${zoomLevel})`,
                  }}
                >
                  <img
                    src={item.previewUrl}
                    alt="Original"
                    className="max-w-full max-h-[64vh] object-contain rounded-xl shadow-2xl pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Vertical Divider Line with handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 pointer-events-none z-20"
                  style={{ left: `${sliderPos}%` }}
                >
                  {/* Glowing neon line */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500 via-pink-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />

                  {/* Circular Draggable Thumb Handle */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-[0_0_20px_rgba(99,102,241,0.8)] flex items-center justify-center text-white cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform">
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-3.5 bg-white/70 rounded-full" />
                      <div className="w-0.5 h-3.5 bg-white/70 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Before / After Floating Badges */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-slate-200 shadow-lg">
                    AVANT (Original)
                  </div>
                </div>
                <div className="absolute top-4 right-4 z-10 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 backdrop-blur-md text-xs font-semibold text-indigo-300 shadow-lg">
                    APRÈS ({item.resultFormat?.toUpperCase() || 'OPTIMISÉ'})
                  </div>
                </div>
              </div>
            ) : (
              /* Side-by-side mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 w-full h-full max-h-[70vh] p-4 gap-4 overflow-auto">
                <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Original
                  </span>
                  <div
                    className="flex-1 flex items-center justify-center transition-transform"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={item.previewUrl}
                      alt="Original"
                      className="max-w-full max-h-[50vh] object-contain rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl p-4 border border-indigo-900/40">
                  <span className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">
                    Optimisé ({item.resultFormat?.toUpperCase()})
                  </span>
                  <div
                    className="flex-1 flex items-center justify-center transition-transform"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={item.resultUrl || URL.createObjectURL(item.resultBlob)}
                      alt="Optimisé"
                      className="max-w-full max-h-[50vh] object-contain rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer stats bar */}
          <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Original Stats */}
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Taille Initiale
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {formatBytes(originalSize)}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({item.originalWidth} × {item.originalHeight}px)
                  </span>
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              {/* Compressed Stats */}
              <div>
                <p className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
                  Taille Optimisée ({item.resultFormat?.toUpperCase()})
                </p>
                <p className="text-sm font-semibold text-white">
                  {formatBytes(resultSize)}
                  {item.resultWidth && item.resultHeight && (
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      ({item.resultWidth} × {item.resultHeight}px)
                    </span>
                  )}
                </p>
              </div>

              {/* Savings Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {formatBytes(savedBytes)} économisés ({reduction}%)
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Déplacez le curseur horizontalement ou utilisez les flèches du clavier.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
