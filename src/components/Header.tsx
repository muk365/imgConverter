import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, Zap } from 'lucide-react';
import { ffmpegService } from '../services/ffmpegService';
import type { FFmpegStatus } from '../types/media';

interface HeaderProps {
  onOpenPrivacyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPrivacyModal }) => {
  const [ffmpegStatus, setFfmpegStatus] = useState<FFmpegStatus>(ffmpegService.getStatus());

  useEffect(() => {
    const unsub = ffmpegService.subscribeStatus((st) => setFfmpegStatus(st));
    return unsub;
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20"
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/20" />
            </div>
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                MediaForge
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                WASM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Convertisseur & Optimiseur Multimédia 100% Client-Side
            </p>
          </div>
        </div>

        {/* Status Indicators & Privacy Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* WASM Engine Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">FFmpeg WASM :</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                ffmpegStatus === 'ready'
                  ? 'text-emerald-400'
                  : ffmpegStatus === 'processing'
                  ? 'text-amber-400'
                  : ffmpegStatus === 'loading'
                  ? 'text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ffmpegStatus === 'ready'
                    ? 'bg-emerald-400 animate-pulse'
                    : ffmpegStatus === 'processing'
                    ? 'bg-amber-400 animate-spin'
                    : ffmpegStatus === 'loading'
                    ? 'bg-indigo-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
              {ffmpegStatus === 'ready'
                ? 'Actif'
                : ffmpegStatus === 'processing'
                ? 'Calcul'
                : ffmpegStatus === 'loading'
                ? 'Chargement...'
                : 'En attente'}
            </span>
          </div>

          {/* Privacy Guarantee Pill */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenPrivacyModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>0 Serveur • 100% Local</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
