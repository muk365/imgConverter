import React from 'react';
import { motion } from 'framer-motion';
import { Images, Headphones, Scissors, Sparkles } from 'lucide-react';

export type TabId = 'images' | 'audio' | 'trim' | 'optimizer';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'images' as TabId,
      label: 'Images en masse',
      subtitle: 'WebP, AVIF, PNG, JPG',
      icon: Images,
      badge: 'Batch',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'audio' as TabId,
      label: 'Extraction Audio',
      subtitle: 'MP3, WAV, AAC, OGG',
      icon: Headphones,
      badge: 'WASM',
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 'trim' as TabId,
      label: 'Découpeur Vidéo',
      subtitle: 'Rognage MP4 sans perte',
      icon: Scissors,
      badge: 'Stream-Copy',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'optimizer' as TabId,
      label: 'Optimiseur & GIF',
      subtitle: 'Palette 2-passes & WebM',
      icon: Sparkles,
      badge: 'HQ',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 p-1.5 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-3 px-4 sm:px-6 py-3 rounded-2xl text-left transition-all duration-300 select-none ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {/* Active animated sliding background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${tab.color} shadow-lg shadow-indigo-500/25`}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold tracking-tight">
                        {tab.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] hidden sm:block ${
                        isActive ? 'text-white/80' : 'text-slate-500'
                      }`}
                    >
                      {tab.subtitle}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

