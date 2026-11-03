import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  Play,
  Pause,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { MagneticDropzone } from '../MagneticDropzone';
import { LiquidProgress } from '../LiquidProgress';
import type { VideoTrimOptions } from '../../types/media';
import { ffmpegService } from '../../services/ffmpegService';
import { formatBytes, formatDuration } from '../../utils/formatters';
import { downloadBlob } from '../../services/zipService';
import { triggerSuccessConfetti } from '../../utils/confetti';

export const VideoTrimmerTab: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [fastCut, setFastCut] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [trimmedResult, setTrimmedResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    size: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);
    };
  }, [videoUrl, trimmedResult]);

  const handleVideoSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setTrimmedResult(null);
    setErrorMessage(null);
    setProgress(0);
    setStartTime(0);
    setEndTime(10);
    setCurrentTime(0);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration || 10;
    setDuration(dur);
    setEndTime(Math.min(dur, Math.max(1, dur * 0.5)));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Auto loop within trim region during preview
      if (videoRef.current.currentTime >= endTime && isPlaying) {
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const setStartToCurrent = () => {
    if (currentTime < endTime) {
      setStartTime(parseFloat(currentTime.toFixed(2)));
    }
  };

  const setEndToCurrent = () => {
    if (currentTime > startTime) {
      setEndTime(parseFloat(currentTime.toFixed(2)));
    }
  };

  const handleTrim = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(5);
    setErrorMessage(null);
    setStatusMessage('Découpage WebAssembly sans perte...');

    try {
      const buffer = await videoFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const options: VideoTrimOptions = {
        startTime,
        endTime,
        fastCut,
      };

      const result = await ffmpegService.trimVideo(uint8, videoFile.name, options, (pct) => {
        setProgress(Math.max(10, pct));
      });

      const blob = new Blob([result.data as unknown as BlobPart], { type: result.mimeType });
      const url = URL.createObjectURL(blob);

      setTrimmedResult({
        blob,
        url,
        filename: result.filename,
        size: blob.size,
      });

      setProgress(100);
      setStatusMessage('Vidéo découpée avec succès !');
      triggerSuccessConfetti();
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setErrorMessage(e.message || 'Erreur lors du rognage de la vidéo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample generator
  const handleLoadSampleVideo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm',
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    let frame = 0;
    const animInterval = setInterval(() => {
      frame++;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 360);

      // Rotating glowing polygon
      ctx.save();
      ctx.translate(320, 180);
      ctx.rotate(frame * 0.04);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(-60, -60, 120, 120);
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`Test de Découpe Vidéo — Frame ${frame}`, 130, 80);
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Timer : ${(frame / 30).toFixed(1)}s`, 130, 110);
    }, 1000 / 30);

    mediaRecorder.onstop = () => {
      clearInterval(animInterval);
      const videoBlob = new Blob(chunks, { type: 'video/mp4' });
      const sampleFile = new File([videoBlob], 'demo_video_trim.mp4', { type: 'video/mp4' });
      handleVideoSelected([sampleFile]);
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
    }, 6000); // 6s video
  };

  const selectedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="space-y-6">
      {!videoFile ? (
        <MagneticDropzone
          onFilesSelected={handleVideoSelected}
          accept="video/*"
          multiple={false}
          title="Glissez-déposez un MP4 pour le rogner avec précision"
          subtitle="Découpage instantané sans perte (Stream Copy) ou à l'image près via FFmpeg.wasm"
          icon={<Scissors className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />}
          onLoadSample={handleLoadSampleVideo}
          sampleLabel="Charger un clip vidéo de test (6s)"
        />
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-xl shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Rognage Vidéo WebAssembly
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    {fastCut ? 'Mode Ultra-Rapide (Sans Perte)' : 'Mode Précis'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-md">{videoFile.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVideoFile(null);
                setVideoUrl(null);
                setTrimmedResult(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Changer de vidéo
            </button>
          </div>

          {/* Video Player Display */}
          <div className="relative rounded-2xl overflow-hidden bg-black max-w-3xl mx-auto aspect-video border border-slate-800 shadow-2xl flex items-center justify-center">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
                onClick={togglePlay}
              />
            )}

            {/* Floating Play Overlay Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute p-4 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-2xl"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            {/* Current Time Display Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-mono text-white border border-white/10">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>

          {/* Interactive Timeline Bar */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Début : {formatDuration(startTime)}</span>
              <span className="text-cyan-400 font-bold">
                Durée sélectionnée : {formatDuration(selectedDuration)}
              </span>
              <span>Fin : {formatDuration(endTime)}</span>
            </div>

            {/* Range Track with Visual In/Out handles */}
            <div className="relative h-10 bg-slate-950 rounded-xl border border-slate-800 flex items-center px-2 select-none overflow-hidden">
              {/* Active Selection Region Highlight */}
              {duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 border-x-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  style={{
                    left: `${(startTime / duration) * 100}%`,
                    width: `${((endTime - startTime) / duration) * 100}%`,
                  }}
                />
              )}

              {/* Current Playhead cursor */}
              {duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-pink-400 z-10 shadow-[0_0_8px_rgba(244,114,182,1)]"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              )}

              {/* Range sliders */}
              <input
                type="range"
                min={0}
                max={Math.max(0.1, duration)}
                step={0.05}
                value={startTime}
                disabled={isProcessing}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val < endTime) {
                    setStartTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-20 pointer-events-auto"
                title="Début"
              />
            </div>

            {/* Precise Time Buttons & Manual Inputs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={setStartToCurrent}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  📍 Début à la position actuelle
                </button>
                <button
                  type="button"
                  onClick={setEndToCurrent}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  🏁 Fin à la position actuelle
                </button>
              </div>

              {/* Fast cut toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={fastCut}
                  onChange={(e) => setFastCut(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Découpage instantané sans ré-encodage (Stream Copy)
                </span>
              </label>
            </div>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 max-w-3xl mx-auto">
              <LiquidProgress progress={progress} label={statusMessage} size="md" />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800/60 flex items-center gap-3 text-red-200 text-xs max-w-3xl mx-auto">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Trim Action Button */}
          {!trimmedResult && (
            <div className="max-w-3xl mx-auto">
              <button
                type="button"
                onClick={handleTrim}
                disabled={isProcessing || selectedDuration <= 0}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-600 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Découpage en cours...'
                    : `Rogner la vidéo (${formatDuration(selectedDuration)})`}
                </span>
              </button>
            </div>
          )}

          {/* Result Section */}
          {trimmedResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-4 max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold">Vidéo rognée avec succès !</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {formatBytes(trimmedResult.size)}
                </span>
              </div>

              {/* Trimmed Video Player */}
              <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 max-h-64">
                <video src={trimmedResult.url} controls className="w-full h-full object-contain" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400">{trimmedResult.filename}</p>
                <button
                  type="button"
                  onClick={() => downloadBlob(trimmedResult.blob, trimmedResult.filename)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le MP4 rogné</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
