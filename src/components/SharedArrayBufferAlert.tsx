import React, { useEffect, useState } from 'react';
import { Info, RefreshCw } from 'lucide-react';

export const SharedArrayBufferAlert: React.FC = () => {
  const [isIsolated, setIsIsolated] = useState<boolean>(true);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIsolated(!!window.crossOriginIsolated);
    }
  }, []);

  if (isIsolated || dismissed) return null;

  return (
    <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-4 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
      <div className="flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="font-semibold text-amber-300">
            Activation du mode d'isolation Cross-Origin (SharedArrayBuffer)
          </p>
          <p className="text-[11px] text-amber-400/80">
            Le Service Worker d'isolation s'enregistre automatiquement. Si FFmpeg met du temps à se charger, actualisez une fois la page.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-2.5 py-1.5 text-amber-400/60 hover:text-amber-200"
        >
          Masquer
        </button>
      </div>
    </div>
  );
};
