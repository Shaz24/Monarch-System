// FILE 1: AuraMeter.tsx — new component
import { motion, AnimatePresence } from 'framer-motion';
import { getAuraTier } from '../../lib/rpgEnhanced';

interface AuraMeterProps {
  aura: number;
  prevAura?: number;
}

export function AuraMeter({ aura, prevAura }: AuraMeterProps) {
  const tier = getAuraTier(aura);
  const pct = Math.min(100, (aura / 1000) * 100);
  const change = prevAura !== undefined ? aura - prevAura : 0;
  const isMonarch = tier.name === 'Monarch';

  return (
    <div
      className="relative p-6 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${tier.color}30` }}
    >
      {/* Monarch particle shimmer */}
      {isMonarch && (
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${tier.color}20, transparent 70%)` }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-space-mono text-xs text-white/40 uppercase tracking-widest">Aura Score</p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="font-orbitron text-4xl font-black"
                style={{ color: tier.color, textShadow: `0 0 20px ${tier.color}` }}
              >
                {aura.toLocaleString()}
              </span>
              <AnimatePresence>
                {change !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="font-space-mono text-sm font-bold"
                    style={{ color: change > 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {change > 0 ? `+${change}` : change}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div
            className="px-3 py-1.5 font-orbitron text-xs font-bold uppercase tracking-widest"
            style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}`, color: tier.color }}
          >
            {tier.name}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-black/60 relative overflow-hidden" style={{ border: `1px solid ${tier.color}30` }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${tier.color}66, ${tier.color})`, boxShadow: `0 0 12px ${tier.color}` }}
          />
        </div>

        {/* Tier thresholds */}
        <div className="flex justify-between mt-1.5 font-space-mono text-[9px] text-white/20 uppercase">
          <span>Dormant</span>
          <span>Awakening</span>
          <span>Apprentice</span>
          <span>Hunter</span>
          <span>Elite</span>
          <span>Shadow</span>
          <span>Monarch</span>
        </div>
      </div>
    </div>
  );
}
