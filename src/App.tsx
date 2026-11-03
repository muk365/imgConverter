import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import type { TabId } from './components/TabNavigation';
import { ImageCompressorTab } from './components/ImageCompressor/ImageCompressorTab';
import { AudioExtractorTab } from './components/VideoAudioExtractor/AudioExtractorTab';
import { VideoTrimmerTab } from './components/VideoTrimmer/VideoTrimmerTab';
import { VideoOptimizerTab } from './components/VideoOptimizer/VideoOptimizerTab';
import { PrivacyShieldModal } from './components/PrivacyShieldModal';
import { SharedArrayBufferAlert } from './components/SharedArrayBufferAlert';
import { Sparkles, Lock } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('images');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sleek Navigation Bar */}
      <Header onOpenPrivacyModal={() => setPrivacyModalOpen(true)} />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Moteur Multimédia 100% Client-Side • Sans Aucun Serveur</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Compressez, Extrayez & Découpez <br />
            <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Directement dans votre Navigateur
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Propulsé par <strong className="text-indigo-300">WebAssembly</strong> &{' '}
            <strong className="text-indigo-300">FFmpeg.wasm</strong>. Aucune donnée n'est transmise sur un réseau. Traitement ultra-rapide et confidentialité absolue garantie.
          </p>
        </div>

        {/* Diagnostic alert for SharedArrayBuffer / COOP & COEP */}
        <SharedArrayBufferAlert />

        {/* Tab Navigation with fluid motion indicator */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content Panes with Framer Motion transitions */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ImageCompressorTab />
              </motion.div>
            )}

            {activeTab === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AudioExtractorTab />
              </motion.div>
            )}

            {activeTab === 'trim' && (
              <motion.div
                key="trim"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <VideoTrimmerTab />
              </motion.div>
            )}

            {activeTab === 'optimizer' && (
              <motion.div
                key="optimizer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <VideoOptimizerTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-10 mt-16 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                M
              </div>
              <span className="font-semibold text-slate-300">
                MediaForge WASM Studio
              </span>
              <span className="text-slate-600">•</span>
              <span>100% Client-Side Multimedia Engine</span>
            </div>

            {/* Hosting Ready Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                Cloudflare Pages Ready
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                Netlify Ready
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-900/50 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                COOP / COEP Configured
              </span>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>
              Construit avec <strong className="text-slate-400">React 19</strong>, <strong className="text-slate-400">Vite</strong>, <strong className="text-slate-400">Tailwind CSS</strong>, <strong className="text-slate-400">Framer Motion</strong> & <strong className="text-slate-400">Lucide Icons</strong>.
            </p>
            <p className="flex items-center gap-1">
              Traitement WebAssembly zéro serveur garanti pour votre vie privée.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy modal */}
      <PrivacyShieldModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
}

export default App;
