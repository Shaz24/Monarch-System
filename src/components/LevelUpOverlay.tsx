import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import { showLevelUpToast, showBrowserNotification } from './LevelUpToast';

export const LevelUpOverlay = () => {
  const { isLevelUp, triggerLevelUp, closeLevelUp } = useUIStore();
  const { profile } = useProfile();
  const lastLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile) {
      const currentLevel = profile.current_level;
      if (lastLevelRef.current !== null && currentLevel > lastLevelRef.current) {
        // Trigger fullscreen overlay
        triggerLevelUp();
        
        // Pop visual custom toast notification
        showLevelUpToast(currentLevel);

        // Pop native OS browser notification
        showBrowserNotification(currentLevel);
      }
      lastLevelRef.current = currentLevel;
    }
  }, [profile, triggerLevelUp]);

  useEffect(() => {
    if (isLevelUp) {
      const timer = setTimeout(closeLevelUp, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLevelUp, closeLevelUp]);

  return (
    <AnimatePresence>
      {isLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-md"
        >
          {/* Background scanlines */}
          <div className="absolute inset-0 bg-scanline-pattern opacity-50 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-10 border-4 border-dashed border-accent-blue rounded-full opacity-20"
            />
            
            <Zap className="w-24 h-24 mx-auto text-accent-blue mb-6 drop-shadow-md shadow-neon-blue" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.8))' }} />
            
            <h1 className="text-6xl md:text-8xl font-orbitron font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-accent-blue mb-2" style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>
              Level Up
            </h1>
            
            <p className="font-space-mono text-xl text-accent-blue tracking-[0.3em] uppercase mt-4">
              System Capabilities Expanded
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
