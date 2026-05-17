import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, CheckSquare, Square, Zap, RefreshCw, Flame, Dumbbell, Brain, Timer } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import toast from 'react-hot-toast';

interface BossQuest {
  id: string;
  title: string;
  category: string;
  xp: number;
  damage: number;
  completed: boolean;
  icon: string;
}

const QUEST_POOL: Omit<BossQuest, 'id' | 'completed'>[] = [
  { title: '100 Push-ups — No Mercy', category: 'strength', icon: '💪', xp: 120, damage: 1800 },
  { title: '200 Bodyweight Squats', category: 'strength', icon: '🦵', xp: 150, damage: 2000 },
  { title: '50 Pull-ups (any grip)', category: 'strength', icon: '🏋️', xp: 180, damage: 2500 },
  { title: '10-minute Plank Challenge', category: 'endurance', icon: '🧱', xp: 140, damage: 1900 },
  { title: '5KM Run — Sub 25 minutes', category: 'endurance', icon: '🏃', xp: 160, damage: 2200 },
  { title: '1000 Calf Raises (Park Protocol)', category: 'strength', icon: '🦶', xp: 100, damage: 1500 },
  { title: '3 Sets of Dips to Failure', category: 'strength', icon: '🤸', xp: 90, damage: 1200 },
  { title: '50 Burpees — Full Extension', category: 'endurance', icon: '⚡', xp: 130, damage: 1700 },
  { title: '200 Sit-ups — Lookism Style', category: 'strength', icon: '🔥', xp: 110, damage: 1600 },
  { title: '30-min Shadow Boxing', category: 'endurance', icon: '🥊', xp: 120, damage: 1700 },
  { title: 'Wall Sit — 5 minutes total', category: 'strength', icon: '🧗', xp: 80, damage: 1100 },
  { title: '100 Jump Squats — Explosive', category: 'endurance', icon: '💨', xp: 130, damage: 1800 },
  { title: 'Ice Cold Shower — No hesitation', category: 'discipline', icon: '🧊', xp: 60, damage: 800 },
  { title: 'Wake at 5AM — Protocol Active', category: 'discipline', icon: '🌅', xp: 80, damage: 1000 },
  { title: '1-Hour No-Phone Morning', category: 'discipline', icon: '📵', xp: 70, damage: 900 },
  { title: 'Meditate for 20 minutes', category: 'mind', icon: '🧘', xp: 60, damage: 800 },
  { title: 'Journal 3 pages — Full honesty', category: 'mind', icon: '📖', xp: 50, damage: 700 },
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

const BOSSES = [
  { name: 'Park Hyung-Seok', hp: 8000, desc: 'Trained from poverty to perfection.', color: '#ff5a00' },
  { name: 'Gun Park', hp: 12000, desc: 'Unmatched raw power and discipline.', color: '#ff003c' },
  { name: 'Daniel Park', hp: 15000, desc: 'FINAL FORM — The body every hunter seeks.', color: '#b829e3' },
];

function pickRandomQuests(n: number, excludeTitles: string[] = []): BossQuest[] {
  const available = QUEST_POOL.filter(q => !excludeTitles.includes(q.title));
  // If pool is nearly exhausted, reset exclusions and pick from full pool
  const pool = available.length >= n ? available : [...QUEST_POOL];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((q, i) => ({
    ...q,
    id: `q${i}_${Date.now()}`,
    completed: false,
  }));
}

interface BossModeState {
  bossIndex: number;
  quests: BossQuest[];
  bossDamage: number;
  defeated: boolean;
  rerolls: { date: string; count: number };
  usedTitles: string[];
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const loadState = (): BossModeState => {
  const defaultState: BossModeState = {
    bossIndex: 0,
    quests: pickRandomQuests(5),
    bossDamage: 0,
    defeated: false,
    rerolls: { date: getTodayDateString(), count: 0 },
    usedTitles: [],
  };

  const saved = localStorage.getItem('monarchBossMode');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const today = getTodayDateString();
      if (parsed.rerolls?.date !== today) {
        parsed.rerolls = { date: today, count: 0 };
      }
      return { ...defaultState, ...parsed, rerolls: parsed.rerolls, usedTitles: parsed.usedTitles ?? [] };
    } catch (e) {
      return defaultState;
    }
  }
  return defaultState;
};

export default function BossMode() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const { addLog } = useActivityLogs('fitness');

  const [state, setState] = useState<BossModeState>(loadState);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    localStorage.setItem('monarchBossMode', JSON.stringify(state));
  }, [state]);

  const { bossIndex, quests, bossDamage, defeated, rerolls, usedTitles } = state;
  const boss = BOSSES[bossIndex];
  const MAX_HP = boss.hp;

  const currentHP = Math.max(0, MAX_HP - bossDamage);
  const hpPercent = (currentHP / MAX_HP) * 100;
  const completedCount = quests.filter(q => q.completed).length;

  // Boss defeated watcher
  useEffect(() => {
    if (currentHP === 0 && !defeated) {
      setState(s => ({ ...s, defeated: true }));
      setTimeout(() => {
        toast.success(`BOSS DEFEATED: ${boss.name}!`, { duration: 5000, icon: '🏆' });
        triggerLevelUp();

        if (bossIndex < BOSSES.length - 1) {
          setTimeout(() => {
            setState(s => ({
              ...s,
              bossIndex: s.bossIndex + 1,
              bossDamage: 0,
              defeated: false,
              usedTitles: [], // reset for new boss
            }));
            toast(`⚠️ New Threat: ${BOSSES[bossIndex + 1].name}`, { duration: 4000 });
          }, 3000);
        }
      }, 1000);
    }
  }, [currentHP, defeated, boss.name, bossIndex, triggerLevelUp]);

  // Auto-reroll when all quests completed but boss still alive
  useEffect(() => {
    if (completedCount === quests.length && quests.length > 0 && !defeated) {
      const t = setTimeout(() => {
        setState(s => ({
          ...s,
          quests: pickRandomQuests(5, s.usedTitles),
        }));
        toast('⚔️ New objectives spawned — keep striking!', { duration: 3000 });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [completedCount, quests.length, defeated]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleReroll = () => {
    if (cooldown > 0) return;
    if (rerolls.count >= 3) {
      toast.error('Max 3 rerolls per day allowed.', { icon: '🚫' });
      return;
    }

    setState(s => ({
      ...s,
      quests: pickRandomQuests(5, s.usedTitles),
      defeated: false,
      rerolls: { ...s.rerolls, count: s.rerolls.count + 1 }
    }));
    
    setCooldown(30);
    toast(`New Quests Spawned! (${2 - rerolls.count} rerolls left)`, { icon: '🎲' });
  };

  const handleStrike = (e: React.MouseEvent, questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed || defeated) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, quest.xp);

    // Log to Supabase (fire-and-forget)
    addLog(quest.title, 0, quest.xp, {}, [quest.category]).catch(console.error);

    toast(`⚔️ ${quest.icon} ${quest.damage.toLocaleString()} DMG`, { duration: 2500 });

    setState(s => ({
      ...s,
      bossDamage: s.bossDamage + quest.damage,
      usedTitles: [...s.usedTitles, quest.title],
      quests: s.quests.map(q => q.id === questId ? { ...q, completed: true } : q)
    }));
  };

  const categoryIcon = (cat: string) => {
    if (cat === 'strength') return <Dumbbell className="w-3 h-3" />;
    if (cat === 'endurance') return <Flame className="w-3 h-3" />;
    if (cat === 'discipline') return <Timer className="w-3 h-3" />;
    return <Brain className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen p-6 md:p-10 max-w-[1400px] mx-auto w-full"
    >
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${boss.color}18 0%, transparent 70%)` }}
      />

      {/* Page header */}
      <div className="relative z-10 text-center mb-10">
        <p className="font-space-mono text-xs text-[#ff003c]/60 tracking-[0.5em] uppercase mb-2">
          ⚠ Class-S Threat Detected ⚠
        </p>
        <h1 className="font-orbitron text-6xl md:text-8xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] via-[#cc0028] to-[#4d0010]">
          BOSS FIGHT
        </h1>
      </div>

      {/* Two-column hero: Boss card + Quest list */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

        {/* ── LEFT: Boss Card ── */}
        <div className="space-y-5">
          {/* Boss portrait */}
          <div
            className="relative overflow-hidden"
            style={{ border: `1px solid ${boss.color}40`, background: 'rgba(0,0,0,0.6)' }}
          >
            {/* scanlines overlay */}
            <div
              className="absolute inset-0 z-20 pointer-events-none opacity-[0.07]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
              }}
            />
            {/* Glow behind image */}
            <div
              className="absolute inset-0 z-0"
              style={{ background: `radial-gradient(ellipse at 50% 80%, ${boss.color}33, transparent 70%)` }}
            />

            <AnimatePresence mode="wait">
              <motion.img
                key={bossIndex}
                src={`/boss-${bossIndex}.png`}
                alt={boss.name}
                initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                animate={{
                  opacity: defeated ? 0.2 : 1,
                  scale: 1,
                  filter: defeated ? 'grayscale(100%) blur(4px)' : `drop-shadow(0 0 40px ${boss.color}cc) blur(0px)`,
                }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-full h-[420px] object-cover object-top relative z-10"
              />
            </AnimatePresence>

            {/* Boss name overlay on portrait */}
            <div
              className="absolute bottom-0 left-0 right-0 z-30 p-5"
              style={{ background: `linear-gradient(to top, ${boss.color}cc 0%, transparent 100%)` }}
            >
              <motion.p
                key={`name-${bossIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-orbitron text-4xl font-black uppercase tracking-widest text-white"
                style={{ textShadow: `0 0 30px ${boss.color}, 0 2px 4px rgba(0,0,0,0.9)` }}
              >
                {boss.name}
              </motion.p>
              <p className="font-space-mono text-xs tracking-[0.3em] uppercase mt-1" style={{ color: `${boss.color}cc` }}>
                {boss.desc}
              </p>
            </div>
          </div>

          {/* HP Bar */}
          <div
            className="p-5 space-y-3"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${boss.color}30` }}
          >
            <div className="flex justify-between items-center font-orbitron">
              <span className="text-white/40 text-xs uppercase tracking-[0.3em]">Health Points</span>
              <span className="font-bold tabular-nums" style={{ color: boss.color }}>
                {currentHP.toLocaleString()}
                <span className="text-white/20 font-normal"> / {MAX_HP.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full h-4 bg-black/60 relative overflow-hidden" style={{ border: `1px solid ${boss.color}30` }}>
              <motion.div
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                className="h-full relative"
                style={{
                  background: `linear-gradient(90deg, ${boss.color}66, ${boss.color})`,
                  boxShadow: `0 0 20px ${boss.color}99`,
                }}
              >
                {/* Animated shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', width: '60%' }}
                />
              </motion.div>
            </div>
            {/* Quest completion dots */}
            <div className="flex gap-2">
              {quests.map(q => (
                <motion.div
                  key={q.id}
                  animate={{ scale: q.completed ? [1, 1.4, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 h-1.5 rounded-full transition-colors duration-500"
                  style={{ background: q.completed ? boss.color : 'rgba(255,255,255,0.06)', boxShadow: q.completed ? `0 0 8px ${boss.color}` : 'none' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Quest List ── */}
        <div className="space-y-4">
          {/* Quest header */}
          <div className="flex items-center justify-between">
            <h2 className="font-orbitron text-2xl font-bold uppercase tracking-widest flex items-center gap-3 text-white">
              <Swords className="w-6 h-6" style={{ color: boss.color }} />
              Strike Objectives
              <span className="font-space-mono text-sm text-white/20 font-normal normal-case">
                {completedCount}/{quests.length}
              </span>
            </h2>
            <button
              onClick={handleReroll}
              disabled={cooldown > 0 || state.rerolls.count >= 3}
              className={`flex items-center gap-2 px-4 py-2.5 font-space-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                cooldown > 0 || state.rerolls.count >= 3
                  ? 'text-white/15 cursor-not-allowed'
                  : 'text-white/50 hover:text-white'
              }`}
              style={{
                border: `1px solid ${cooldown > 0 || state.rerolls.count >= 3 ? 'rgba(255,255,255,0.08)' : `${boss.color}50`}`,
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cooldown > 0 ? 'animate-spin' : ''}`} />
              {state.rerolls.count >= 3 ? 'No Rerolls' : cooldown > 0 ? `${cooldown}s` : `Reroll (${3 - state.rerolls.count} left)`}
            </button>
          </div>

          {/* Quests */}
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {quests.map((quest, idx) => {
                const color = CATEGORY_COLOR[quest.category] ?? '#ffffff';
                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={!quest.completed ? { x: 6, scale: 1.005 } : {}}
                    className={`relative overflow-hidden flex items-center justify-between gap-4 p-4 transition-all duration-200 group ${
                      quest.completed
                        ? 'opacity-30 grayscale cursor-default'
                        : 'cursor-pointer'
                    }`}
                    style={{
                      background: quest.completed ? 'rgba(0,0,0,0.3)' : `rgba(0,0,0,0.5)`,
                      borderLeft: `3px solid ${quest.completed ? 'rgba(255,255,255,0.05)' : color}`,
                      border: `1px solid ${quest.completed ? 'rgba(255,255,255,0.04)' : `${color}22`}`,
                      borderLeft: `3px solid ${quest.completed ? 'rgba(255,255,255,0.05)' : color}`,
                    }}
                    onClick={e => handleStrike(e, quest.id)}
                  >
                    {/* Hover glow */}
                    {!quest.completed && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: `radial-gradient(ellipse at left, ${color}12, transparent 70%)` }}
                      />
                    )}

                    {/* Strike flash */}
                    {!quest.completed && (
                      <div
                        className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-75 pointer-events-none"
                        style={{ background: `${color}22` }}
                      />
                    )}

                    <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
                      <span className="text-2xl flex-shrink-0 w-10 text-center">{quest.icon}</span>
                      <div className="min-w-0">
                        <p className={`font-archivo-narrow text-base leading-tight ${
                          quest.completed ? 'line-through text-white/30' : 'text-white group-hover:text-white'
                        }`}>
                          {quest.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5" style={{ color: `${color}88` }}>
                          {categoryIcon(quest.category)}
                          <span className="font-space-mono text-[10px] uppercase tracking-wider">{quest.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 flex-shrink-0 relative z-10">
                      <div className="text-right">
                        <div
                          className="font-orbitron font-bold text-sm"
                          style={{ color: quest.completed ? 'rgba(255,255,255,0.15)' : color }}
                        >
                          {quest.damage.toLocaleString()}
                          <span className="text-[10px] ml-1 font-normal opacity-70">DMG</span>
                        </div>
                        <div className="font-space-mono text-[10px] text-white/25">+{quest.xp} XP</div>
                      </div>
                      <div style={{ color: quest.completed ? 'rgba(255,255,255,0.2)' : color }}>
                        {quest.completed
                          ? <CheckSquare className="w-5 h-5" />
                          : <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Final Defeat Panel */}
      <AnimatePresence>
        {defeated && bossIndex === BOSSES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="relative z-10 mt-12 max-w-2xl mx-auto p-12 text-center"
            style={{
              border: `2px solid ${boss.color}`,
              background: `linear-gradient(135deg, ${boss.color}10, rgba(0,0,0,0.8))`,
              boxShadow: `0 0 80px ${boss.color}44, inset 0 0 40px ${boss.color}0d`,
            }}
          >
            <Zap className="w-16 h-16 mx-auto mb-5 animate-pulse" style={{ color: boss.color }} />
            <h2 className="font-orbitron text-4xl font-bold text-white uppercase tracking-widest mb-4"
              style={{ textShadow: `0 0 40px ${boss.color}` }}>
              Daniel Park Achieved
            </h2>
            <p className="font-space-mono text-sm uppercase tracking-[0.3em]" style={{ color: `${boss.color}cc` }}>
              You have forged the body. The system bows. The hunt continues.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

