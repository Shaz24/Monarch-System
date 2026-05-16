import toast, { type Toast } from 'react-hot-toast';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Achievement } from '../lib/rpg';

export const showAchievementToast = (achievement: Achievement) => {
  toast.custom(
    (t: Toast) => (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-void border-2 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] pointer-events-auto flex items-center p-4 gap-4`}
      >
        <div className="w-12 h-12 shrink-0 bg-black border border-[#FFD700]/50 flex items-center justify-center text-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[#FFD700] opacity-20 animate-pulse" />
          <span className="relative z-10">{achievement.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-space-mono text-xs text-[#FFD700] uppercase tracking-widest mb-1 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Achievement Unlocked
          </p>
          <p className="font-orbitron font-bold text-white truncate">
            {achievement.name}
          </p>
          <p className="font-space-mono text-xs text-white/60 truncate mt-1">
            {achievement.description}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end pl-4 border-l border-white/10">
          <span className="font-space-mono text-xs text-white/40 uppercase tracking-widest">Reward</span>
          <span className="font-orbitron font-bold text-[#FFD700] drop-shadow-md">
            +{achievement.xp_reward}
          </span>
        </div>
      </motion.div>
    ),
    { duration: 5000, position: 'top-center' }
  );
};
