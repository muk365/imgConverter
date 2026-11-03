import React from 'react';
import type { ImageConversionOptions, ImageFormat } from '../../types/media';
import { Sliders, Maximize2, Zap, Sparkles } from 'lucide-react';

interface ImageSettingsProps {
  options: ImageConversionOptions;
  onChange: (options: ImageConversionOptions) => void;
  disabled?: boolean;
}

export const ImageSettings: React.FC<ImageSettingsProps> = ({ options, onChange, disabled }) => {
  const formats: { id: ImageFormat; label: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'webp',
      label: 'WebP',
      desc: 'Idéal web & SEO, compatible 98%+',
      badge: 'Recommandé',
      color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
    },
    {
      id: 'avif',
      label: 'AVIF',
      desc: 'Nouvelle génération, compression extrême (-90%)',
      badge: 'Ultra Compact',
      color: 'border-pink-500/50 bg-pink-500/10 text-pink-300',
    },
    {
      id: 'jpeg',
      label: 'JPEG',
      desc: 'Compatibilité universelle maximale',
      badge: 'Standard',
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'png',
      label: 'PNG',
      desc: 'Compression sans perte avec transparence',
      badge: 'Sans perte',
      color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    },
  ];

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <span>Paramètres de compression par lot</span>
        </div>
        <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Appliqué instantanément à tous les fichiers
        </div>
      </div>

      {/* Target Format selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Format de sortie</span>
          <span className="text-indigo-400 font-mono normal-case">
            Format actuel : {options.format.toUpperCase()}
          </span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {formats.map((fmt) => {
            const isSelected = options.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...options, format: fmt.id })}
                className={`relative flex flex-col p-3.5 rounded-2xl text-left border transition-all duration-200 ${
                  isSelected
                    ? `${fmt.color} ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.02]`
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base font-bold text-white tracking-wide">{fmt.label}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {fmt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{fmt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Slider */}
      {options.format !== 'png' && (
        <div className="space-y-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Niveau de Qualité
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-slate-400">
                {options.quality > 85 ? 'Excellente fidélité' : options.quality > 65 ? 'Équilibré (Web)' : 'Compression maximale'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-sm">
                {options.quality}%
              </span>
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={options.quality}
              disabled={disabled}
              onChange={(e) => onChange({ ...options, quality: parseInt(e.target.value, 10) })}
              className="w-full h-2 rounded-lg bg-slate-800 accent-indigo-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-slate-500 text-[11px]">Préréglages :</span>
            {[
              { label: '65% (Éco)', val: 65 },
              { label: '80% (Idéal)', val: 80 },
              { label: '92% (Pro)', val: 92 },
              { label: '100% (Max)', val: 100 },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...options, quality: p.val })}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] border transition-all ${
                  options.quality === p.val
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resize Options */}
      <div className="space-y-3 pt-2 border-t border-slate-800/60">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            Redimensionnement & Résolution
          </span>
          <span className="text-slate-400 font-normal text-xs lowercase">
            {options.resize.mode === 'original' && 'Taille 100% conservée'}
            {options.resize.mode === 'scale' && `Échelle réduite à ${options.resize.scalePercent}%`}
            {options.resize.mode === 'maxDim' && `Max dimension ${options.resize.maxDimension}px`}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { mode: 'original' as const, label: 'Originale (100%)' },
            { mode: 'scale' as const, label: '75% Résolution', scalePercent: 75 },
            { mode: 'scale' as const, label: '50% Résolution', scalePercent: 50 },
            { mode: 'maxDim' as const, label: 'Max 1920px (FHD)', maxDimension: 1920 },
          ].map((item, idx) => {
            const isSelected =
              options.resize.mode === item.mode &&
              (!item.scalePercent || options.resize.scalePercent === item.scalePercent) &&
              (!item.maxDimension || options.resize.maxDimension === item.maxDimension);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...options,
                    resize: {
                      ...options.resize,
                      mode: item.mode,
                      scalePercent: item.scalePercent || 100,
                      maxDimension: item.maxDimension || 1920,
                    },
                  })
                }
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/70 shadow-sm'
                    : 'bg-slate-950/40 hover:bg-slate-800/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
