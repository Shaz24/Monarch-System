import { memo } from 'react';
import { motion } from 'framer-motion';

interface StatRingProps {
  statName: string;
  level: number;
  xp: number; // For now assuming progress out of 100
}

export const StatRing = memo(({ statName, level, xp }: StatRingProps) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  // xp percent calculation: let's assume flat 100 for visual sake, or level * 100.
  // Using (xp / (level * 100))
  const maxXp = level * 100;
  const percent = Math.min(xp / maxXp, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="glass-2 p-5 rounded-2xl flex flex-col items-center justify-center relative border border-white/[0.08] shadow-md hover:scale-105 transition-all duration-300 group">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/10"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            className="text-cyan-400 group-hover:text-purple-400 transition-colors duration-500"
            style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-[9px] font-bold text-white/50 tracking-wider">LVL</span>
          <span className="font-display text-2xl font-black text-white glow-text tabular-nums">{level}</span>
        </div>
      </div>
      <p className="mt-3 font-mono text-xs tracking-widest uppercase text-white/80 group-hover:text-white transition-colors font-bold">
        {statName}
      </p>
    </div>
  );
});

StatRing.displayName = 'StatRing';
