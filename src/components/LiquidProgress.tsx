import React from 'react';
import { motion } from 'framer-motion';

interface LiquidProgressProps {
  progress: number; // 0 to 100
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const LiquidProgress: React.FC<LiquidProgressProps> = ({
  progress,
  label,
  subLabel,
  size = 'md',
  showPercentage = true,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-300 flex items-center gap-1.5">
            {label}
            {subLabel && <span className="text-slate-500 font-normal">({subLabel})</span>}
          </span>
          {showPercentage && (
            <span className="text-indigo-400 font-mono font-semibold tabular-nums">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        className={`relative w-full ${heightClasses[size]} rounded-full bg-slate-900/90 border border-slate-700/60 p-0.5 overflow-hidden shadow-inner backdrop-blur-md`}
      >
        {/* Animated Liquid Bar */}
        <motion.div
          className="h-full rounded-full liquid-progress relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)',
          }}
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

          {/* Liquid ripple highlights */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
        </motion.div>
      </div>
    </div>
  );
};

