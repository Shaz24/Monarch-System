import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatBadgeProps {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number; // positive = up, negative = down, 0 = flat
  color?: string;
  glowColor?: string;
  className?: string;
}

export const StatBadge = ({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  color = '#A78BFA',
  glowColor,
  className = '',
}: StatBadgeProps) => {
  const glow = glowColor ?? color;
  const TrendIcon = trend !== undefined
    ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
    : null;
  const trendColor = trend !== undefined
    ? trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#94A3B8'
    : '#94A3B8';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 30px ${glow}20` }}
      className={`glass-card p-4 flex flex-col gap-2 relative overflow-hidden group ${className}`}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {TrendIcon && (
          <div className="flex items-center gap-1">
            <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
            {trend !== undefined && trend !== 0 && (
              <span className="font-mono text-[9px] font-bold" style={{ color: trendColor }}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="font-display text-2xl font-black text-white block"
        />
        <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">{label}</span>
      </div>
    </motion.div>
  );
};
