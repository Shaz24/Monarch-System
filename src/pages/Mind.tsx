import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BrainCircuit, Lock, ScrollText, Smartphone, UserMinus, Target, ChevronLeft, ChevronRight, Pencil, Save } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import { MonkModeOverlay } from '../components/MonkModeOverlay';
import { HabitTracker } from '../components/HabitTracker';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';
import { EmptyState } from '../components/ui/EmptyState';

export default function Mind() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const { logs, addLog } = useActivityLogs('mind');
  const { stats } = useProfile();
  
  // Monk Mode State
  const [isMonkMode, setIsMonkMode] = useState(false);
  const [monkTarget, setMonkTarget] = useState(60);
  const [shockwaveActive, setShockwaveActive] = useState(false);

  // Local protocol toggles
  const [silence, setSilence] = useState(false);
  const [isolation, setIsolation] = useState(false);
  const [singleTask, setSingleTask] = useState(false);

  // Form State
  const [type, setType] = useState('Meditation');
  const [duration, setDuration] = useState('20');

  // Helper to get real stats
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };

  const stoicismStat = getStat('stoicism');
  const focusStat = getStat('focus');

  const getLevelRank = (level: number) => {
    if (level < 5) return 'E';
    if (level < 10) return 'D';
    if (level < 15) return 'C';
    if (level < 20) return 'B';
    if (level < 25) return 'A';
    return 'S';
  };

  const processXpGain = async (typeStr: string, durMins: number, isMonk = false) => {
    const base = 2;
    let xpEarned = Math.round(base * durMins);
    if (isMonk) xpEarned = Math.round(xpEarned * 1.5);
    
    let statCategories = [];
    if (typeStr === 'Meditation' || typeStr === 'Journaling') statCategories = ['stoicism'];
    else if (typeStr === 'Deep Work' || typeStr === 'Deep Reading') statCategories = ['focus'];
    else statCategories = ['stoicism', 'focus'];

    await addLog(typeStr + (isMonk ? ' (Monk Mode)' : ''), durMins, xpEarned, { isMonk }, statCategories);
    return xpEarned;
  };

  const handleLogManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(duration) || 0;
    const xp = await processXpGain(type, dur);
    
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xp);
    toast.success('Cognitive data integrated.');
  };

  const handleMonkModeClose = async (completed: boolean, actualDuration: number) => {
    setIsMonkMode(false);
    if (completed) {
      const xp = await processXpGain('Deep Focus', actualDuration, true);
      addXpParticle(window.innerWidth / 2, window.innerHeight / 2, xp);
      toast.success('Monk Mode completed. Mind expanded.', { icon: '🧠' });
      
      if (Math.random() > 0.8) {
        setTimeout(triggerLevelUp, 1500);
      }
    } else {
      if (actualDuration > 0) {
        const xp = await processXpGain('Partial Focus', actualDuration, false);
        toast(`Partial focus logged. ${xp} XP recovered.`);
      }
    }
  };

  const initiateLockdown = () => {
    setShockwaveActive(true);
    setTimeout(() => {
      setShockwaveActive(false);
      setIsMonkMode(true);
    }, 600);
  };

  // ── MOOD TRACKER ──────────────────────────────────────────────────────────
  const MOODS = [
    { emoji: '💀', label: 'Void', color: '#475569' },
    { emoji: '😔', label: 'Low', color: '#EF4444' },
    { emoji: '😐', label: 'Neutral', color: '#94A3B8' },
    { emoji: '😊', label: 'Good', color: '#10B981' },
    { emoji: '🔥', label: 'Locked In', color: '#F59E0B' },
  ];
  const todayMoodKey = `monarch_mood_${new Date().toISOString().split('T')[0]}`;
  const [selectedMood, setSelectedMood] = useState<number | null>(() => {
    const saved = localStorage.getItem(todayMoodKey);
    return saved ? parseInt(saved) : null;
  });
  const [moodHistory] = useState<Array<{ day: string; mood: number }>>(() => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = `monarch_mood_${d.toISOString().split('T')[0]}`;
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        history.push({ day: d.toLocaleDateString([], { weekday: 'short' }), mood: parseInt(saved) });
      } else {
        history.push({ day: d.toLocaleDateString([], { weekday: 'short' }), mood: -1 });
      }
    }
    return history;
  });

  const setMood = (idx: number) => {
    setSelectedMood(idx);
    localStorage.setItem(todayMoodKey, idx.toString());
    toast(MOODS[idx].label + ' — State logged.', { icon: MOODS[idx].emoji });
  };

  // ── BREATHING EXERCISE ─────────────────────────────────────────────────────
  const BREATHE_PHASES = [
    { label: 'INHALE', seconds: 4, color: '#06B6D4', scale: 1.4 },
    { label: 'HOLD', seconds: 4, color: '#A78BFA', scale: 1.4 },
    { label: 'EXHALE', seconds: 4, color: '#10B981', scale: 1.0 },
    { label: 'HOLD', seconds: 4, color: '#F59E0B', scale: 1.0 },
  ];
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [breathTick, setBreathTick] = useState(0);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBreathing = () => {
    setBreathRunning(true);
    setBreathPhase(0);
    setBreathTick(0);
  };
  const stopBreathing = () => {
    setBreathRunning(false);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    setBreathTick(0);
  };

  useEffect(() => {
    if (!breathRunning) return;
    const tick = setInterval(() => {
      setBreathTick(prev => {
        const phase = BREATHE_PHASES[breathPhase];
        if (prev >= phase.seconds - 1) {
          const nextPhase = (breathPhase + 1) % BREATHE_PHASES.length;
          setBreathPhase(nextPhase);
          if (nextPhase === 0) setBreathCount(c => c + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [breathRunning, breathPhase]);

  const currentPhase = BREATHE_PHASES[breathPhase];

  // ── JOURNAL ENTRY ───────────────────────────────────────────────────────────
  const journalKey = `monarch_journal_${new Date().toISOString().split('T')[0]}`;
  const [journalText, setJournalText] = useState(() => localStorage.getItem(journalKey) || '');
  const [journalSaved, setJournalSaved] = useState(false);
  const saveJournal = () => {
    localStorage.setItem(journalKey, journalText);
    setJournalSaved(true);
    toast.success('Journal entry committed to the void.', { icon: '✍️' });
    setTimeout(() => setJournalSaved(false), 2500);
  };

  // ── AFFIRMATIONS ────────────────────────────────────────────────────────────
  const AFFIRMATIONS = [
    'I am disciplined. I am consistent. I rise every single day.',
    'My mind is a weapon. I sharpen it daily with knowledge and focus.',
    'I do not negotiate with weakness. I eliminate it.',
    'Every challenge is a level up in disguise.',
    'I am the shadow monarch of my own destiny.',
    'Pain is temporary. Level is permanent.',
    'I choose discomfort now so I can choose comfort later.',
    'My potential is limitless. My grind is infinite.',
    'I am not built for average. I was made to rise.',
    'Each rep, each session, each page — I am becoming.',
  ];
  const [affirmIdx, setAffirmIdx] = useState(0);

  return (
    <>
      <MonkModeOverlay 
        isActive={isMonkMode} 
        onClose={handleMonkModeClose} 
        targetMinutes={monkTarget} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="p-4 md:p-12 max-w-[1200px] mx-auto w-full space-y-8 relative"
      >
        {/* Floating background neural orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[20vw] h-[20vw] bg-[#7B2FFF]/10 rounded-full blur-[80px] top-[10%] left-[5%] animate-float-1" />
          <div className="absolute w-[22vw] h-[22vw] bg-[#00D4FF]/10 rounded-full blur-[80px] top-[30%] right-[10%] animate-float-2" />
          <div className="absolute w-[18vw] h-[18vw] bg-[#7B2FFF]/10 rounded-full blur-[80px] bottom-[20%] left-[20%] animate-float-3" />
          <div className="absolute w-[25vw] h-[25vw] bg-[#00D4FF]/10 rounded-full blur-[80px] bottom-[40%] right-[30%] animate-float-4" />
          <div className="absolute w-[20vw] h-[20vw] bg-[#7B2FFF]/10 rounded-full blur-[80px] top-[50%] left-[60%] animate-float-5" />
          <div className="absolute w-[15vw] h-[15vw] bg-[#00D4FF]/10 rounded-full blur-[80px] top-[80%] right-[5%] animate-float-6" />
        </div>

        {/* ── MOOD TRACKER + BREATHING + AFFIRMATIONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 relative z-10">
          
          {/* Mood Tracker */}
          <div className="glass-2 p-5 flex flex-col gap-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Brain className="w-3.5 h-3.5 text-violet-400" /> Emotional State
            </h3>
            <div className="flex justify-between">
              {MOODS.map((m, i) => (
                <button
                  key={m.label}
                  onClick={() => setMood(i)}
                  className={`mood-btn flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${selectedMood === i ? 'selected bg-white/10' : 'opacity-50 hover:opacity-80'}`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="font-mono text-[8px] uppercase" style={{ color: m.color }}>{m.label}</span>
                </button>
              ))}
            </div>
            {/* 7-day mood history */}
            <div className="flex gap-1.5 mt-1">
              {moodHistory.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full h-6 rounded flex items-center justify-center font-mono text-sm"
                    style={{
                      background: h.mood >= 0 ? `${MOODS[h.mood]?.color}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${h.mood >= 0 ? MOODS[h.mood]?.color + '44' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    {h.mood >= 0 ? MOODS[h.mood]?.emoji : ''}
                  </div>
                  <span className="font-mono text-[7px] text-white/20">{h.day[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Box Breathing */}
          <div className="glass-2 p-5 flex flex-col items-center gap-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/5 pb-2 w-full">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Box Breathing (4-4-4-4)
            </h3>
            {/* Animated circle */}
            <div className="relative w-24 h-24 flex items-center justify-center my-1">
              <div
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center transition-transform duration-1000"
                style={{
                  borderColor: currentPhase.color,
                  transform: breathRunning ? `scale(${currentPhase.scale})` : 'scale(1)',
                  boxShadow: breathRunning ? `0 0 20px ${currentPhase.color}44` : 'none',
                }}
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] font-bold block" style={{ color: currentPhase.color }}>
                    {breathRunning ? currentPhase.label : 'READY'}
                  </span>
                  {breathRunning && (
                    <span className="font-mono text-xl font-black text-white">
                      {currentPhase.seconds - breathTick}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/30">
              <span>Cycles: <span className="text-violet-400 font-bold">{breathCount}</span></span>
            </div>
            <button
              onClick={breathRunning ? stopBreathing : startBreathing}
              className={`w-full py-2 text-xs font-mono font-bold border rounded transition-all ${breathRunning ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400'}`}
            >
              {breathRunning ? 'STOP' : 'BEGIN'}
            </button>
          </div>

          {/* Affirmations */}
          <div className="glass-2 p-5 flex flex-col gap-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <ScrollText className="w-3.5 h-3.5 text-amber-400" /> Daily Affirmation
            </h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={affirmIdx}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex-1 flex items-center justify-center min-h-[80px]"
              >
                <p className="font-display text-sm font-medium text-[#F1F5F9] leading-relaxed text-center italic">
                  "{AFFIRMATIONS[affirmIdx]}"
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between mt-auto">
              <button
                onClick={() => setAffirmIdx(i => (i - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[9px] text-white/20">{affirmIdx + 1} / {AFFIRMATIONS.length}</span>
              <button
                onClick={() => setAffirmIdx(i => (i + 1) % AFFIRMATIONS.length)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── HABIT TRACKER ── */}
        <HabitTracker className="mb-6 relative z-10" />

        {/* ── JOURNAL QUICK ENTRY ── */}
        <div className="glass-2 p-5 mb-6 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-purple-400" /> Daily Journal Entry
            </h3>
            <span className="font-mono text-[9px] text-white/30">{new Date().toLocaleDateString()}</span>
          </div>
          <textarea
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            rows={4}
            placeholder="Record your thoughts, reflections, and realizations for today..."
            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white/80 font-mono text-xs placeholder-white/20 focus:border-violet-500/50 focus:outline-none resize-none transition-colors"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="font-mono text-[9px] text-white/20">{journalText.length} characters</span>
            <button
              onClick={saveJournal}
              disabled={!journalText.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all ${journalSaved ? 'bg-green-950/20 border-green-500/30 text-green-400' : 'bg-violet-950/20 border-violet-500/30 text-violet-400 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]'} disabled:opacity-30`}
            >
              <Save className="w-3 h-3" /> {journalSaved ? 'SAVED' : 'COMMIT'}
            </button>
          </div>
        </div>

        {/* Header HUD */}
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 bg-void border border-accent-purple/60 glow-brain-ring flex items-center justify-center">
            <Brain className="w-8 h-8 text-[#7B2FFF] animate-pulse" />
          </div>
          <div>
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
              Mental <span className="text-[#7B2FFF]">Fortitude</span>
            </h1>
            <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
              Control the mind, conquer the system.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
          
          {/* Left Column: Logging & Monk Mode */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Monk Mode Initiator */}
            <div className={`glass-panel p-6 relative overflow-hidden group transition-all duration-300 ${
              shockwaveActive ? 'shockwave-effect active' : 'border-t-2 border-t-accent-purple border-accent-purple/30 animate-[pulse-border_3s_infinite]'
            }`}>
              <div className="absolute inset-0 bg-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-accent-purple">
                <Lock className="w-5 h-5" />
                Monk Mode
              </h2>
              <p className="font-space-mono text-xs text-white/60 mb-6">
                Enter total lockdown. Extreme focus protocol. Yields 1.5x XP multiplier.
              </p>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-space-mono text-xs text-white/50 uppercase tracking-widest">Duration</span>
                  <span className="font-orbitron font-bold text-2xl text-accent-purple">{monkTarget}<span className="text-sm text-white/50 ml-1">min</span></span>
                </div>
                <div className="relative flex items-center h-8">
                  <input 
                    type="range" 
                    min="10" 
                    max="120" 
                    step="10"
                    value={monkTarget}
                    onChange={(e) => setMonkTarget(parseInt(e.target.value))}
                    className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-transparent focus:outline-none 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#7B2FFF] [&::-webkit-slider-thumb]:to-[#b829e3] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/50 [&::-webkit-slider-thumb]:shadow-[0_0_8px_#7B2FFF]
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-[#7B2FFF] [&::-moz-range-thumb]:to-[#b829e3] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/50 [&::-moz-range-thumb]:shadow-[0_0_8px_#7B2FFF]"
                    style={{
                      background: `linear-gradient(to right, #7B2FFF 0%, #b829e3 ${((monkTarget - 10) / (120 - 10)) * 100}%, rgba(255,255,255,0.1) ${((monkTarget - 10) / (120 - 10)) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>
                {/* Tick marks & glowing active indicators */}
                <div className="flex justify-between mt-2 px-1 relative">
                  {[10, 30, 60, 90, 120].map(t => {
                    const isActive = monkTarget >= t;
                    return (
                      <div key={t} className="flex flex-col items-center">
                        <div className={`w-1 h-1 rounded-full mb-1 transition-all ${
                          isActive ? 'bg-[#7B2FFF] shadow-[0_0_4px_#7B2FFF]' : 'bg-white/10'
                        }`} />
                        <span className={`font-space-mono text-[9px] transition-colors ${
                          monkTarget === t ? 'text-accent-purple font-bold' : 'text-white/20'
                        }`}>{t}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Protocol Cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={() => setSilence(!silence)}
                  className={`p-3 glass-panel border flex flex-col items-center gap-1.5 transition-all text-center ${
                    silence ? 'border-accent-purple/60 bg-accent-purple/10 text-accent-purple shadow-[0_0_12px_rgba(123,47,255,0.25)]' : 'border-white/5 text-white/50'
                  }`}
                  data-tooltip="Silence Protocol: No Notifications"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-space-mono text-[8px] uppercase tracking-wider">Silence</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsolation(!isolation)}
                  className={`p-3 glass-panel border flex flex-col items-center gap-1.5 transition-all text-center ${
                    isolation ? 'border-accent-purple/60 bg-accent-purple/10 text-accent-purple shadow-[0_0_12px_rgba(123,47,255,0.25)]' : 'border-white/5 text-white/50'
                  }`}
                  data-tooltip="Isolation Protocol: Extreme Solitude"
                >
                  <UserMinus className="w-4 h-4" />
                  <span className="font-space-mono text-[8px] uppercase tracking-wider">Isolation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSingleTask(!singleTask)}
                  className={`p-3 glass-panel border flex flex-col items-center gap-1.5 transition-all text-center ${
                    singleTask ? 'border-accent-purple/60 bg-accent-purple/10 text-accent-purple shadow-[0_0_12px_rgba(123,47,255,0.25)]' : 'border-white/5 text-white/50'
                  }`}
                  data-tooltip="Focus Protocol: Single Objective"
                >
                  <Target className="w-4 h-4" />
                  <span className="font-space-mono text-[8px] uppercase tracking-wider">Single Task</span>
                </button>
              </div>

              <button 
                onClick={initiateLockdown}
                className="w-full btn-primary bg-transparent border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-void py-4 flex items-center justify-center gap-2 scanline-btn-effect active:scale-95 transition-transform"
                style={{ boxShadow: '0 0 15px rgba(184, 41, 227, 0.3)' }}
              >
                <BrainCircuit className="w-5 h-5" />
                INITIATE LOCKDOWN
              </button>
            </div>

            {/* Manual Entry Form with underline style inputs */}
            <div className="glass-panel p-6 border border-white/5">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-accent-blue" />
                Manual Log
              </h2>
              
              <form onSubmit={handleLogManual} className="space-y-6">
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 tracking-widest uppercase mb-2">
                    Discipline Type
                  </label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-accent-purple/30 p-2 text-white font-archivo-narrow text-sm focus:border-accent-purple focus:ring-0 outline-none rounded-none w-full"
                  >
                    <option className="bg-[#0a0a0f]" value="Meditation">Meditation</option>
                    <option className="bg-[#0a0a0f]" value="Deep Work">Deep Work</option>
                    <option className="bg-[#0a0a0f]" value="Deep Reading">Deep Reading</option>
                    <option className="bg-[#0a0a0f]" value="Journaling">Journaling</option>
                    <option className="bg-[#0a0a0f]" value="Visualization">Visualization</option>
                  </select>
                </div>

                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 tracking-widest uppercase mb-2">
                    Duration (Minutes)
                  </label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-accent-purple/30 p-2 text-white font-archivo-narrow text-base focus:border-accent-purple focus:ring-0 outline-none rounded-none w-full"
                  />
                  {/* Estimated Live XP Preview */}
                  <p className="font-space-mono text-[10px] text-accent-purple mt-2 tracking-wider">
                    Estimated XP: +{(parseInt(duration) || 0) * 2} XP
                  </p>
                </div>

                <button type="submit" className="w-full btn-ghost py-3 flex items-center justify-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform">
                  Log Entry
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Stats and History */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Related Stats wrapped in custom color top border and rank badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="glass-panel p-5 border-t-2 border-t-accent-purple relative flex flex-col items-center bg-void/50">
                <StatRing statName="Stoicism" level={stoicismStat.level} xp={stoicismStat.xp % 100} />
                <span className="mt-3 font-space-mono text-xs text-accent-purple/70 tracking-widest uppercase">
                  RANK {getLevelRank(stoicismStat.level)}
                </span>
              </div>

              <div className="glass-panel p-5 border-t-2 border-t-accent-blue relative flex flex-col items-center bg-void/50">
                <StatRing statName="Focus" level={focusStat.level} xp={focusStat.xp % 100} />
                <span className="mt-3 font-space-mono text-xs text-accent-blue/70 tracking-widest uppercase">
                  RANK {getLevelRank(focusStat.level)}
                </span>
              </div>

            </div>

            {/* Log History Timeline list */}
            <div className="glass-panel p-6 border border-white/5 relative bg-void/30">
              
              {/* Ruled separator header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-px bg-accent-purple" />
                <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white">
                  Mind Archives
                </h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              
              {logs.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  title="Mind is a blank slate"
                  description="Begin your mindfulness protocol. Enter Lockdown Mode or log a deep focus session to record training logs."
                />
              ) : (
                <div className="relative pl-6">
                  {/* Timeline vertical bar */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-accent-purple/20" />
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {logs.map((log) => {
                        const isMonk = log.activity_type.toLowerCase().includes('monk') || log.metadata?.isMonk;
                        return (
                          <div key={log.id} className="relative flex items-start gap-4">
                            {/* Glowing Timeline Node */}
                            <div className={`absolute -left-[20px] top-1.5 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(123,47,255,0.7)] ${
                              isMonk ? 'bg-accent-purple' : 'bg-accent-blue shadow-[0_0_8px_rgba(0,212,255,0.7)]'
                            }`} />
                            
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex-1 p-4 bg-void/50 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-l-4 hover:border-l-accent-purple transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 flex items-center justify-center ${isMonk ? 'bg-accent-purple/10' : 'bg-accent-blue/10'}`}>
                                  <Brain className={`w-4 h-4 ${isMonk ? 'text-accent-purple' : 'text-accent-blue'}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-archivo-narrow text-base text-white">{log.activity_type}</h3>
                                    {isMonk && (
                                      <span className="px-1.5 py-0.5 bg-accent-purple/20 text-[#b829e3] text-[9px] font-space-mono tracking-widest uppercase rounded shadow-[0_0_6px_rgba(184,41,227,0.2)]">
                                        🧠 MONK MODE
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-space-mono text-[10px] text-white/30">{new Date(log.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                                <span className="font-space-mono text-xs text-white/50 uppercase tracking-widest">{log.duration_minutes} MIN</span>
                                <motion.span 
                                  initial={{ scale: 0.8 }} 
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                  className={`font-space-mono text-xs font-bold px-2.5 py-1 ${isMonk ? 'text-accent-purple bg-accent-purple/10' : 'text-accent-blue bg-accent-blue/10'}`}
                                >
                                  +{log.xp_earned} XP
                                </motion.span>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
}
