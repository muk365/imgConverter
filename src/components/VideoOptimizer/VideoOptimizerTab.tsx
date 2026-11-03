import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { MagneticDropzone } from '../MagneticDropzone';
import { LiquidProgress } from '../LiquidProgress';
import type { VideoOptimizationOptions } from '../../types/media';
import { ffmpegService } from '../../services/ffmpegService';
import { formatBytes } from '../../utils/formatters';
import { downloadBlob } from '../../services/zipService';
import { triggerSuccessConfetti } from '../../utils/confetti';

export const VideoOptimizerTab: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [options, setOptions] = useState<VideoOptimizationOptions>({
    targetFormat: 'gif',
    qualityCrf: 28,
    fps: 15,
    scaleWidth: 480,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    size: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [videoUrl, result]);

  const handleVideoSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);
    setStatusMessage('Conversion WebAssembly en cours...');

    try {
      const buffer = await videoFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const convResult = await ffmpegService.optimizeVideoOrGif(uint8, videoFile.name, options, (pct) => {
        setProgress(Math.max(15, pct));
      });

      const blob = new Blob([convResult.data as unknown as BlobPart], { type: convResult.mimeType });
      const url = URL.createObjectURL(blob);

      setResult({
        blob,
        url,
        filename: convResult.filename,
        size: blob.size,
      });

      setProgress(100);
      setStatusMessage('Conversion terminée avec succès !');
      triggerSuccessConfetti();
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setErrorMessage(e.message || 'Erreur lors de la conversion de la vidéo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!videoFile ? (
        <MagneticDropzone
          onFilesSelected={handleVideoSelected}
          accept="video/*"
          multiple={false}
          title="Glissez-déposez une vidéo pour la convertir en GIF ou la compresser"
          subtitle="Génération de GIF animés haute qualité ou compression MP4 ultra-légère"
          icon={<Sparkles className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 backdrop-blur-xl shadow-xl overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400" />
                  Vidéo Source
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setResult(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Changer
                </button>
              </div>

              {videoUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800">
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              <div className="space-y-1 text-xs">
                <p className="font-semibold text-white truncate">{videoFile.name}</p>
                <p className="text-slate-400">{formatBytes(videoFile.size)}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Conversion */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Paramètres de sortie</h3>
                  <p className="text-xs text-slate-400">GIF Animé fluide ou vidéo optimisée</p>
                </div>
              </div>

              {/* Target Format selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Format désiré
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gif' as const, label: 'GIF Animé', desc: 'Palette optimisée 2-passes' },
                    { id: 'mp4' as const, label: 'MP4 Optimisé', desc: 'H.264 compressé' },
                    { id: 'webm' as const, label: 'WebM Web', desc: 'VP8 / VP9 ultra léger' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setOptions({ ...options, targetFormat: fmt.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        options.targetFormat === fmt.id
                          ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/30 shadow-lg'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-xs font-bold text-white uppercase">{fmt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* GIF Specific Options */}
              {options.targetFormat === 'gif' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Fluidité (FPS)</label>
                      <select
                        value={options.fps}
                        onChange={(e) => setOptions({ ...options, fps: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value={10}>10 FPS (Très léger)</option>
                        <option value={15}>15 FPS (Équilibré standard)</option>
                        <option value={24}>24 FPS (Cinématique fluide)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Largeur max (px)</label>
                      <select
                        value={options.scaleWidth || 480}
                        onChange={(e) => setOptions({ ...options, scaleWidth: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value={320}>320 px (Miniaturisé)</option>
                        <option value={480}>480 px (Standard)</option>
                        <option value={640}>640 px (Grand)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Compression Options */}
              {options.targetFormat !== 'gif' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Niveau de compression (CRF)</span>
                    <span className="text-amber-400 font-mono">CRF {options.qualityCrf}</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={36}
                    step={1}
                    value={options.qualityCrf}
                    onChange={(e) => setOptions({ ...options, qualityCrf: parseInt(e.target.value, 10) })}
                    className="w-full h-2 rounded-lg bg-slate-800 accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>18 (Qualité quasi sans perte)</span>
                    <span>28 (Équilibré)</span>
                    <span>36 (Poids plume)</span>
                  </div>
                </div>
              )}

              {/* Liquid Progress Bar */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                  <LiquidProgress progress={progress} label={statusMessage} size="md" />
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800/60 flex items-center gap-3 text-red-200 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Button */}
              {!result && (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 hover:from-amber-600 hover:via-orange-700 hover:to-pink-700 text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Génération en cours...' : `Générer le ${options.targetFormat.toUpperCase()}`}
                  </span>
                </button>
              )}

              {/* Result Preview */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold">Fichier généré avec succès !</span>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {formatBytes(result.size)}
                    </span>
                  </div>

                  {options.targetFormat === 'gif' ? (
                    <div className="rounded-xl overflow-hidden bg-black max-h-64 flex items-center justify-center border border-slate-800">
                      <img src={result.url} alt="GIF généré" className="max-h-64 object-contain" />
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 max-h-64">
                      <video src={result.url} controls className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-400 truncate max-w-xs">{result.filename}</p>
                    <button
                      type="button"
                      onClick={() => downloadBlob(result.blob, result.filename)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
