// FILE 5: SecondBodyProtocol.tsx — new component
import { motion } from 'framer-motion';
import { getSecondBodyStage } from '../../lib/rpgEnhanced';

interface SecondBodyProtocolProps {
  currentLevel: number;
}

const ALL_STAGES = [
  { stage: 1, name: 'Beginner Awakening',    range: 'Lv. 1–20',   color: '#334155', timeframe: '0–3 months' },
  { stage: 2, name: 'Disciplined Trainee',   range: 'Lv. 20–40',  color: '#0EA5E9', timeframe: '3–9 months' },
  { stage: 3, name: 'Noticeably Aesthetic',  range: 'Lv. 40–60',  color: '#00D4FF', timeframe: '1–2 years' },
  { stage: 4, name: 'Elite Anime Build',     range: 'Lv. 60–85',  color: '#7B2FFF', timeframe: '2–4 years' },
  { stage: 5, name: 'Second Body Aura',      range: 'Lv. 85+',    color: '#b829e3', timeframe: '4+ years' },
];

const REQUIREMENTS: Record<number, string[]> = {
  1: ['Log workouts 3× per week', 'Establish morning routine', 'Hit protein goal 5× per week'],
  2: ['Train 5× per week', 'No junk food 20+ days/month', 'Cold showers daily', 'Sleep 7–9 hrs consistently'],
  3: ['Daily training + cardio', 'High protein every day', 'Sub-20% body fat', 'Meditation daily'],
  4: ['Elite discipline score', 'Martial arts practice', 'Perfect daily laws 25+ days', 'Sub-15% body fat'],
  5: ['The Monarch Protocol. You know what it takes.'],
};

export function SecondBodyProtocol({ currentLevel }: SecondBodyProtocolProps) {
  const current = getSecondBodyStage(currentLevel);
  const nextStage = ALL_STAGES.find(s => s.stage === current.stage + 1);

  // Progress within current stage (simplified)
  const stageThresholds = [0, 20, 40, 60, 85, 100];
  const stageMin = stageThresholds[current.stage - 1];
  const stageMax = stageThresholds[current.stage];
  const stageProgress = current.stage >= 5 ? 100 : Math.min(100, ((currentLevel - stageMin) / (stageMax - stageMin)) * 100);

  return (
    <div className="space-y-6">
      {/* Current stage hero card */}
      <div
        className="p-6 relative overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.6)', border: `2px solid ${current.stage >= 4 ? '#7B2FFF' : '#00D4FF'}40` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${ALL_STAGES[current.stage - 1].color}0d, transparent 60%)` }}
        />
        <div className="relative z-10">
          <p className="font-space-mono text-xs text-white/30 uppercase tracking-widest mb-1">Current Stage</p>
          <h3
            className="font-orbitron text-3xl font-black uppercase tracking-widest mb-2"
            style={{ color: ALL_STAGES[current.stage - 1].color, textShadow: `0 0 20px ${ALL_STAGES[current.stage - 1].color}` }}
          >
            Stage {current.stage}: {current.name}
          </h3>
          <p className="font-archivo-narrow text-base text-white/60 mb-1">{current.description}</p>
          <p className="font-space-mono text-xs text-white/30">{current.range} • {current.timeframe}</p>

          {/* Progress to next stage */}
          {nextStage && (
            <div className="mt-4">
              <div className="flex justify-between font-space-mono text-xs text-white/30 mb-1">
                <span>Progress to {nextStage.name}</span>
                <span>{Math.round(stageProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-black/60" style={{ border: `1px solid ${ALL_STAGES[current.stage - 1].color}30` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stageProgress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full"
                  style={{ background: ALL_STAGES[current.stage - 1].color, boxShadow: `0 0 8px ${ALL_STAGES[current.stage - 1].color}` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Requirements for current stage */}
      <div className="p-5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 className="font-orbitron text-sm font-bold uppercase tracking-widest text-white/60 mb-3">Advancement Requirements</h4>
        <div className="space-y-2">
          {(REQUIREMENTS[current.stage] ?? []).map((req, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-space-mono text-[#00D4FF] text-xs mt-0.5">›</span>
              <span className="font-archivo-narrow text-sm text-white/70">{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full vertical roadmap */}
      <div className="p-5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 className="font-orbitron text-sm font-bold uppercase tracking-widest text-white/60 mb-4">Full Roadmap</h4>
        <div className="space-y-3">
          {ALL_STAGES.map((stage, i) => {
            const isCurrent = stage.stage === current.stage;
            const isPast = stage.stage < current.stage;
            return (
              <div key={stage.stage} className="flex items-start gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: isPast ? stage.color : isCurrent ? stage.color : 'rgba(255,255,255,0.1)',
                      boxShadow: isCurrent ? `0 0 12px ${stage.color}` : 'none',
                    }}
                  />
                  {i < ALL_STAGES.length - 1 && (
                    <div className="w-px flex-1 min-h-[24px] mt-1" style={{ background: isPast ? stage.color : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
                <div className={`pb-3 ${isCurrent ? '' : 'opacity-50'}`}>
                  <p className="font-orbitron text-sm font-bold uppercase tracking-wide" style={{ color: isCurrent || isPast ? stage.color : 'rgba(255,255,255,0.3)' }}>
                    {isCurrent && '▶ '}{stage.name}
                  </p>
                  <p className="font-space-mono text-[10px] text-white/30">{stage.range} • {stage.timeframe}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
