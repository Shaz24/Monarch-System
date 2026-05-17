// FILE 2: JourneyTimeline.tsx — new component
import { motion } from 'framer-motion';
import { getJourneyStats, getDailyQuote, XP_FOR_85 } from '../../lib/rpgEnhanced';

interface JourneyTimelineProps {
  currentLevel: number;
  currentXP: number;
  avgDailyXP?: number;
}

const MILESTONES = [
  { level: 20, label: 'First Awakening', xp: 19100, color: '#334155' },
  { level: 40, label: 'Grind Working',   xp: 77900, color: '#0EA5E9' },
  { level: 60, label: 'Anime Arc',       xp: 176900, color: '#00D4FF' },
  { level: 85, label: 'Second Body',     xp: 357250, color: '#7B2FFF' },
  { level: 100, label: 'Monarch',        xp: 498900, color: '#ff003c' },
] as const;

export function JourneyTimeline({ currentLevel, currentXP, avgDailyXP = 200 }: JourneyTimelineProps) {
  const { xpRemaining, daysRemaining, percentComplete } = getJourneyStats(currentLevel, currentXP, avgDailyXP);
  const quote = getDailyQuote();

  const yearsRemaining = daysRemaining ? (daysRemaining / 365).toFixed(1) : null;

  return (
    <div className="p-6 space-y-6" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(123,47,255,0.2)' }}>
      {/* Header */}
      <div>
        <p className="font-space-mono text-xs text-[#7B2FFF]/60 tracking-[0.4em] uppercase mb-1">Journey Progress</p>
        <h2 className="font-orbitron text-2xl font-black uppercase tracking-widest text-white">
          Level 85 — <span style={{ color: '#7B2FFF' }}>Second Body</span>
        </h2>
        <p className="font-space-mono text-xs text-white/30 mt-1">
          {currentXP.toLocaleString()} / {XP_FOR_85.toLocaleString()} XP •{' '}
          {percentComplete}% complete
        </p>
      </div>

      {/* Big progress bar */}
      <div>
        <div className="w-full h-4 bg-black/60 relative overflow-hidden" style={{ border: '1px solid rgba(123,47,255,0.3)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #4F46E5, #7B2FFF)', boxShadow: '0 0 16px #7B2FFF' }}
          />
          {/* Milestone markers */}
          {MILESTONES.map(m => {
            const pos = Math.min(100, (m.xp / XP_FOR_85) * 100);
            const passed = currentXP >= m.xp;
            return (
              <div
                key={m.level}
                className="absolute top-0 bottom-0 w-px"
                style={{ left: `${pos}%`, background: passed ? m.color : 'rgba(255,255,255,0.15)' }}
              />
            );
          })}
        </div>

        {/* Milestone labels */}
        <div className="relative h-8 mt-1">
          {MILESTONES.map(m => {
            const pos = Math.min(99, (m.xp / XP_FOR_85) * 100);
            const passed = currentXP >= m.xp;
            return (
              <div
                key={m.level}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${pos}%` }}
              >
                <p className="font-space-mono text-[9px] uppercase whitespace-nowrap" style={{ color: passed ? m.color : 'rgba(255,255,255,0.2)' }}>
                  Lv.{m.level}
                </p>
                <p className="font-space-mono text-[8px] text-white/20 whitespace-nowrap hidden sm:block">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'XP Remaining', value: xpRemaining.toLocaleString(), color: '#7B2FFF' },
          { label: 'Days at Current Pace', value: daysRemaining?.toLocaleString() ?? '∞', color: '#00D4FF' },
          { label: 'Years Remaining', value: yearsRemaining ? `~${yearsRemaining}y` : '∞', color: '#ff5a00' },
        ].map(s => (
          <div key={s.label} className="p-3 text-center" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-orbitron font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="font-space-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily quote */}
      <div className="p-4 border-l-2 border-[#7B2FFF]/50" style={{ background: 'rgba(123,47,255,0.06)' }}>
        <p className="font-archivo-narrow text-sm text-white/70 italic">"{quote}"</p>
      </div>
    </div>
  );
}
