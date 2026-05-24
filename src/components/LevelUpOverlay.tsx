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
        // Trigger fullscreen overlay only for major milestones (every 10 levels)
        if (currentLevel % 10 === 0) {
          triggerLevelUp();
        }
        
        // Pop visual custom toast notification
        showLevelUpToast(currentLevel);

        // Pop native OS browser notification
        showBrowserNotification(currentLevel);

        // Play level up audio fanfare
        // Dispatch level up event to trigger XP Rain and Drawer logger
        window.dispatchEvent(new CustomEvent('monarch-level-up-notif', {
          detail: { newLevel: currentLevel }
        }));
      }
      lastLevelRef.current = currentLevel;
    }
  }, [profile, triggerLevelUp]);

  useEffect(() => {
    if (isLevelUp) {
      const timer = setTimeout(closeLevelUp, 2500);
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
          onClick={closeLevelUp}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-md cursor-pointer select-none"
          style={{ willChange: 'opacity' }}
        >
          {/* Background scanlines */}
          <div className="absolute inset-0 bg-scanline-pattern opacity-50 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative text-center"
            style={{ willChange: 'transform' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-10 border-4 border-dashed border-accent-blue rounded-full opacity-20"
              style={{ willChange: 'transform' }}
            />
            
            <Zap className="w-24 h-24 mx-auto text-accent-blue mb-6 drop-shadow-md shadow-neon-blue animate-bounce" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.8))' }} />
            
            <h1 className="text-6xl md:text-8xl font-orbitron font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-accent-blue mb-2" style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>
              Level Up
            </h1>

            <div className="font-orbitron font-black text-4xl md:text-6xl text-white tracking-widest mt-3 flex items-baseline justify-center gap-3">
              <span>LEVEL</span>
              <span className="text-[#00D4FF] drop-shadow-[0_0_15px_rgba(0,212,255,0.6)]">{profile?.current_level || 10}</span>
            </div>
            
            <p className="font-space-mono text-xs md:text-sm text-accent-blue/60 tracking-[0.3em] uppercase mt-6">
              System Capabilities Expanded
            </p>

            <p className="font-space-mono text-[9px] text-white/20 tracking-[0.2em] uppercase mt-12 animate-pulse">
              Click anywhere to dismiss
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
