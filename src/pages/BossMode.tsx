import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Swords, ShieldAlert, CheckSquare, Square, Zap, RefreshCw, Flame, Dumbbell, Brain, Timer } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import toast from 'react-hot-toast';

interface BossQuest {
  id: string;
  title: string;
  category: 'strength' | 'endurance' | 'discipline' | 'mind';
  xp: number;
  damage: number;
  completed: boolean;
  icon: string;
}

const QUEST_POOL: Omit<BossQuest, 'id' | 'completed'>[] = [
  // Strength / Physical
  { title: '100 Push-ups — No Mercy', category: 'strength', icon: '💪', xp: 120, damage: 1800 },
  { title: '200 Bodyweight Squats', category: 'strength', icon: '🦵', xp: 150, damage: 2000 },
  { title: '50 Pull-ups (any grip)', category: 'strength', icon: '🏋️', xp: 180, damage: 2500 },
  { title: '10-minute Plank Challenge', category: 'endurance', icon: '🧱', xp: 140, damage: 1900 },
  { title: '5KM Run — Sub 25 minutes', category: 'endurance', icon: '🏃', xp: 160, damage: 2200 },
  { title: '1000 Calf Raises (Park Protocol)', category: 'strength', icon: '🦶', xp: 100, damage: 1500 },
  { title: '3 sets of Dips to failure', category: 'strength', icon: '🤸', xp: 90, damage: 1200 },
  { title: '50 Burpees — Full Extension', category: 'endurance', icon: '⚡', xp: 130, damage: 1700 },
  { title: '200 Sit-ups — Lockism Style', category: 'strength', icon: '🔥', xp: 110, damage: 1600 },
  { title: '30-min Shadow Boxing', category: 'endurance', icon: '🥊', xp: 120, damage: 1700 },
  { title: 'Wall Sit — 5 minutes total', category: 'strength', icon: '🧗', xp: 80, damage: 1100 },
  { title: '100 Jump Squats — Explosive', category: 'endurance', icon: '💨', xp: 130, damage: 1800 },
  // Discipline / Mind
  { title: 'Ice Cold Shower — No hesitation', category: 'discipline', icon: '🧊', xp: 60, damage: 800 },
  { title: 'Wake at 5AM — Protocol Active', category: 'discipline', icon: '🌅', xp: 80, damage: 1000 },
  { title: '1-Hour No-Phone Morning', category: 'discipline', icon: '📵', xp: 70, damage: 900 },
  { title: 'Meditate for 20 minutes', category: 'mind', icon: '🧘', xp: 60, damage: 800 },
  { title: 'Journal 3 pages — Stream of consciousness', category: 'mind', icon: '📖', xp: 50, damage: 700 },
  { title: 'Eat Zero Processed Food today', category: 'discipline', icon: '🥗', xp: 90, damage: 1100 },
  { title: 'No Social Media for 12 hours', category: 'discipline', icon: '🚫', xp: 75, damage: 950 },
  { title: '1 Hour Deep Reading — No distractions', category: 'mind', icon: '📚', xp: 80, damage: 1000 },
];

const CATEGORY_COLOR: Record<string, string> = {
  strength: '#ff5a00',
  endurance: '#ff003c',
  discipline: '#00D4FF',
  mind: '#7B2FFF',
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  strength: Dumbbell,
  endurance: Flame,
  discipline: Timer,
  mind: Brain,
};

const BOSSES = [
  { name: 'Park Hyung-Seok', hp: 8000, desc: 'The Lookism Boss — Trained from poverty to perfection.', color: '#ff5a00' },
  { name: 'Gun Park', hp: 12000, desc: 'The Real Body — Unmatched raw power and discipline.', color: '#ff003c' },
  { name: 'Daniel Park', hp: 15000, desc: 'FINAL FORM — The body every hunter seeks to achieve.', color: '#b829e3' },
];

function pickRandomQuests(n: number): BossQuest[] {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((q, i) => ({ ...q, id: `q${i}_${Date.now()}`, completed: false }));
}

export default function BossMode() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const { addLog } = useActivityLogs('fitness');

  const [bossIndex, setBossIndex] = useState(0);
  const boss = BOSSES[bossIndex];
  const MAX_HP = boss.hp;

  const [quests, setQuests] = useState<BossQuest[]>(() => pickRandomQuests(5));
  const [timeLeft, setTimeLeft] = useState(0); // seconds for cooldown between rerolls
  const [canReroll, setCanReroll] = useState(true);

  const currentDamage = quests.filter(q => q.completed).reduce((acc, q) => acc + q.damage, 0);
  const currentHP = Math.max(0, MAX_HP - currentDamage);
  const hpPercent = (currentHP / MAX_HP) * 100;
  const isDefeated = currentHP === 0;

  // Cooldown reroll timer
  useEffect(() => {
    if (timeLeft <= 0) { setCanReroll(true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleReroll = () => {
    if (!canReroll) return;
    setQuests(pickRandomQuests(5));
    setCanReroll(false);
    setTimeLeft(30);
    toast('New Quests Spawned! The system reshuffles...', { icon: '🎲' });
  };

  const handleStrike = useCallback(async (e: React.MouseEvent, quest: BossQuest) => {
    if (isDefeated || quest.completed) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: true } : q));

    addXpParticle(rect.left + rect.width / 2, rect.top, quest.xp);
    await addLog(quest.title, 0, quest.xp, {}, [quest.category]);

    toast(`Critical Strike! "${quest.title}" — ${quest.damage} DMG`, { icon: quest.icon, duration: 3000 });

    if (currentDamage + quest.damage >= MAX_HP) {
      setTimeout(async () => {
        toast.success(`BOSS DEFEATED: ${boss.name}`, { duration: 5000, icon: '🏆' });
        triggerLevelUp();

        if (bossIndex < BOSSES.length - 1) {
          setTimeout(() => {
            setBossIndex(p => p + 1);
            setQuests(pickRandomQuests(5));
            toast(`New Boss Awakened: ${BOSSES[bossIndex + 1].name}`, { icon: '💀', duration: 5000 });
          }, 3000);
        }
      }, 1000);
    }
  }, [isDefeated, currentDamage, MAX_HP, quest, addLog, addXpParticle, triggerLevelUp, boss.name, bossIndex]);

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-10"
    >
      {/* Header */}
      <div className="text-center space-y-2 relative">
        <p className="font-space-mono text-xs text-[#ff003c]/60 tracking-[0.4em] uppercase">
          Class-S Threat Detected
        </p>
        <h1
          className="font-orbitron text-5xl md:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] to-[#8b0000]"
          style={{ textShadow: '0 0 40px rgba(255, 0, 60, 0.3)' }}
        >
          BOSS FIGHT
        </h1>
        <p className="font-space-mono text-sm tracking-[0.2em] uppercase" style={{ color: boss.color }}>
          {boss.desc}
        </p>
      </div>

      {/* Boss + HP */}
      <div className="max-w-3xl mx-auto text-center relative">
        {/* Boss Name Banner */}
        <div className="mb-4">
          <span className="font-orbitron text-lg font-bold uppercase tracking-widest" style={{ color: boss.color }}>
            {boss.name}
          </span>
          <span className="font-space-mono text-xs text-white/30 ml-3 uppercase tracking-widest">
            Stage {bossIndex + 1}/{BOSSES.length}
          </span>
        </div>

        <motion.div
          animate={isDefeated ? { opacity: 0, scale: 0.3, filter: 'blur(20px)' } : { y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative inline-block mb-8"
        >
          <div className="absolute inset-0 rounded-full blur-[80px] opacity-30" style={{ background: boss.color }} />
          <Skull
            className="w-40 h-40 mx-auto relative z-10 transition-colors duration-1000"
            style={{ color: isDefeated ? 'rgba(255,255,255,0.1)' : boss.color, filter: isDefeated ? 'none' : `drop-shadow(0 0 24px ${boss.color})` }}
          />
        </motion.div>

        {/* HP Bar */}
        <div className="glass-panel p-4 border relative overflow-hidden" style={{ borderColor: `${boss.color}40` }}>
          <div className="flex justify-between font-orbitron font-bold text-lg mb-2 px-1">
            <span className="text-white/70 uppercase tracking-widest text-sm">HP</span>
            <span style={{ color: isDefeated ? 'rgba(255,255,255,0.2)' : boss.color }}>
              {currentHP.toLocaleString()} / {MAX_HP.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-6 bg-black border border-white/10 relative overflow-hidden rounded-sm">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="h-full relative"
              style={{ background: `linear-gradient(to right, ${boss.color}88, ${boss.color})`, boxShadow: `0 0 20px ${boss.color}99` }}
            />
          </div>
          {/* HP segments */}
          <div className="flex gap-1 mt-2">
            {quests.map((q, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-500" style={{ background: q.completed ? boss.color : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Quest Panel */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest flex items-center gap-2 text-white">
            <Swords className="w-5 h-5" style={{ color: boss.color }} />
            Strike Objectives
            <span className="font-space-mono text-xs text-white/30 ml-2">({completedCount}/{quests.length} done)</span>
          </h2>
          <button
            onClick={handleReroll}
            disabled={!canReroll}
            className={`flex items-center gap-2 px-4 py-2 border font-space-mono text-xs uppercase tracking-widest transition-all duration-300 ${
              canReroll
                ? 'border-white/20 text-white/60 hover:border-accent-blue hover:text-accent-blue'
                : 'border-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${!canReroll ? 'animate-spin' : ''}`} />
            {canReroll ? 'Reroll Quests' : `Wait ${timeLeft}s`}
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {quests.map((quest) => {
              const CatIcon = CATEGORY_ICON[quest.category];
              const color = CATEGORY_COLOR[quest.category];
              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.9 }}
                  whileHover={!quest.completed ? { scale: 1.01, x: 4 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`glass-panel p-4 border-l-4 transition-all duration-300 flex items-center justify-between cursor-pointer group relative overflow-hidden ${
                    quest.completed
                      ? 'border-l-white/10 opacity-40 grayscale cursor-default'
                      : 'hover:bg-white/3'
                  }`}
                  style={!quest.completed ? { borderLeftColor: color } : {}}
                  onClick={(e) => !quest.completed && handleStrike(e, quest)}
                >
                  {/* Glow bg on hover */}
                  {!quest.completed && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at left, ${color}10, transparent 70%)` }} />
                  )}

                  <div className="flex items-center gap-4 relative z-10">
                    {/* Icon */}
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg text-xl flex-shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      {quest.icon}
                    </div>

                    <div>
                      <h3 className={`font-archivo-narrow text-lg leading-tight ${quest.completed ? 'line-through text-white/40' : 'text-white'}`}>
                        {quest.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CatIcon className="w-3 h-3" style={{ color }} />
                        <span className="font-space-mono text-xs capitalize" style={{ color: `${color}aa` }}>
                          {quest.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-space-mono text-sm font-bold" style={{ color: quest.completed ? 'rgba(255,255,255,0.2)' : color }}>
                        {quest.damage.toLocaleString()} DMG
                      </div>
                      <div className="font-space-mono text-xs text-white/30">+{quest.xp} XP</div>
                    </div>
                    <button className="flex-shrink-0" style={{ color: quest.completed ? 'rgba(255,255,255,0.3)' : color }}>
                      {quest.completed ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Victory Screen */}
      <AnimatePresence>
        {isDefeated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-3xl mx-auto p-8 border-2 text-center"
            style={{ borderColor: boss.color, background: `${boss.color}10`, boxShadow: `0 0 40px ${boss.color}30` }}
          >
            <Zap className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: boss.color }} />
            <h2 className="font-orbitron text-3xl font-bold text-white uppercase tracking-widest mb-2">
              {boss.name} Defeated!
            </h2>
            {bossIndex < BOSSES.length - 1 ? (
              <p className="font-space-mono text-white/60 uppercase tracking-widest text-sm">
                Next threat spawning... Prepare yourself.
              </p>
            ) : (
              <p className="font-space-mono uppercase tracking-widest text-sm" style={{ color: boss.color }}>
                You have achieved the body of Daniel Park. The system bows.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
