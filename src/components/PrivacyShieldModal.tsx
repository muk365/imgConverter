import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Cpu, Lock, HardDrive, CheckCircle2 } from 'lucide-react';

interface PrivacyShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Garantie 100% Client-Side</h3>
                <p className="text-xs text-emerald-400 font-medium">Vos fichiers ne quittent jamais votre appareil</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="p-2 w-fit rounded-xl bg-indigo-500/10 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white">Moteur WebAssembly</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Le binaire FFmpeg.wasm s'exécute directement dans le bac à sable (sandbox) de votre navigateur.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="p-2 w-fit rounded-xl bg-pink-500/10 text-pink-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white">Zéro Serveur</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                0 octet de vos photos ou vidéos n'est envoyé sur internet. Même sans connexion web active, le traitement fonctionne.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white">Confidentialité RGPD</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Idéal pour les documents confidentiels, photos privées, contrats et tournages professionnels.
              </p>
            </div>
          </div>

          {/* Technical breakdown list */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <h5 className="font-semibold text-slate-200">Spécifications techniques :</h5>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>SharedArrayBuffer & Cross-Origin-Isolation :</strong> Configuration native COOP (Cross-Origin-Opener-Policy) et COEP (Cross-Origin-Embedder-Policy) pour Netlify et Cloudflare Pages.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Encodage Canvas & FFmpeg Core :</strong> Algorithmes haute précision Lanczos, WebP haute densité et flux sans perte Stream-Copy.
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg"
            >
              Compris, fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

