import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Swords, CheckSquare, Square, Zap, RefreshCw, Flame, Dumbbell, Brain, Timer } from 'lucide-react';
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

function pickRandomQuests(n: number): BossQuest[] {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((q, i) => ({
    ...q,
    id: `q${i}_${Date.now()}`,
    completed: false,
  }));
}

export default function BossMode() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const { addLog } = useActivityLogs('fitness');

  const [bossIndex, setBossIndex] = useState(0);
  const [quests, setQuests] = useState<BossQuest[]>(() => pickRandomQuests(5));
  const [cooldown, setCooldown] = useState(0);
  const [defeated, setDefeated] = useState(false);

  const boss = BOSSES[bossIndex];
  const MAX_HP = boss.hp;

  const currentDamage = quests.filter(q => q.completed).reduce((sum, q) => sum + q.damage, 0);
  const currentHP = Math.max(0, MAX_HP - currentDamage);
  const hpPercent = (currentHP / MAX_HP) * 100;
  const completedCount = quests.filter(q => q.completed).length;

  // Boss defeated watcher
  useEffect(() => {
    if (currentHP === 0 && !defeated) {
      setDefeated(true);
      setTimeout(() => {
        toast.success(`BOSS DEFEATED: ${boss.name}!`, { duration: 5000, icon: '🏆' });
        triggerLevelUp();

        if (bossIndex < BOSSES.length - 1) {
          setTimeout(() => {
            const nextIndex = bossIndex + 1;
            setBossIndex(nextIndex);
            setQuests(pickRandomQuests(5));
            setDefeated(false);
            toast(`⚠️ New Threat: ${BOSSES[nextIndex].name}`, { duration: 4000 });
          }, 3000);
        }
      }, 1000);
    }
  }, [currentHP, defeated, boss.name, bossIndex, triggerLevelUp]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleReroll = () => {
    if (cooldown > 0) return;
    setQuests(pickRandomQuests(5));
    setDefeated(false);
    setCooldown(30);
    toast('New Quests Spawned!', { icon: '🎲' });
  };

  const handleStrike = (e: React.MouseEvent, questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed || defeated) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, quest.xp);

    // Log to Supabase (fire-and-forget)
    addLog(quest.title, 0, quest.xp, {}, [quest.category]).catch(console.error);

    toast(`⚔️ ${quest.icon} ${quest.damage.toLocaleString()} DMG`, { duration: 2500 });

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
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
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-10"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="font-space-mono text-xs text-[#ff003c]/60 tracking-[0.4em] uppercase">
          Class-S Threat Detected
        </p>
        <h1
          className="font-orbitron text-5xl md:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] to-[#8b0000]"
        >
          BOSS FIGHT
        </h1>
        <p className="font-space-mono text-sm tracking-[0.2em] uppercase" style={{ color: boss.color }}>
          {boss.desc}
        </p>
      </div>

      {/* Boss Visual + HP */}
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-3">
          <span className="font-orbitron text-xl font-bold uppercase tracking-widest" style={{ color: boss.color }}>
            {boss.name}
          </span>
          <span className="font-space-mono text-xs text-white/30 ml-3 uppercase">
            Stage {bossIndex + 1} / {BOSSES.length}
          </span>
        </div>

        <motion.div
          animate={defeated ? { opacity: 0, scale: 0.3, filter: 'blur(20px)' } : { y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: defeated ? 0 : Infinity, ease: 'easeInOut' }}
          className="relative inline-block mb-8"
        >
          <div className="absolute inset-0 rounded-full blur-[80px] opacity-25" style={{ background: boss.color }} />
          <Skull
            className="w-36 h-36 mx-auto relative z-10 transition-all duration-1000"
            style={{
              color: defeated ? 'rgba(255,255,255,0.08)' : boss.color,
              filter: defeated ? 'none' : `drop-shadow(0 0 24px ${boss.color})`,
            }}
          />
        </motion.div>

        {/* HP Bar */}
        <div className="glass-panel p-4 border" style={{ borderColor: `${boss.color}40` }}>
          <div className="flex justify-between font-orbitron font-bold mb-2 px-1">
            <span className="text-white/60 text-sm uppercase tracking-widest">HP</span>
            <span style={{ color: defeated ? 'rgba(255,255,255,0.2)' : boss.color }}>
              {currentHP.toLocaleString()} / {MAX_HP.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-5 bg-black border border-white/10 relative overflow-hidden">
            <motion.div
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="h-full"
              style={{
                background: `linear-gradient(to right, ${boss.color}66, ${boss.color})`,
                boxShadow: `0 0 16px ${boss.color}88`,
              }}
            />
          </div>
          {/* Segment dots */}
          <div className="flex gap-1.5 mt-2">
            {quests.map(q => (
              <div key={q.id} className="flex-1 h-1 rounded-full transition-colors duration-500"
                style={{ background: q.completed ? boss.color : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest flex items-center gap-2 text-white">
            <Swords className="w-5 h-5" style={{ color: boss.color }} />
            Strike Objectives
            <span className="font-space-mono text-xs text-white/30 ml-1 normal-case">
              {completedCount}/{quests.length}
            </span>
          </h2>
          <button
            onClick={handleReroll}
            disabled={cooldown > 0}
            className={`flex items-center gap-2 px-4 py-2 border font-space-mono text-xs uppercase tracking-widest transition-all ${
              cooldown > 0
                ? 'border-white/10 text-white/20 cursor-not-allowed'
                : 'border-white/20 text-white/60 hover:border-accent-blue hover:text-accent-blue'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `${cooldown}s` : 'Reroll'}
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {quests.map(quest => {
              const color = CATEGORY_COLOR[quest.category] ?? '#ffffff';
              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  whileHover={!quest.completed ? { x: 4 } : {}}
                  className={`glass-panel p-4 border-l-4 flex items-center justify-between transition-all duration-200 group relative overflow-hidden ${
                    quest.completed
                      ? 'border-l-white/10 opacity-35 grayscale cursor-default'
                      : 'cursor-pointer hover:bg-white/[0.02]'
                  }`}
                  style={!quest.completed ? { borderLeftColor: color } : {}}
                  onClick={e => handleStrike(e, quest.id)}
                >
                  {!quest.completed && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at left, ${color}0d, transparent 70%)` }}
                    />
                  )}

                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <span className="text-2xl flex-shrink-0">{quest.icon}</span>
                    <div className="min-w-0">
                      <p className={`font-archivo-narrow text-lg leading-tight ${quest.completed ? 'line-through text-white/40' : 'text-white'}`}>
                        {quest.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5" style={{ color: `${color}99` }}>
                        {categoryIcon(quest.category)}
                        <span className="font-space-mono text-[10px] uppercase tracking-wide">{quest.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 relative z-10 ml-4">
                    <div className="text-right">
                      <div className="font-space-mono font-bold text-sm" style={{ color: quest.completed ? 'rgba(255,255,255,0.2)' : color }}>
                        {quest.damage.toLocaleString()} DMG
                      </div>
                      <div className="font-space-mono text-xs text-white/30">+{quest.xp} XP</div>
                    </div>
                    <div style={{ color: quest.completed ? 'rgba(255,255,255,0.25)' : color }}>
                      {quest.completed
                        ? <CheckSquare className="w-6 h-6" />
                        : <Square className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Defeat Panel */}
      <AnimatePresence>
        {defeated && bossIndex === BOSSES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-3xl mx-auto p-10 border-2 text-center"
            style={{ borderColor: boss.color, background: `${boss.color}0d`, boxShadow: `0 0 60px ${boss.color}33` }}
          >
            <Zap className="w-14 h-14 mx-auto mb-4 animate-pulse" style={{ color: boss.color }} />
            <h2 className="font-orbitron text-3xl font-bold text-white uppercase tracking-widest mb-3">
              Daniel Park Achieved
            </h2>
            <p className="font-space-mono text-sm uppercase tracking-widest" style={{ color: boss.color }}>
              You have forged the body. The system bows. The hunt continues.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
