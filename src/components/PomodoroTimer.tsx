import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';

interface PomodoroTimerProps {
  /** Work duration in minutes */
  workMinutes?: number;
  /** Break duration in minutes */
  breakMinutes?: number;
  /** Called on session complete with total work minutes */
  onComplete?: (workMinutes: number) => void;
  /** Accent color */
  color?: string;
  className?: string;
  /** If true, shows inline compact mode */
  compact?: boolean;
}

type Phase = 'work' | 'break' | 'idle';

export const PomodoroTimer = ({
  workMinutes = 25,
  breakMinutes = 5,
  onComplete,
  color = '#06B6D4',
  className = '',
  compact = false,
}: PomodoroTimerProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const totalWorkRef = useRef(0);

  const totalSeconds = phase === 'break' ? breakMinutes * 60 : workMinutes * 60;
  const percent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Phase complete
          if (phase === 'work') {
            totalWorkRef.current += workMinutes;
            setSessionsCompleted((s) => s + 1);
            setPhase('break');
            return breakMinutes * 60;
          } else {
            setPhase('idle');
            setIsRunning(false);
            onComplete?.(totalWorkRef.current);
            return workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, phase, workMinutes, breakMinutes, onComplete]);

  const start = useCallback(() => {
    if (phase === 'idle') {
      setPhase('work');
      setSecondsLeft(workMinutes * 60);
    }
    setIsRunning(true);
  }, [phase, workMinutes]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(workMinutes * 60);
    totalWorkRef.current = 0;
    setSessionsCompleted(0);
  }, [workMinutes]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono font-bold"
          style={{
            borderColor: `${color}40`,
            background: `${color}10`,
            color,
          }}
        >
          {phase === 'break' ? <Coffee className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {timeStr}
        </div>
        {!isRunning ? (
          <button onClick={start} className="p-1 rounded hover:bg-white/10 transition-colors">
            <Play className="w-3.5 h-3.5" style={{ color }} />
          </button>
        ) : (
          <button onClick={pause} className="p-1 rounded hover:bg-white/10 transition-colors">
            <Pause className="w-3.5 h-3.5" style={{ color }} />
          </button>
        )}
      </div>
    );
  }

  // Ring dimensions
  const ringSize = 180;
  const strokeWidth = 6;
  const r = (ringSize - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Timer ring */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          />
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r}
            fill="none" stroke={color}
            strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s linear',
              filter: `drop-shadow(0 0 8px ${color}66)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="font-mono text-[10px] uppercase tracking-widest mb-1"
              style={{ color: phase === 'break' ? '#F59E0B' : phase === 'work' ? color : 'rgba(255,255,255,0.3)' }}
            >
              {phase === 'idle' ? 'Ready' : phase === 'work' ? 'Focus' : 'Break'}
            </motion.span>
          </AnimatePresence>
          <span className="font-display text-3xl font-black text-white tabular-nums">{timeStr}</span>
          <span className="font-mono text-[9px] text-white/30 mt-1">
            {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        {!isRunning ? (
          <button
            onClick={start}
            className="p-3 rounded-xl border transition-all"
            style={{
              borderColor: `${color}60`,
              background: `${color}20`,
              color,
              boxShadow: `0 0 20px ${color}30`,
            }}
          >
            <Play className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={pause}
            className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400 transition-all"
          >
            <Pause className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
