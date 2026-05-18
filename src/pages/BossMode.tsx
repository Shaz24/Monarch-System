import { useState, useEffect, useMemo, useRef } from 'react';
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
  duration?: number;
}

const QUEST_POOL: Omit<BossQuest, 'id' | 'completed'>[] = [
  { title: '100 Push-ups — No Mercy', category: 'strength', icon: '💪', xp: 120, damage: 1800, duration: 15 },
  { title: '200 Bodyweight Squats', category: 'strength', icon: '🦵', xp: 150, damage: 2000, duration: 20 },
  { title: '50 Pull-ups (any grip)', category: 'strength', icon: '🏋️', xp: 180, damage: 2500, duration: 15 },
  { title: '10-minute Plank Challenge', category: 'endurance', icon: '🧱', xp: 140, damage: 1900, duration: 10 },
  { title: '5KM Run — Sub 25 minutes', category: 'endurance', icon: '🏃', xp: 160, damage: 2200, duration: 25 },
  { title: '1000 Calf Raises (Park Protocol)', category: 'strength', icon: '🦶', xp: 100, damage: 1500, duration: 20 },
  { title: '3 Sets of Dips to Failure', category: 'strength', icon: '🤸', xp: 90, damage: 1200, duration: 10 },
  { title: '50 Burpees — Full Extension', category: 'endurance', icon: '⚡', xp: 130, damage: 1700, duration: 15 },
  { title: '200 Sit-ups — Lookism Style', category: 'strength', icon: '🔥', xp: 110, damage: 1600, duration: 15 },
  { title: '30-min Shadow Boxing', category: 'endurance', icon: '🥊', xp: 120, damage: 1700, duration: 30 },
  { title: 'Wall Sit — 5 minutes total', category: 'strength', icon: '🧗', xp: 80, damage: 1100, duration: 5 },
  { title: '100 Jump Squats — Explosive', category: 'endurance', icon: '💨', xp: 130, damage: 1800, duration: 15 },
  { title: 'Ice Cold Shower — No hesitation', category: 'discipline', icon: '🧊', xp: 60, damage: 800, duration: 5 },
  { title: 'Wake at 5AM — Protocol Active', category: 'discipline', icon: '🌅', xp: 80, damage: 1000, duration: 5 },
  { title: '1-Hour No-Phone Morning', category: 'discipline', icon: '📵', xp: 70, damage: 900, duration: 60 },
  { title: 'Meditate for 20 minutes', category: 'mind', icon: '🧘', xp: 60, damage: 800, duration: 20 },
  { title: 'Journal 3 pages — Full honesty', category: 'mind', icon: '📖', xp: 50, damage: 700, duration: 15 },
  { title: 'Eat Zero Processed Food today', category: 'discipline', icon: '🥗', xp: 90, damage: 1100, duration: 10 },
  { title: 'No Social Media for 12 hours', category: 'discipline', icon: '🚫', xp: 75, damage: 950, duration: 0 },
  { title: '1 Hour Deep Reading — No distractions', category: 'mind', icon: '📚', xp: 80, damage: 1000, duration: 60 },
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
  { name: 'Yu - The Boxer', hp: 20000, desc: 'ULTIMATE THREAT — Speed godlike, precision immaculate.', color: '#ff3333' },
  { name: 'Asta - The Wizard King', hp: 30000, desc: 'CLASS-S THREAT — Infinite willpower, physical unrivaled.', color: '#b30909' },
  { name: 'Toji Fushiguro', hp: 45000, desc: 'THE SORCERER KILLER — Unrivaled physical prowess, infinite willpower.', color: '#d62424', image: '/boss-5.jpg' },
  { name: 'Roronoa Zoro', hp: 60000, desc: 'THE GREATEST SWORDSMAN — Top-tier Haki mastery, unrivaled physical, immense speed.', color: '#00cc52', image: '/boss-6.jpg' },
  { name: 'The Shadow Monarch Sung Jinwoo', hp: 100000, desc: 'THE SHADOW MONARCH — God-tier Shadow Authority, overwhelming physical, immense agility, unyielding willpower.', color: '#9D4EDD', image: '/boss-7.jpg' },
  { name: 'Jin Mori', hp: 150000, desc: 'THE SUPREME GOD — Unmeasurable power, MFTL speed, supreme endurance, absolute willpower.', color: '#00d2ff', image: '/boss-8.jpg' },
  { name: 'Son Goku', hp: 250000, desc: 'THE HOPE OF THE UNIVERSE — Unmeasurable power, MFTL speed, supreme endurance, absolute willpower.', color: '#38b6ff', image: '/boss-9.jpg' },
];

function pickRandomQuests(n: number, excludeTitles: string[] = []): BossQuest[] {
  const available = QUEST_POOL.filter(q => !excludeTitles.includes(q.title));
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

      if (parsed.defeated && parsed.bossIndex < BOSSES.length - 1) {
        parsed.bossIndex = parsed.bossIndex + 1;
        parsed.bossDamage = 0;
        parsed.defeated = false;
        parsed.usedTitles = [];
        parsed.quests = pickRandomQuests(5);
      }

      return { ...defaultState, ...parsed, rerolls: parsed.rerolls, usedTitles: parsed.usedTitles ?? [] };
    } catch (e) {
      return defaultState;
    }
  }
  return defaultState;
};

export default function BossMode() {
  const { addXpParticle } = useUIStore();
  const { addLog } = useActivityLogs('fitness');

  const [state, setState] = useState<BossModeState>(loadState);
  const [cooldown, setCooldown] = useState(0);
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
  const [defeatedBossName, setDefeatedBossName] = useState('');
  const [defeatedBossColor, setDefeatedBossColor] = useState('');

  // Floating damage visual state
  const [floats, setFloats] = useState<{ id: string; x: number; y: number; dmg: number; isCrit: boolean }[]>([]);
  // Combat log terminal lines
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('monarchBossMode', JSON.stringify(state));
  }, [state]);

  const { bossIndex, quests, bossDamage, defeated, rerolls } = state;
  const boss = BOSSES[bossIndex];
  const MAX_HP = boss.hp;

  const currentHP = Math.max(0, MAX_HP - bossDamage);
  const hpPercent = (currentHP / MAX_HP) * 100;
  const completedCount = quests.filter(q => q.completed).length;

  // Auto scroll combat logs to bottom
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [combatLogs]);

  // Determine Class Tier designation based on boss tier / hp
  const threatTier = useMemo(() => {
    if (bossIndex < 3) return { name: 'C-CLASS', style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.2)]' };
    if (bossIndex < 6) return { name: 'B-CLASS', style: 'text-accent-blue border-accent-blue/30 bg-accent-blue/10 shadow-[0_0_8px_rgba(0,212,255,0.2)]' };
    if (bossIndex < 8) return { name: 'A-CLASS', style: 'text-accent-purple border-accent-purple/30 bg-accent-purple/10 shadow-[0_0_8px_rgba(123,47,255,0.2)]' };
    return { name: 'S-CLASS', style: 'text-[#ff003c] border-[#ff003c]/40 bg-[#ff003c]/10 shadow-[0_0_12px_rgba(255,0,60,0.3)] animate-pulse' };
  }, [bossIndex]);

  const handleCloseVictoryOverlay = () => {
    setShowVictoryOverlay(false);
    if (bossIndex < BOSSES.length - 1) {
      setState(s => ({
        ...s,
        bossIndex: s.bossIndex + 1,
        bossDamage: 0,
        defeated: false,
        usedTitles: [],
        quests: pickRandomQuests(5),
      }));
      setCombatLogs(prev => [...prev, `[SYSTEM]: Advanced to next zone. Target locked.`]);
      toast(`⚠️ New Threat: ${BOSSES[bossIndex + 1].name}`, { duration: 4000 });
    }
  };

  // Boss defeated watcher
  useEffect(() => {
    if (currentHP === 0 && !defeated) {
      setState(s => ({ ...s, defeated: true }));
      setDefeatedBossName(boss.name);
      setDefeatedBossColor(boss.color);
      setCombatLogs(prev => [...prev, `[SYSTEM]: FATAL IMPACT DEALT. THREAT ELIMINATED.`]);
      setTimeout(() => {
        toast.success(`BOSS DEFEATED: ${boss.name}!`, { duration: 5000, icon: '🏆' });
        setShowVictoryOverlay(true);
      }, 1000);
    }
  }, [currentHP, defeated, boss.name]);

  // Auto-reroll when all quests completed but boss still alive
  useEffect(() => {
    if (completedCount === quests.length && quests.length > 0 && !defeated) {
      const t = setTimeout(() => {
        setState(s => ({
          ...s,
          quests: pickRandomQuests(5, s.usedTitles),
        }));
        setCombatLogs(prev => [...prev, `[SYSTEM]: Objectives exhausted. Spawning reinforcement targets...`]);
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
    setCombatLogs(prev => [...prev, `[SYSTEM]: Strategic tactical reload complete. Quests cycled.`]);
    toast(`New Quests Spawned! (${2 - rerolls.count} rerolls left)`, { icon: '🎲' });
  };

  const handleStrike = (e: React.MouseEvent, questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed || defeated) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, quest.xp);

    // Calculate mouse click offset local to the parent card
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Visual critical roll
    const isCrit = Math.random() > 0.65;
    const finalDamage = isCrit ? Math.round(quest.damage * 1.5) : quest.damage;

    // Append floating popup object
    const newFloat = {
      id: `f_${Date.now()}_${Math.random()}`,
      x: clickX,
      y: clickY,
      dmg: finalDamage,
      isCrit
    };
    setFloats(prev => [...prev, newFloat]);

    // Cleanup float after animation ends
    setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== newFloat.id));
    }, 1000);

    // Add log to terminal
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const message = `[${time}] HUNTER deals ${finalDamage.toLocaleString()} DMG via [${quest.title.toUpperCase()}]${isCrit ? ' - CRITICAL HIT!' : ''}`;
    setCombatLogs(prev => [...prev, message]);

    // Map quest category to unified activity log category
    const mapQuestCategoryToActivityCategory = (questCat: string): 'fitness' | 'mind' => {
      if (questCat === 'strength' || questCat === 'endurance') {
        return 'fitness';
      }
      return 'mind';
    };

    const targetCat = mapQuestCategoryToActivityCategory(quest.category);
    const durationMins = quest.duration ?? 0;

    // Log with correct category and duration
    addLog(quest.title, durationMins, quest.xp, { isBossQuest: true }, [quest.category], targetCat).catch(console.error);

    toast(`⚔️ ${quest.icon} ${finalDamage.toLocaleString()} DMG`, { duration: 2500 });

    setState(s => ({
      ...s,
      bossDamage: s.bossDamage + quest.damage, // maintain original state increment
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
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-screen p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-8"
    >
      {/* ── ATMOSPHERIC RED-NEON FOG-DRIFT VECTORS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-void">
        {/* Animated matrix grid lines */}
        <div 
          className="absolute inset-0 opacity-[6%]" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,0,60,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.2) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
        {/* Fog drift orbs */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full filter blur-[150px] opacity-[8%] -top-40 -left-40 animate-[fog-drift_25s_infinite_alternate]"
          style={{ background: 'radial-gradient(circle, #ff003c 0%, transparent 80%)' }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-[6%] bottom-10 right-10 animate-[fog-drift_20s_infinite_alternate_reverse]"
          style={{ background: 'radial-gradient(circle, #7B2FFF 0%, transparent 80%)' }}
        />
      </div>

      {/* Page header */}
      <div className="relative z-10 text-center mb-6">
        <p className="font-space-mono text-xs text-[#ff003c] tracking-[0.5em] uppercase mb-2 font-bold animate-pulse">
          ⚠ Class-S Threat Detected ⚠
        </p>
        <h1 className="font-orbitron text-6xl md:text-8xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] via-[#cc0028] to-[#4d0010] drop-shadow-[0_0_20px_rgba(255,0,60,0.25)]">
          BOSS FIGHT
        </h1>
      </div>

      {/* Two-column hero: Boss card + Quest list */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

        {/* ── LEFT: Boss Card with battle-scarred corner cutouts ── */}
        <div className="space-y-6">
          
          {/* Boss portrait with custom geometric clipping */}
          <div
            className="relative overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ 
              border: `1px solid ${boss.color}40`, 
              background: 'rgba(0,0,0,0.6)',
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' 
            }}
          >
            {/* Pulsing red warning overlay */}
            <div className="absolute inset-0 bg-[#ff003c]/5 pointer-events-none z-20 animate-[pulse-border_3s_infinite]" />

            {/* Glowing threat class badge upper right */}
            <div className={`absolute top-4 right-4 z-40 px-2.5 py-1 text-[10px] font-orbitron font-black tracking-widest border rounded select-none ${threatTier.style}`}>
              {threatTier.name}
            </div>

            {/* Scanline pattern */}
            <div
              className="absolute inset-0 z-20 pointer-events-none opacity-[0.08]"
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
                src={boss.image ?? `/boss-${bossIndex}.png`}
                alt={boss.name}
                initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                animate={{
                  opacity: defeated ? 0.2 : 1,
                  scale: 1,
                  filter: defeated ? 'grayscale(100%) blur(4px)' : `drop-shadow(0 0 40px ${boss.color}bb) blur(0px)`,
                }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-full h-[420px] object-cover object-top relative z-10"
              />
            </AnimatePresence>

            {/* Boss name overlay on portrait */}
            <div
              className="absolute bottom-0 left-0 right-0 z-30 p-5"
              style={{ background: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)` }}
            >
              <motion.p
                key={`name-${bossIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-orbitron text-3xl font-black uppercase tracking-widest text-white"
                style={{ textShadow: `0 0 25px ${boss.color}, 0 2px 4px rgba(0,0,0,0.95)` }}
              >
                {boss.name}
              </motion.p>
              <p className="font-space-mono text-[10px] tracking-[0.25em] uppercase mt-1.5" style={{ color: `${boss.color}` }}>
                {boss.desc}
              </p>
            </div>
          </div>

          {/* HP Bar and completion dots */}
          <div
            className="p-5 space-y-4"
            style={{ 
              background: 'rgba(5,5,5,0.85)', 
              border: `1px solid ${boss.color}35`,
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)'
            }}
          >
            <div className="flex justify-between items-center font-orbitron">
              <span className="text-white/40 text-xs uppercase tracking-[0.3em]">Health Points</span>
              <span className="font-bold tabular-nums text-base" style={{ color: boss.color }}>
                {currentHP.toLocaleString()}
                <span className="text-white/20 font-normal text-xs"> / {MAX_HP.toLocaleString()}</span>
              </span>
            </div>

            {/* HP container bar with low-hp warnings */}
            <div className={`w-full h-5 bg-black/60 relative overflow-hidden border transition-all duration-300 ${
              hpPercent < 25 ? 'border-[#ff003c] animate-pulse shadow-[0_0_10px_#ff003c]' : `border-${boss.color}/20`
            }`} style={{ borderColor: hpPercent < 25 ? '#ff003c' : `${boss.color}30` }}>
              
              <motion.div
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                className="h-full relative"
                style={{
                  background: hpPercent < 25 
                    ? 'linear-gradient(90deg, #ff003c, #b30909)' 
                    : `linear-gradient(90deg, ${boss.color}77, ${boss.color})`,
                  boxShadow: `0 0 20px ${boss.color}cc`,
                }}
              >
                {/* Animated shimmer sweep */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', width: '60%' }}
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
                  style={{ 
                    background: q.completed ? boss.color : 'rgba(255,255,255,0.06)', 
                    boxShadow: q.completed ? `0 0 10px ${boss.color}` : 'none' 
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Quest List ── */}
        <div className="space-y-6">
          
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

          {/* Quests with Floating popups overlay anchor wrapper */}
          <div className="space-y-3 relative">
            
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
                    whileHover={!quest.completed ? { x: 8, scale: 1.005 } : {}}
                    className={`relative overflow-hidden flex items-center justify-between gap-4 p-4.5 transition-all duration-200 group ${
                      quest.completed
                        ? 'opacity-30 grayscale cursor-default'
                        : 'cursor-pointer active:scale-[0.99]'
                    }`}
                    style={{
                      background: quest.completed ? 'rgba(0,0,0,0.35)' : `rgba(0,0,0,0.6)`,
                      border: `1px solid ${quest.completed ? 'rgba(255,255,255,0.03)' : `${color}25`}`,
                      borderLeft: `4px solid ${quest.completed ? 'rgba(255,255,255,0.1)' : color}`,
                      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
                    }}
                    onClick={e => handleStrike(e, quest.id)}
                  >
                    {/* Floating Damage Text popups local to the clicked quest container */}
                    <AnimatePresence>
                      {floats.map(f => (
                        <motion.span
                          key={f.id}
                          initial={{ opacity: 1, y: f.y, x: f.x, scale: f.isCrit ? 1.5 : 1 }}
                          animate={{ opacity: 0, y: f.y - 80, scale: f.isCrit ? 1.8 : 1.1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`absolute z-[100] font-orbitron font-black pointer-events-none select-none tracking-wider ${
                            f.isCrit ? 'text-[#ff003c] text-lg font-black drop-shadow-[0_0_10px_#ff003c]' : 'text-[#ff5a00] text-sm'
                          }`}
                        >
                          {f.isCrit ? 'CRITICAL HIT! ' : ''}-{f.dmg.toLocaleString()} DMG
                        </motion.span>
                      ))}
                    </AnimatePresence>

                    {/* Hover glow highlight */}
                    {!quest.completed && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: `radial-gradient(ellipse at left, ${color}15, transparent 70%)` }}
                      />
                    )}

                    <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
                      <span className="text-2xl flex-shrink-0 w-10 text-center">{quest.icon}</span>
                      <div className="min-w-0">
                        <p className={`font-archivo-narrow text-base leading-tight font-bold ${
                          quest.completed ? 'line-through text-white/30 font-normal' : 'text-white'
                        }`}>
                          {quest.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5" style={{ color: `${color}cc` }}>
                          {categoryIcon(quest.category)}
                          <span className="font-space-mono text-[9px] uppercase tracking-wider font-bold">{quest.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 flex-shrink-0 relative z-10 font-space-mono">
                      <div className="text-right">
                        <div
                          className="font-orbitron font-black text-sm"
                          style={{ color: quest.completed ? 'rgba(255,255,255,0.15)' : color }}
                        >
                          {quest.damage.toLocaleString()}
                          <span className="text-[9px] ml-1 font-normal opacity-70 font-space-mono">DMG</span>
                        </div>
                        <div className="text-[10px] text-white/35">+{quest.xp} XP</div>
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

          {/* ── NEW: Tactical Combat Log Terminal ── */}
          <div className="glass-panel p-4 bg-black/90 border border-white/5 rounded relative overflow-hidden font-space-mono">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-accent-blue/40 to-transparent" />
            <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
              <span>SYSTEM LOG PROTOCOL</span>
              <span className="text-accent-blue font-bold">TERMINAL CONNECTED</span>
            </div>
            
            <div 
              ref={logTerminalRef}
              className="h-28 overflow-y-auto space-y-1.5 text-[10.5px] leading-relaxed text-zinc-400 select-text scrollbar-thin"
            >
              {combatLogs.length === 0 ? (
                <div className="text-white/20 italic">[Awaiting confrontation actions. Core system online.]</div>
              ) : (
                combatLogs.map((logLine, lIdx) => (
                  <div key={lIdx} className="hover:text-white transition-colors duration-100">
                    <span className="text-[#ff003c] mr-1.5">»</span>{logLine}
                  </div>
                ))
              )}
            </div>
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
              {boss.name} Conquered
            </h2>
            <p className="font-space-mono text-sm uppercase tracking-[0.3em]" style={{ color: `${boss.color}cc` }}>
              You have achieved the ultimate form. The system bows. The hunt continues.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CUSTOM ENHANCED BOSS DEFEATED OVERLAY ── */}
      <AnimatePresence>
        {showVictoryOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden pointer-events-auto"
          >
            <div className="absolute inset-0 bg-scanline-pattern opacity-30 pointer-events-none" />
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${defeatedBossColor}44 0%, transparent 70%)`
              }}
            />

            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-[600px] h-[600px] rounded-full filter blur-[120px]"
              style={{ background: `radial-gradient(circle, ${defeatedBossColor} 0%, transparent 70%)` }}
            />

            {/* Dynamic laser slash lines */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute h-1 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-45 z-10"
              style={{ boxShadow: `0 0 30px 10px ${defeatedBossColor}` }}
            />
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.8, delay: 0.25, ease: "easeInOut" }}
              className="absolute h-1 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-45 z-10"
              style={{ boxShadow: `0 0 30px 10px ${defeatedBossColor}` }}
            />

            {/* Rising particle stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                    y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
                    scale: Math.random() * 0.6 + 0.4,
                    opacity: 0
                  }}
                  animate={{ 
                    y: -100, 
                    opacity: [0, 1, 1, 0],
                    x: `calc(10px + ${Math.sin(i) * 50}px)`
                  }}
                  transition={{ 
                    duration: Math.random() * 3 + 2, 
                    repeat: Infinity,
                    delay: Math.random() * 2 
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: defeatedBossColor }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.7, y: 80, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.3 }}
              className="relative max-w-xl w-full mx-4 p-8 md:p-12 text-center rounded-2xl border"
              style={{
                background: 'rgba(5, 5, 5, 0.9)',
                borderColor: `${defeatedBossColor}33`,
                boxShadow: `0 0 50px ${defeatedBossColor}22`
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-6 border border-dashed rounded-full opacity-20 pointer-events-none"
                style={{ borderColor: defeatedBossColor }}
              />

              <div className="relative mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-black border-2"
                  style={{ borderColor: defeatedBossColor, boxShadow: `0 0 20px ${defeatedBossColor}44` }}
                >
                  <Swords className="w-10 h-10" style={{ color: defeatedBossColor }} />
                </motion.div>
              </div>

              <h2 
                className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider mb-2 text-white"
                style={{ textShadow: `0 0 30px ${defeatedBossColor}` }}
              >
                THREAT ELIMINATED
              </h2>

              <p className="font-space-mono text-sm tracking-[0.2em] text-white/50 uppercase mb-8">
                Target Code: <span style={{ color: defeatedBossColor }}>{defeatedBossName}</span>
              </p>

              <div className="bg-black/60 border border-white/5 rounded-lg p-6 mb-8 text-left space-y-4 font-space-mono">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/40 text-xs uppercase">Confrontation Status</span>
                  <span className="text-emerald-400 text-xs uppercase font-bold">100% COMPLETE</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/40 text-xs uppercase">Tactical Rewards Gained</span>
                  <span className="text-white text-xs font-bold font-orbitron">+2,500 XP / ALL STATS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs uppercase">Sector Status</span>
                  <span className="text-xs font-bold" style={{ color: defeatedBossColor }}>
                    {bossIndex < BOSSES.length - 1 ? "NEXT ZONE UNLOCKED" : "ALL BOSSES CONQUERED"}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-lg font-orbitron font-bold uppercase tracking-wider text-black text-sm transition-all duration-300 pointer-events-auto cursor-pointer"
                style={{ 
                  background: `linear-gradient(90deg, #ffffff, ${defeatedBossColor})` 
                }}
                onClick={handleCloseVictoryOverlay}
              >
                {bossIndex < BOSSES.length - 1 ? "Commence Next Sector" : "Claim Ultimate Victory"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
