import toast, { type Toast } from 'react-hot-toast';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { sounds } from '../lib/sound';

export const showLevelUpToast = (level: number) => {
  // Play sound instantly using Web Audio API
  sounds.playFanfare();

  toast.custom(
    (t: Toast) => (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{
          opacity: t.visible ? 1 : 0,
          y: t.visible ? 0 : -30,
          scale: t.visible ? 1 : 0.9
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        onClick={() => toast.dismiss(t.id)}
        className="max-w-md w-full bg-void/95 border-2 border-[#00D4FF] shadow-[0_0_25px_rgba(0,212,255,0.45)] pointer-events-auto flex items-center p-5 gap-4 relative overflow-hidden backdrop-blur-md cursor-pointer select-none"
        style={{
          background: 'rgba(5, 10, 20, 0.95)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00D4FF] opacity-10 blur-xl rounded-full" />
        
        <div className="w-14 h-14 shrink-0 bg-black/40 border border-[#00D4FF]/50 flex items-center justify-center text-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00D4FF] opacity-25 animate-pulse" />
          <span className="relative z-10">⚡</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-space-mono text-[10px] text-[#00D4FF] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#00D4FF]" />
            SYSTEM LEVEL UP
          </p>
          <p className="font-orbitron font-black text-2xl text-white tracking-wider flex items-baseline gap-2">
            LEVEL <span className="text-[#00D4FF] text-3xl font-extrabold">{level}</span>
          </p>
          <p className="font-space-mono text-[11px] text-white/60 tracking-wider mt-1 flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" style={{ animationDuration: '4s' }} />
            Capabilities Expanded
          </p>
        </div>
        
        <div className="shrink-0 flex flex-col items-center pl-4 border-l border-white/10 select-none">
          <span className="font-orbitron text-2xl font-black text-[#00D4FF]" style={{ textShadow: '0 0 8px rgba(0,212,255,0.6)' }}>
            +100%
          </span>
          <span className="font-space-mono text-[9px] text-white/40 uppercase tracking-widest">Aura Boost</span>
        </div>
      </motion.div>
    ),
    { duration: 2000, position: 'top-center' }
  );
};

export const showBrowserNotification = (level: number) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      new Notification('⚡ LEVEL UP — Monarch System', {
        body: `Capabilities Expanded! You have reached Level ${level}.`,
        icon: '/favicon.ico'
      });
    } catch (e) {
      console.warn('Failsafe to display browser notification:', e);
    }
  }
};
