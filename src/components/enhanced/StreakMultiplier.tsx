// FILE 6: StreakMultiplier.tsx — new small badge component
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getStreakMultiplier } from '../../lib/rpgEnhanced';

interface StreakMultiplierProps {
  streakDays: number;
  baseXP?: number;
}

export function StreakMultiplier({ streakDays, baseXP }: StreakMultiplierProps) {
  const multiplier = getStreakMultiplier(streakDays);
  const isActive = multiplier > 1.0;

  // Glow intensity scales with multiplier
  const glowSize = Math.round((multiplier - 1.0) * 40);
  const color = multiplier >= 2.0
    ? '#b829e3'
    : multiplier >= 1.5
    ? '#7B2FFF'
    : multiplier >= 1.25
    ? '#ff5a00'
    : multiplier >= 1.1
    ? '#00D4FF'
    : 'rgba(255,255,255,0.3)';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center gap-1.5 px-2 py-1"
      style={{
        background: isActive ? `${color}15` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isActive ? `0 0 ${glowSize}px ${color}44` : 'none',
      }}
      title={`${streakDays} day streak · ${multiplier}x multiplier`}
    >
      <Flame
        className="w-3 h-3 flex-shrink-0"
        style={{ color, filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none' }}
      />
      <span className="font-orbitron text-[10px] font-bold" style={{ color }}>
        {multiplier.toFixed(1)}x
      </span>
      {baseXP !== undefined && isActive && (
        <>
          <span className="font-space-mono text-[9px] text-white/20">·</span>
          <span className="font-space-mono text-[9px]" style={{ color }}>
            {Math.round(baseXP * multiplier)} XP
          </span>
        </>
      )}
    </motion.div>
  );
}
