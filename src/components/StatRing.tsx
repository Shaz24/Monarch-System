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
    <div className="glass-panel p-4 flex flex-col items-center justify-center relative shadow-sm hover:shadow-neon-blue transition-shadow duration-300 group">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-border border-white/5"
            style={{ opacity: 0.8 }}
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
            fill="transparent"
            strokeDasharray={circumference}
            className="text-accent-blue group-hover:text-accent-purple transition-colors duration-500"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.8))' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-space-mono text-xl font-bold text-white">LVL</span>
          <span className="font-orbitron text-2xl neon-text-blue">{level}</span>
        </div>
      </div>
      <p className="mt-3 font-space-mono text-sm tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">
        {statName}
      </p>
    </div>
  );
});

StatRing.displayName = 'StatRing';
