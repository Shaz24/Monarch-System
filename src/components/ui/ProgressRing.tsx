import { motion } from 'framer-motion';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing = ({
  percent,
  size = 120,
  strokeWidth = 8,
  gradientFrom = '#A78BFA',
  gradientTo = '#06B6D4',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  className = '',
  children,
}: ProgressRingProps) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const gradId = `ring-grad-${size}-${gradientFrom.replace('#', '')}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={trackColor} strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${gradientFrom}66)` }}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children ?? (
          <>
            {label && <span className="font-display text-xl font-black text-white">{label}</span>}
            {sublabel && <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
};
