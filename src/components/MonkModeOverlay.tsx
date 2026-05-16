import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lock, XOctagon } from 'lucide-react';
import toast from 'react-hot-toast';

interface MonkModeProps {
  isActive: boolean;
  onClose: (completed: boolean, duration: number) => void;
  targetMinutes: number;
}

const QUOTES = [
  "You have power over your mind - not outside events. Realize this, and you will find strength.",
  "Waste no more time arguing what a good man should be. Be one.",
  "The impediment to action advances action. What stands in the way becomes the way.",
  "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it."
];

export const MonkModeOverlay = ({ isActive, onClose, targetMinutes }: MonkModeProps) => {
  const [timeLeft, setTimeLeft] = useState(targetMinutes * 60);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    if (isActive) {
      setTimeLeft(targetMinutes * 60);
    }
  }, [isActive, targetMinutes]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      // Completed successfully
      try {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
      } catch (e) {}
      onClose(true, targetMinutes);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onClose, targetMinutes]);

  const handleBreach = () => {
    toast.error('Focus breached. Discipline failed.', { icon: '⚠️' });
    onClose(false, Math.floor((targetMinutes * 60 - timeLeft) / 60));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-void"
        >
          {/* Subtle slow scanline specific to monk mode */}
          <div className="absolute inset-0 bg-scanline-pattern opacity-20 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 flex flex-col items-center max-w-2xl px-6 text-center"
          >
            <Lock className="w-16 h-16 text-white/20 mb-8" />
            
            <div className="font-orbitron text-8xl md:text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-accent-blue/30 leading-none mb-12 tracking-tighter" style={{ textShadow: '0 0 50px rgba(0, 212, 255, 0.2)' }}>
              {formatTime(timeLeft)}
            </div>

            <div className="glass-panel p-6 mb-12 border border-white/5 bg-void/50 backdrop-blur-xl">
              <Brain className="w-6 h-6 text-accent-blue mx-auto mb-4 opacity-50" />
              <p className="font-archivo-narrow text-xl text-white/70 italic leading-relaxed">
                "{quote}"
              </p>
              <p className="mt-4 font-space-mono text-xs uppercase tracking-widest text-white/30">
                — Marcus Aurelius
              </p>
            </div>

            <button
              onClick={handleBreach}
              className="group flex items-center gap-2 font-space-mono text-sm uppercase tracking-widest text-white/30 hover:text-[#ff5a00] transition-colors"
            >
              <XOctagon className="w-4 h-4 group-hover:animate-pulse" />
              Breach Focus
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
