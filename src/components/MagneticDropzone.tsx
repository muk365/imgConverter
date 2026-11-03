import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { UploadCloud, FileImage, Sparkles, Plus } from 'lucide-react';

interface MagneticDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onLoadSample?: () => void;
  sampleLabel?: string;
  disabled?: boolean;
}

export const MagneticDropzone: React.FC<MagneticDropzoneProps> = ({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  title = 'Glissez-déposez vos fichiers ici',
  subtitle = 'ou cliquez pour parcourir votre ordinateur (100% sécurisé et local)',
  icon,
  onLoadSample,
  sampleLabel = 'Tester avec un fichier exemple',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  // Smooth springs for magnetic tilt and movement
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-250, 250], [-6, 6]), springConfig);
  const translateX = useSpring(useTransform(mouseX, [-250, 250], [-8, 8]), springConfig);
  const translateY = useSpring(useTransform(mouseY, [-150, 150], [-8, 8]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
  }, [mouseX, mouseY, glowX, glowY]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="relative perspective-1000 w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          x: isHovered ? translateX : 0,
          y: isHovered ? translateY : 0,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: disabled ? 1 : 1.015 }}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
        className={`group relative w-full cursor-pointer rounded-3xl p-8 sm:p-12 transition-all duration-300 border-2 ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-950/40 shadow-[0_0_50px_rgba(99,102,241,0.5)] scale-[1.02]'
            : 'border-slate-800 hover:border-indigo-500/60 bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:shadow-[0_20px_50px_rgba(79,70,229,0.2)]'
        } backdrop-blur-xl overflow-hidden`}
      >
        {/* Dynamic Magnetic Cursor Follower Glow */}
        {isHovered && !disabled && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-60 transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${glowX.get()}px ${glowY.get()}px, rgba(139, 92, 246, 0.18), transparent 70%)`,
            }}
          />
        )}

        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
          {/* Animated Icon Container */}
          <motion.div
            animate={{
              y: isDragOver ? -8 : [0, -4, 0],
              scale: isDragOver ? 1.15 : 1,
            }}
            transition={{
              y: isDragOver ? { duration: 0.2 } : { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              scale: { duration: 0.2 },
            }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300 ${
              isDragOver
                ? 'bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-indigo-500/50'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700/80 text-indigo-400 group-hover:text-white group-hover:from-indigo-600 group-hover:to-purple-600 shadow-slate-900/80'
            }`}
          >
            {icon || <UploadCloud className="w-10 h-10 transition-transform group-hover:scale-110" />}
          </motion.div>

          {/* Heading and subtext */}
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-400 font-normal group-hover:text-slate-300 transition-colors">
              {subtitle}
            </p>
          </div>

          {/* Magnetic Badge Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/70 group-hover:border-indigo-500/40">
              <FileImage className="w-3.5 h-3.5 text-indigo-400" />
              {multiple ? 'Traitement par lot illimité' : 'Traitement unitaire haute fidélité'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side WebAssembly
            </span>
          </div>

          {/* Sample loader button */}
          {onLoadSample && (
            <div className="pt-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {sampleLabel}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
