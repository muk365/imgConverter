import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Headphones,
  Film,
  Download,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MagneticDropzone } from '../MagneticDropzone';
import { LiquidProgress } from '../LiquidProgress';
import type { AudioExtractionOptions, AudioFormat, AudioBitrate } from '../../types/media';
import { ffmpegService } from '../../services/ffmpegService';
import { formatBytes, formatDuration } from '../../utils/formatters';
import { downloadBlob } from '../../services/zipService';
import { triggerSuccessConfetti } from '../../utils/confetti';

export const AudioExtractorTab: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const [options, setOptions] = useState<AudioExtractionOptions>({
    format: 'mp3',
    bitrate: '256k',
    sampleRate: 44100,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [audioResult, setAudioResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    size: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioResult?.url) URL.revokeObjectURL(audioResult.url);
    };
  }, [videoUrl, audioResult]);

  const handleVideoSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (audioResult?.url) URL.revokeObjectURL(audioResult.url);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setAudioResult(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoDuration(e.currentTarget.duration || 0);
  };

  const handleExtract = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(5);
    setErrorMessage(null);
    setStatusMessage('Préparation du flux vidéo...');

    try {
      const buffer = await videoFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      setStatusMessage('WebAssembly FFmpeg : Extraction et encodage audio...');
      const result = await ffmpegService.extractAudio(
        uint8,
        videoFile.name,
        options,
        (pct) => {
          setProgress(Math.max(10, pct));
        }
      );

      const blob = new Blob([result.data as unknown as BlobPart], { type: result.mimeType });
      const url = URL.createObjectURL(blob);

      setAudioResult({
        blob,
        url,
        filename: result.filename,
        size: blob.size,
      });

      setProgress(100);
      setStatusMessage('Extraction terminée avec succès !');
      triggerSuccessConfetti();
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setErrorMessage(e.message || "Erreur lors de l'extraction audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Generate synthetic sample video with audio tone
  const handleLoadSampleVideo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 2); // Ramp to A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const canvasStream = canvas.captureStream(30);
    const combinedTracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    const combinedStream = new MediaStream(combinedTracks);

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm',
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    let frame = 0;
    const animInterval = setInterval(() => {
      frame++;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 360);

      // Rainbow wave
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x < 640; x += 10) {
        const y = 180 + Math.sin((x + frame * 6) * 0.05) * 50;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#a855f7';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText('Vidéo Exemple avec Sonore WebAssembly', 100, 100);
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Générée 100% en local dans votre navigateur', 100, 130);
    }, 1000 / 30);

    mediaRecorder.onstop = () => {
      clearInterval(animInterval);
      osc.stop();
      audioCtx.close();
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      const sampleFile = new File([videoBlob], 'clip_demonstration_audio.webm', { type: 'video/webm' });
      handleVideoSelected([sampleFile]);
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
    }, 3500); // 3.5s video clip
  };

  return (
    <div className="space-y-6">
      {!videoFile ? (
        <MagneticDropzone
          onFilesSelected={handleVideoSelected}
          accept="video/*"
          multiple={false}
          title="Glissez-déposez une vidéo pour en extraire l'audio"
          subtitle="Formats : MP4, WEBM, MOV, MKV, AVI, FLV — 0 octet envoyé sur un serveur"
          icon={<Headphones className="w-10 h-10 text-pink-400 group-hover:scale-110 transition-transform" />}
          onLoadSample={handleLoadSampleVideo}
          sampleLabel="Tester avec une vidéo d'exemple avec musique"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Preview & Information */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 backdrop-blur-xl shadow-xl overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-pink-400" />
                  Vidéo Source
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setAudioResult(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Changer de vidéo
                </button>
              </div>

              {videoUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800">
                  <video
                    src={videoUrl}
                    controls
                    onLoadedMetadata={handleLoadedMetadata}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-1 text-xs">
                <p className="font-semibold text-white truncate">{videoFile.name}</p>
                <div className="flex items-center gap-3 text-slate-400">
                  <span>{formatBytes(videoFile.size)}</span>
                  <span>•</span>
                  <span>Durée : {formatDuration(videoDuration, false)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Audio Options & Action */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Options d'extraction sonore</h3>
                  <p className="text-xs text-slate-400">Convertissez la bande sonore sans perte de qualité</p>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Format audio de sortie
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['mp3', 'wav', 'aac', 'ogg', 'flac'] as AudioFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setOptions({ ...options, format: fmt })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all ${
                        options.format === fmt
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 scale-105'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate selection (for lossy formats) */}
              {options.format !== 'wav' && options.format !== 'flac' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <span>Débit binaire (Bitrate)</span>
                    <span className="text-pink-400 font-mono">{options.bitrate}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(['320k', '256k', '192k', '128k', '64k'] as AudioBitrate[]).map((br) => (
                      <button
                        key={br}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setOptions({ ...options, bitrate: br })}
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          options.bitrate === br
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {br}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample rate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Fréquence d'échantillonnage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 44100, label: '44.1 kHz (Qualité CD Audio)' },
                    { val: 48000, label: '48.0 kHz (Qualité Vidéo / Broadcast)' },
                  ].map((sr) => (
                    <button
                      key={sr.val}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setOptions({ ...options, sampleRate: sr.val })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        options.sampleRate === sr.val
                          ? 'bg-pink-500/10 border-pink-500/50 text-pink-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {sr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 space-y-2">
                  <LiquidProgress progress={progress} label={statusMessage} size="md" />
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800/60 flex items-center gap-3 text-red-200 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Trigger Extraction Button */}
              {!audioResult && (
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-pink-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Headphones className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Extraction WebAssembly en cours...' : "Extraire l'audio maintenant"}
                  </span>
                </button>
              )}

              {/* Audio Extraction Result Card */}
              {audioResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold">Piste audio extraite avec succès !</span>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {formatBytes(audioResult.size)}
                    </span>
                  </div>

                  {/* Audio Player */}
                  <audio
                    ref={audioRef}
                    src={audioResult.url}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full hidden"
                  />

                  <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={toggleAudioPlay}
                      className="p-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{audioResult.filename}</p>
                      <p className="text-[11px] text-slate-400">
                        {options.format.toUpperCase()} • {options.bitrate} • {options.sampleRate} Hz
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadBlob(audioResult.blob, audioResult.filename)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
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
