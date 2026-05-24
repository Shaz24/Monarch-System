import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, CheckSquare, Square, Zap, RefreshCw, Flame, Dumbbell, Brain, Timer, 
  Heart, Coins, Shield, Sparkles, Users, Skull, ShoppingBag, AlertCircle 
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { sounds } from '../lib/sound';
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

const DIFFICULTY_SETTINGS = {
  easy: { name: 'EASY', desc: 'No counterattacks. Standard drops.', mult: 1.0, xpMult: 1.0, counter: 0.0, dmg: 0, goldMult: 1.0, dropChance: 0.1 },
  hard: { name: 'HARD', desc: '15% counter (10 dmg). +25% Gold.', mult: 1.5, xpMult: 1.5, counter: 0.15, dmg: 10, goldMult: 1.25, dropChance: 0.35 },
  nightmare: { name: 'NIGHTMARE', desc: '30% counter (20 dmg). +50% Gold.', mult: 2.0, xpMult: 2.0, counter: 0.30, dmg: 20, goldMult: 1.5, dropChance: 0.65 },
  monarch: { name: 'MONARCH', desc: '50% counter (40 dmg). +100% Gold.', mult: 3.0, xpMult: 3.0, counter: 0.50, dmg: 40, goldMult: 2.0, dropChance: 1.0 }
};

const INVENTORY_ITEMS = {
  elixir_life: { name: 'Elixir of Life', desc: 'Restores 50 Hunter HP instantly.', icon: '🧪', cost: 120 },
  discipline_scroll: { name: 'Discipline Scroll', desc: 'Deals 50,000 DMG to World Boss.', icon: '📜', cost: 400 },
  raid_shield: { name: 'Raid Shield', desc: 'Equip to block 3 boss counterattacks.', icon: '🛡️', cost: 250 },
  focus_potion: { name: 'Focus Potion', desc: 'Doubles the damage of your next strike.', icon: '⚡', cost: 300 },
  loot_box: { name: 'Shadow Loot Chest', desc: 'Contains random items or massive Gold.', icon: '📦', cost: 0 },
  loot_key: { name: 'Shadow Key', desc: 'Used to unlock a Shadow Loot Chest.', icon: '🔑', cost: 80 }
};

const SHADOW_UNITS = {
  infantry: { name: 'Shadow Infantry', desc: 'Basic soldier raised from the grave.', dps: 5, cost: 250, icon: '🛡️' },
  knight: { name: 'Shadow Knight', desc: 'Armored knight with heavy blade.', dps: 20, cost: 750, icon: '⚔️' },
  healer: { name: 'Shadow Healer', desc: 'Support unit that heals Player +2 HP/sec.', hps: 2, cost: 1200, icon: '💚' },
  general: { name: 'Shadow General', desc: 'Legendary commander dealing 100 DPS.', dps: 100, cost: 4000, icon: '👑' }
};

const WORLD_BOSS_POOL = [
  { 
    name: 'Antares', 
    sub: 'THE DRAGON EMPEROR', 
    maxHp: 1000000, 
    desc: 'The Monarch of Destruction, ruler of the Shadow Army\'s greatest rival force.',
    color: '#ff003c',
    series: 'Solo Leveling'
  },
  { 
    name: 'Frieza', 
    sub: 'THE GALACTIC TYRANT', 
    maxHp: 1200000, 
    desc: 'Ruler of the galactic empire, ruthless, cold-blooded, and capable of multiple bio-transformations.',
    color: '#b829e3',
    series: 'Dragon Ball'
  },
  { 
    name: 'Sukuna', 
    sub: 'THE KING OF CURSES', 
    maxHp: 900000, 
    desc: 'A deadly imaginary demon who existed one thousand years ago, now reincarnated in modern times.',
    color: '#e23636',
    series: 'Jujutsu Kaisen'
  },
  { 
    name: 'Mujin Park', 
    sub: 'THE SUPREME GOD', 
    maxHp: 1500000, 
    desc: 'A divine god who possesses the powers of Tathagata, aiming to rewrite human society.',
    color: '#00d2ff',
    series: 'God of HighSchool'
  },
  { 
    name: 'Charles Choi', 
    sub: 'THE ELITE', 
    maxHp: 800000, 
    desc: 'The mastermind behind HNH Group and the creator of the Ten Genius network.',
    color: '#ff5a00',
    series: 'Lookism'
  },
  { 
    name: 'Zero', 
    sub: 'THE NIGHTMARE CREATOR', 
    maxHp: 1100000, 
    desc: 'The mysterious supreme entity bringing structural imbalance to the Lucid Adventure.',
    color: '#7B2FFF',
    series: 'Hardcore Leveling Warrior'
  },
  { 
    name: 'Madara Uchiha', 
    sub: 'THE GHOST OF UCHIHA', 
    maxHp: 1300000, 
    desc: 'Legendary leader of the Uchiha clan who summoned the Infinite Tsukuyomi.',
    color: '#ff004f',
    series: 'Naruto'
  },
  { 
    name: 'Aizen Sosuke', 
    sub: 'THE SHINIGAMI TRAITOR', 
    maxHp: 1400000, 
    desc: 'Genius soul reaper captain who betrayed the Soul Society to attain godhood using the Hogyoku.',
    color: '#7b828a',
    series: 'Bleach'
  }
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
  
  // Gamified enhancements
  activeTab: 'active' | 'world' | 'army' | 'inventory';
  difficulty: 'easy' | 'hard' | 'nightmare' | 'monarch';
  playerHp: number;
  gold: number;
  inventory: Record<string, number>;
  shadowArmy: { infantry: number; knight: number; healer: number; general: number };
  worldBossHp: number;
  worldBossDefeated: boolean;
  lastDpsTick: number;

  // Weekly World Boss randomization fields
  worldBossIndex: number;
  worldBossWeekId: string;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getWeekIdString = () => {
  const d = new Date();
  const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tempDate.getUTCFullYear()}-W${weekNo}`;
};

const loadState = (): BossModeState => {
  const defaultState: BossModeState = {
    bossIndex: 0,
    quests: pickRandomQuests(5),
    bossDamage: 0,
    defeated: false,
    rerolls: { date: getTodayDateString(), count: 0 },
    usedTitles: [],
    
    // Gamified enhancements defaults
    activeTab: 'active',
    difficulty: 'easy',
    playerHp: 100,
    gold: 500,
    inventory: { elixir_life: 2, loot_box: 1, loot_key: 1 },
    shadowArmy: { infantry: 0, knight: 0, healer: 0, general: 0 },
    worldBossHp: 1000000,
    worldBossDefeated: false,
    lastDpsTick: Date.now(),

    // Weekly boss details
    worldBossIndex: 0,
    worldBossWeekId: getWeekIdString(),
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

      const currentWeekId = getWeekIdString();
      let worldBossIndex = parsed.worldBossIndex ?? 0;
      let worldBossHp = parsed.worldBossHp ?? 1000000;
      let worldBossDefeated = parsed.worldBossDefeated ?? false;
      let worldBossWeekId = parsed.worldBossWeekId ?? currentWeekId;

      // Weekly Reset Trigger
      if (worldBossWeekId !== currentWeekId) {
        const previousIndex = worldBossIndex;
        let newIndex = Math.floor(Math.random() * WORLD_BOSS_POOL.length);
        if (WORLD_BOSS_POOL.length > 1 && newIndex === previousIndex) {
          newIndex = (newIndex + 1) % WORLD_BOSS_POOL.length;
        }
        
        worldBossIndex = newIndex;
        worldBossHp = WORLD_BOSS_POOL[newIndex].maxHp;
        worldBossDefeated = false;
        worldBossWeekId = currentWeekId;
      }

      return { 
        ...defaultState, 
        ...parsed, 
        rerolls: parsed.rerolls, 
        usedTitles: parsed.usedTitles ?? [],
        activeTab: parsed.activeTab ?? 'active',
        difficulty: parsed.difficulty ?? 'easy',
        playerHp: parsed.playerHp ?? 100,
        gold: parsed.gold ?? 500,
        inventory: parsed.inventory ?? { elixir_life: 2, loot_box: 1, loot_key: 1 },
        shadowArmy: parsed.shadowArmy ?? { infantry: 0, knight: 0, healer: 0, general: 0 },
        worldBossHp,
        worldBossDefeated,
        lastDpsTick: parsed.lastDpsTick ?? Date.now(),
        worldBossIndex,
        worldBossWeekId,
      };
    } catch (e) {
      return defaultState;
    }
  }
  return defaultState;
};

export default function BossMode() {
  const { addXpParticle } = useUIStore();
  const { addLog } = useActivityLogs('fitness');

  const [state, setState] = useState<BossModeState>(() => {
    const loaded = loadState();
    // Add default values for new variables if missing
    return {
      ...loaded,
      shieldCharges: (loaded as any).shieldCharges ?? 0,
      focusCharges: (loaded as any).focusCharges ?? 0,
    };
  });
  
  const [cooldown, setCooldown] = useState(0);
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
  const [defeatedBossName, setDefeatedBossName] = useState('');
  const [defeatedBossColor, setDefeatedBossColor] = useState('');

  // Floating damage visual state
  const [floats, setFloats] = useState<{ id: string; x: number; y: number; dmg: number; isCrit: boolean }[]>([]);
  // Combat log terminal lines
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);
  const processingQuestsRef = useRef<Set<string>>(new Set());

  // Debounced localStorage save — 500ms after last state change to avoid thrashing on rapid clicks
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem('monarchBossMode', JSON.stringify(state));
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state]);

  const { 
    bossIndex, quests, bossDamage, defeated, rerolls,
    activeTab, difficulty, playerHp, gold, inventory,
    shadowArmy, worldBossHp, worldBossDefeated, worldBossIndex
  } = state;

  const activeWorldBoss = WORLD_BOSS_POOL[worldBossIndex ?? 0] ?? WORLD_BOSS_POOL[0];
  
  const shieldCharges = (state as any).shieldCharges ?? 0;
  const focusCharges = (state as any).focusCharges ?? 0;

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

  // Passive World Boss damage & healing tick
  useEffect(() => {
    const interval = setInterval(() => {
      setState(s => {
        const dps = (s.shadowArmy.infantry || 0) * 5 + (s.shadowArmy.knight || 0) * 20 + (s.shadowArmy.general || 0) * 100;
        const hps = (s.shadowArmy.healer || 0) * 2;

        // Early return — nothing to do when army is idle and boss is already defeated
        if (dps === 0 && hps === 0 && s.worldBossDefeated) return s;
        if (s.worldBossDefeated && s.playerHp >= 100) return s;

        const now = Date.now();
        const seconds = Math.max(1, Math.floor((now - s.lastDpsTick) / 1000));

        const totalDmg = dps * seconds;
        const totalHeal = hps * seconds;

        const nextWorldHp = Math.max(0, s.worldBossHp - totalDmg);
        const nextPlayerHp = Math.min(100, s.playerHp + totalHeal);
        const isDefeatedNow = nextWorldHp === 0 && !s.worldBossDefeated;

        const currentActiveBoss = WORLD_BOSS_POOL[s.worldBossIndex ?? 0] ?? WORLD_BOSS_POOL[0];
        let finalGold = s.gold;
        if (isDefeatedNow) {
          finalGold += 5000;
          sounds.playFanfare();
          setCombatLogs(prev => {
            const next = [...prev, `[SYSTEM]: WORLD BOSS ${currentActiveBoss.name.toUpperCase()} DEFEATED! Gained +5,000 Gold!`];
            return next.length > 100 ? next.slice(-100) : next;
          });
          toast.success(`World Boss ${currentActiveBoss.name} Defeated! +5,000 Gold!`, { duration: 5000 });
        }

        if (dps > 0 && Math.random() < 0.1) {
          setCombatLogs(prev => {
            const next = [...prev, `[ARMY]: Shadow soldiers deal ${totalDmg.toLocaleString()} DMG to Weekly Boss ${currentActiveBoss.name}.`];
            return next.length > 100 ? next.slice(-100) : next;
          });
        }
        if (hps > 0 && s.playerHp < 100 && Math.random() < 0.1) {
          setCombatLogs(prev => {
            const next = [...prev, `[ARMY]: Healers restore +${totalHeal} HP to player.`];
            return next.length > 100 ? next.slice(-100) : next;
          });
        }

        return {
          ...s,
          worldBossHp: nextWorldHp,
          playerHp: nextPlayerHp,
          worldBossDefeated: isDefeatedNow ? true : s.worldBossDefeated,
          gold: finalGold,
          lastDpsTick: now
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      setState(s => {
        // Drop chest on Daily Boss defeat
        const diffSettings = DIFFICULTY_SETTINGS[s.difficulty || 'easy'];
        const dropBox = Math.random() < diffSettings.dropChance;
        const dropKey = Math.random() < (diffSettings.dropChance * 0.8);
        const updatedInventory = { ...s.inventory };
        
        let dropMsg = '';
        if (dropBox) {
          updatedInventory.loot_box = (updatedInventory.loot_box || 0) + 1;
          dropMsg += '📦 Shadow Loot Chest ';
        }
        if (dropKey) {
          updatedInventory.loot_key = (updatedInventory.loot_key || 0) + 1;
          dropMsg += '🔑 Shadow Key ';
        }

        const victoryGold = Math.round(boss.hp * 0.08 * diffSettings.goldMult);

        if (dropMsg) {
          setCombatLogs(prev => [...prev, `[Loot]: Found ${dropMsg}!`]);
        }
        setCombatLogs(prev => [...prev, `[SYSTEM]: FATAL IMPACT DEALT. THREAT ELIMINATED.`]);

        setTimeout(() => {
          sounds.playFanfare();
          toast.success(`BOSS DEFEATED: ${boss.name}!`, { duration: 5000, icon: '🏆' });
          setShowVictoryOverlay(true);
        }, 1000);

        return { 
          ...s, 
          defeated: true,
          gold: s.gold + victoryGold,
          inventory: updatedInventory
        };
      });
      setDefeatedBossName(boss.name);
      setDefeatedBossColor(boss.color);
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
    if (playerHp <= 0) {
      sounds.playBeep();
      toast.error('You are fainted! Revive or use an Elixir to continue fighting.', { icon: '💀' });
      return;
    }

    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed || defeated || processingQuestsRef.current.has(questId)) return;
    processingQuestsRef.current.add(questId);

    const diffSettings = DIFFICULTY_SETTINGS[difficulty || 'easy'];

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, Math.round(quest.xp * diffSettings.xpMult));

    // Calculate mouse click offset local to the parent quest list wrapper
    const listEl = document.getElementById('boss-quest-list');
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;
    if (listEl) {
      const listRect = listEl.getBoundingClientRect();
      clickX = e.clientX - listRect.left;
      clickY = e.clientY - listRect.top;
    }

    // Visual critical roll
    const isCrit = Math.random() > 0.65;
    let baseDmg = isCrit ? Math.round(quest.damage * 1.5) : quest.damage;
    baseDmg = Math.round(baseDmg * diffSettings.mult);

    // Apply Focus Potion boost
    const damageMultiplier = focusCharges > 0 ? 2 : 1;
    const finalDamage = baseDmg * damageMultiplier;

    // Append floating popup object
    const newFloat = {
      id: `f_${Date.now()}_${Math.random()}`,
      x: clickX,
      y: clickY,
      dmg: finalDamage,
      isCrit: isCrit || focusCharges > 0
    };
    setFloats(prev => [...prev, newFloat]);

    // Cleanup float after animation ends
    setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== newFloat.id));
    }, 1000);

    // Add log to terminal
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let message = `[${time}] HUNTER deals ${finalDamage.toLocaleString()} DMG via [${quest.title.toUpperCase()}]`;
    if (isCrit) message += ' - CRITICAL HIT!';
    if (focusCharges > 0) message += ' - Focus Potion Boosted (2x)!';
    setCombatLogs(prev => [...prev, message]);

    // Calculate drop rate
    const dropBox = Math.random() < diffSettings.dropChance;
    const dropKey = Math.random() < (diffSettings.dropChance * 0.7);
    const goldGained = Math.round(quest.xp * 0.4 * diffSettings.goldMult);

    sounds.playBeep();

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
    addLog(quest.title, durationMins, Math.round(quest.xp * diffSettings.xpMult), { isBossQuest: true }, [quest.category], targetCat)
      .catch(err => {
        console.error('Failed to record boss fight activity:', err);
        processingQuestsRef.current.delete(questId);
        setState(s => ({
          ...s,
          quests: s.quests.map(q => q.id === questId ? { ...q, completed: false } : q)
        }));
      });

    toast(`⚔️ ${quest.icon} ${finalDamage.toLocaleString()} DMG`, { duration: 2500 });

    setState(s => {
      const updatedInventory = { ...s.inventory };
      let dropLog = '';
      if (dropBox) {
        updatedInventory.loot_box = (updatedInventory.loot_box || 0) + 1;
        dropLog += '📦 Chest ';
      }
      if (dropKey) {
        updatedInventory.loot_key = (updatedInventory.loot_key || 0) + 1;
        dropLog += '🔑 Key ';
      }

      if (dropLog) {
        setCombatLogs(prev => [...prev, `[Loot]: Drop captured! Received ${dropLog}`]);
      }

      // Check Boss Counterattack
      let nextPlayerHp = s.playerHp;
      let nextShieldCharges = (s as any).shieldCharges ?? 0;
      const isCounter = Math.random() < diffSettings.counter;

      if (isCounter && diffSettings.dmg) {
        if (nextShieldCharges > 0) {
          nextShieldCharges -= 1;
          setCombatLogs(prev => [...prev, `[SHIELD]: Boss counterattack blocked! Shield charges left: ${nextShieldCharges}`]);
          toast('🛡️ Counterattack Blocked!', { icon: '🛡️' });
        } else {
          nextPlayerHp = Math.max(0, s.playerHp - diffSettings.dmg);
          setCombatLogs(prev => [...prev, `[WARNING]: Boss counterattacked! Hunter took -${diffSettings.dmg} HP damage.`]);
          toast.error(`Took -${diffSettings.dmg} Damage!`, { icon: '💥' });
          if (nextPlayerHp <= 0) {
            setCombatLogs(prev => [...prev, `[FATAL]: HUNTER FAINTED. Revive required.`]);
            sounds.playBeep();
          }
        }
      }

      return {
        ...s,
        bossDamage: s.bossDamage + quest.damage,
        worldBossHp: Math.max(0, s.worldBossHp - finalDamage * 5), // Quests deal 5x damage to World Boss too!
        usedTitles: [...s.usedTitles, quest.title],
        quests: s.quests.map(q => q.id === questId ? { ...q, completed: true } : q),
        gold: s.gold + goldGained,
        inventory: updatedInventory,
        playerHp: nextPlayerHp,
        shieldCharges: nextShieldCharges,
        focusCharges: Math.max(0, focusCharges - 1),
      };
    });
  };

  // Revive protocol
  const handleRevive = () => {
    if (gold < 200) {
      toast.error('Need 200 Gold to revive!', { icon: '🚫' });
      return;
    }
    sounds.playChime();
    setCombatLogs(prev => [...prev, `[SYSTEM]: Revived hunter profile via Gold payment (-200 G).`]);
    setState(s => ({
      ...s,
      playerHp: 100,
      gold: s.gold - 200
    }));
    toast.success('Hunter fully revived!', { icon: '💖' });
  };

  // Buy Shop Items
  const buyShopItem = (itemKey: string, cost: number) => {
    if (gold < cost) {
      toast.error('Insufficient Gold!', { icon: '🚫' });
      return;
    }
    sounds.playChime();
    setCombatLogs(prev => [...prev, `[SHOP]: Purchased [${INVENTORY_ITEMS[itemKey as keyof typeof INVENTORY_ITEMS].name}] for ${cost} G.`]);
    setState(s => {
      const updatedInventory = { ...s.inventory };
      updatedInventory[itemKey] = (updatedInventory[itemKey] || 0) + 1;
      return {
        ...s,
        gold: s.gold - cost,
        inventory: updatedInventory
      };
    });
    toast.success(`Purchased ${INVENTORY_ITEMS[itemKey as keyof typeof INVENTORY_ITEMS].name}!`);
  };

  // Use Inventory Items
  const useInventoryItem = (itemKey: string) => {
    const count = inventory[itemKey] || 0;
    if (count <= 0) {
      toast.error('You do not own this item!', { icon: '🚫' });
      return;
    }

    sounds.playChime();
    setState(s => {
      const updatedInventory = { ...s.inventory };
      updatedInventory[itemKey] = count - 1;

      let nextPlayerHp = s.playerHp;
      let nextWorldBossHp = s.worldBossHp;
      let nextShieldCharges = (s as any).shieldCharges ?? 0;
      let nextFocusCharges = (s as any).focusCharges ?? 0;

      if (itemKey === 'elixir_life') {
        nextPlayerHp = Math.min(100, s.playerHp + 50);
        setCombatLogs(prev => [...prev, `[ITEMS]: Drank Elixir of Life. Restored +50 HP.`]);
        toast.success('Restored 50 HP!', { icon: '🧪' });
      } else if (itemKey === 'discipline_scroll') {
        const currentActiveBoss = WORLD_BOSS_POOL[s.worldBossIndex ?? 0] ?? WORLD_BOSS_POOL[0];
        nextWorldBossHp = Math.max(0, s.worldBossHp - 50000);
        setCombatLogs(prev => [...prev, `[ITEMS]: Activated Discipline Scroll! Dealt 50,000 DMG to World Boss ${currentActiveBoss.name}.`]);
        toast('📜 Dealt 50,000 DMG!', { icon: '💥' });
      } else if (itemKey === 'raid_shield') {
        nextShieldCharges = nextShieldCharges + 3;
        setCombatLogs(prev => [...prev, `[ITEMS]: Equipped Raid Shield! Grants protection for next 3 counterattacks.`]);
        toast('🛡️ Counter Protection Enabled!', { icon: '🛡️' });
      } else if (itemKey === 'focus_potion') {
        nextFocusCharges = nextFocusCharges + 1;
        setCombatLogs(prev => [...prev, `[ITEMS]: Drank Focus Potion! Next strike deals 2x damage.`]);
        toast('⚡ Next strike damage doubled!', { icon: '⚡' });
      }

      return {
        ...s,
        inventory: updatedInventory,
        playerHp: nextPlayerHp,
        worldBossHp: nextWorldBossHp,
        shieldCharges: nextShieldCharges,
        focusCharges: nextFocusCharges,
      };
    });
  };

  // Summon Shadow Soldiers
  const buyShadowSoldier = (unitKey: string, cost: number) => {
    if (gold < cost) {
      toast.error('Insufficient Gold to raise shadow!', { icon: '🚫' });
      return;
    }

    sounds.playChime();
    setCombatLogs(prev => [...prev, `[ARMY]: Summoned shadow soldier: [${SHADOW_UNITS[unitKey as keyof typeof SHADOW_UNITS].name}]. "ARISE!"`]);
    setState(s => {
      const updatedArmy = { ...s.shadowArmy };
      updatedArmy[unitKey as keyof typeof updatedArmy] = (updatedArmy[unitKey as keyof typeof updatedArmy] || 0) + 1;
      return {
        ...s,
        gold: s.gold - cost,
        shadowArmy: updatedArmy
      };
    });
    toast.success('Arise! Shadow summoned.', { icon: '👥' });
  };

  // Open loot boxes
  const handleOpenLootBox = () => {
    const boxes = inventory.loot_box || 0;
    const keys = inventory.loot_key || 0;

    if (boxes <= 0 || keys <= 0) {
      toast.error('Need both 1 Chest and 1 Key!', { icon: '🚫' });
      return;
    }

    sounds.playFanfare();
    setState(s => {
      const updatedInventory = { ...s.inventory };
      updatedInventory.loot_box = boxes - 1;
      updatedInventory.loot_key = keys - 1;

      // Roll rewards
      const roll = Math.random();
      let rewardsMsg = '';
      let addedGold = 0;

      if (roll < 0.3) {
        // High Gold drop
        addedGold = Math.floor(Math.random() * 600) + 400;
        rewardsMsg = `Gained ${addedGold} Gold!`;
      } else if (roll < 0.65) {
        // Life + Shield
        updatedInventory.elixir_life = (updatedInventory.elixir_life || 0) + 1;
        updatedInventory.raid_shield = (updatedInventory.raid_shield || 0) + 1;
        rewardsMsg = 'Received: 1x Elixir of Life, 1x Raid Shield!';
      } else if (roll < 0.9) {
        // Focus + Scroll
        updatedInventory.focus_potion = (updatedInventory.focus_potion || 0) + 1;
        updatedInventory.discipline_scroll = (updatedInventory.discipline_scroll || 0) + 1;
        rewardsMsg = 'Received: 1x Focus Potion, 1x Discipline Scroll!';
      } else {
        // Jack Pot!
        addedGold = 1000;
        updatedInventory.elixir_life = (updatedInventory.elixir_life || 0) + 2;
        updatedInventory.focus_potion = (updatedInventory.focus_potion || 0) + 1;
        rewardsMsg = 'JACKPOT! Received: 1,000 Gold, 2x Elixir of Life, 1x Focus Potion!';
      }

      setCombatLogs(prev => [...prev, `[LOOT]: Shadow Loot Chest opened! ${rewardsMsg}`]);
      toast.success('Loot Chest Unlocked!', { icon: '🎁' });

      return {
        ...s,
        inventory: updatedInventory,
        gold: s.gold + addedGold
      };
    });
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
      className="relative min-h-screen p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-8"
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
          style={{ background: 'radial-gradient(circle, #ff003c 0%, transparent 80%)', willChange: 'transform', transform: 'translateZ(0)' }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-[6%] bottom-10 right-10 animate-[fog-drift_20s_infinite_alternate_reverse]"
          style={{ background: 'radial-gradient(circle, #7B2FFF 0%, transparent 80%)', willChange: 'transform', transform: 'translateZ(0)' }}
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

      {/* Hunter Status Header Panel */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-black/85 p-5 border border-white/5 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Heart className={`w-6 h-6 ${playerHp < 35 ? 'text-[#ff003c] animate-pulse' : 'text-red-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest font-mono">
              <span>Hunter HP</span>
              <span className="font-bold text-white font-orbitron">{playerHp}/100</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-gradient-to-r from-[#ff003c] to-red-500 transition-all duration-300"
                style={{ width: `${playerHp}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Inventory Gold</div>
            <div className="text-xl font-orbitron font-black text-amber-400 mt-0.5">{gold.toLocaleString()} <span className="text-xs text-white/40 font-mono font-normal">G</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-950/40 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Active Buffs</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {shieldCharges > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-mono font-bold">
                  🛡️ SHIELD x{shieldCharges}
                </span>
              )}
              {focusCharges > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded font-mono font-bold">
                  ⚡ FOCUS x{focusCharges}
                </span>
              )}
              {shieldCharges === 0 && focusCharges === 0 && (
                <span className="text-[10px] text-white/20 italic font-mono">No active buffs</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-950/40 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Shadow Soldiers</div>
            <div className="text-xl font-orbitron font-black text-purple-400 mt-0.5">
              {Object.values(shadowArmy).reduce((a, b) => a + b, 0)}
              <span className="text-xs text-white/40 font-mono font-normal"> units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="relative z-10 flex border-b border-white/5 pb-0.5 gap-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'active', label: 'Active Sector', icon: <Swords className="w-4 h-4" /> },
          { id: 'world', label: 'World Raid', icon: <Skull className="w-4 h-4" /> },
          { id: 'army', label: 'Shadow Army', icon: <Users className="w-4 h-4" /> },
          { id: 'inventory', label: 'Loot & Bag', icon: <ShoppingBag className="w-4 h-4" /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              sounds.playBeep();
              setState(s => ({ ...s, activeTab: t.id as any }));
            }}
            className={`flex items-center gap-2 px-5 py-3 font-orbitron text-xs uppercase tracking-widest border-b-2 transition-all duration-200 flex-shrink-0 ${
              activeTab === t.id 
                ? 'border-[#ff003c] text-white bg-white/[0.02] shadow-[inset_0_-8px_16px_rgba(255,0,60,0.05)]' 
                : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Active Sector ── */}
      {activeTab === 'active' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
          {/* LEFT: Boss Card */}
          <div className="space-y-6">
            <div
              className="relative overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              style={{ 
                border: `1px solid ${boss.color}40`, 
                background: 'rgba(0,0,0,0.6)',
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' 
              }}
            >
              <div className="absolute inset-0 bg-[#ff003c]/5 pointer-events-none z-20 animate-[pulse-border_3s_infinite]" />

              <div className={`absolute top-4 right-4 z-40 px-2.5 py-1 text-[10px] font-orbitron font-black tracking-widest border rounded select-none ${threatTier.style}`}>
                {threatTier.name}
              </div>

              <div
                className="absolute inset-0 z-20 pointer-events-none opacity-[0.08]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
                }}
              />
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
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', width: '60%' }}
                  />
                </motion.div>
              </div>

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

            {/* Raid Difficulty Selector */}
            <div className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono space-y-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Raid Difficulty Mode</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['easy', 'hard', 'nightmare', 'monarch'] as const).map(diff => {
                  const active = difficulty === diff;
                  const cfg = DIFFICULTY_SETTINGS[diff];
                  return (
                    <button
                      key={diff}
                      onClick={() => {
                        sounds.playBeep();
                        setState(s => ({ ...s, difficulty: diff }));
                        setCombatLogs(prev => [...prev, `[SYSTEM]: Selected difficulty set to ${diff.toUpperCase()}.`]);
                        toast(`Difficulty set to ${diff.toUpperCase()}`);
                      }}
                      className={`py-2 px-1 text-[10px] font-orbitron font-bold border rounded transition-all duration-200 text-center ${
                        active 
                          ? 'border-red-500 bg-red-950/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'border-white/5 bg-zinc-900/60 text-white/35 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {cfg.name}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide bg-zinc-950/50 p-2.5 rounded border border-white/5 space-y-1">
                <div>💥 Damage: {DIFFICULTY_SETTINGS[difficulty || 'easy'].mult}x • XP Multiplier: {DIFFICULTY_SETTINGS[difficulty || 'easy'].xpMult}x</div>
                <div>⚔️ Counter Chance: {DIFFICULTY_SETTINGS[difficulty || 'easy'].counter * 100}% ({DIFFICULTY_SETTINGS[difficulty || 'easy'].dmg} HP)</div>
                <div>🎁 Chest Drop Chance: {DIFFICULTY_SETTINGS[difficulty || 'easy'].dropChance * 100}%</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Quest List */}
          <div className="space-y-6 relative min-h-[400px]">
            {/* Fainted Overlay */}
            {playerHp <= 0 && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6 rounded-lg border border-red-500/20 shadow-[inset_0_0_30px_rgba(255,0,0,0.2)]">
                <AlertCircle className="w-16 h-16 text-[#ff003c] animate-bounce mb-4" />
                <h3 className="font-orbitron text-2xl font-black uppercase text-white tracking-wider mb-2">HUNTER FAINTED</h3>
                <p className="font-mono text-xs text-white/40 max-w-sm mb-6 uppercase">
                  You took fatal damage from boss counterattacks. Revive to continue the strike directives.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button 
                    onClick={handleRevive}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold uppercase text-xs tracking-wider rounded transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    Revive (200 G)
                  </button>
                  {inventory.elixir_life > 0 ? (
                    <button 
                      onClick={() => useInventoryItem('elixir_life')}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold uppercase text-xs tracking-wider rounded border border-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      Use Elixir (Have {inventory.elixir_life})
                    </button>
                  ) : (
                    <div className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-white/20 font-orbitron font-bold uppercase text-xs tracking-wider rounded select-none flex items-center justify-center">
                      No Elixir
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Quests list with popups */}
            <div className="space-y-3 relative" id="boss-quest-list">
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
                            {Math.round(quest.damage * DIFFICULTY_SETTINGS[difficulty || 'easy'].mult).toLocaleString()}
                            <span className="text-[9px] ml-1 font-normal opacity-70 font-space-mono">DMG</span>
                          </div>
                          <div className="text-[10px] text-white/35">+{Math.round(quest.xp * DIFFICULTY_SETTINGS[difficulty || 'easy'].xpMult)} XP</div>
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
      )}

      {/* ── TAB 2: World Raid ── */}
      {activeTab === 'world' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 items-start">
             <div className="relative bg-black/60 p-6 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.6)] border"
                 style={{ borderColor: `${activeWorldBoss.color}30` }}>
              <div className="absolute inset-0 pointer-events-none z-0 animate-pulse" 
                   style={{ backgroundColor: `${activeWorldBoss.color}08` }} />
              <div className="absolute top-4 right-4 px-3 py-1 rounded text-[10px] font-orbitron font-bold uppercase tracking-widest border"
                   style={{ backgroundColor: `${activeWorldBoss.color}15`, color: activeWorldBoss.color, borderColor: `${activeWorldBoss.color}35` }}>
                WEEKLY THREAT
              </div>
              
              <div className="relative z-10 text-center py-6">
                <Skull className="w-20 h-20 mx-auto animate-[pulse_2.5s_infinite]" 
                       style={{ color: activeWorldBoss.color, filter: `drop-shadow(0 0 15px ${activeWorldBoss.color})` }} />
                <h3 className="font-orbitron text-2xl font-black text-white uppercase tracking-widest mt-4">{activeWorldBoss.name}</h3>
                <p className="font-space-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: activeWorldBoss.color }}>{activeWorldBoss.sub}</p>
                <div className="text-[9px] font-orbitron font-bold uppercase tracking-widest px-2 py-0.5 border inline-block mt-2 rounded bg-white/5" 
                     style={{ borderColor: `${activeWorldBoss.color}40`, color: activeWorldBoss.color }}>
                  {activeWorldBoss.series}
                </div>
                <p className="font-mono text-xs text-white/40 max-w-sm mx-auto mt-4 leading-relaxed uppercase">
                  {activeWorldBoss.desc}
                </p>
              </div>

              <div className="relative z-10 space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center font-orbitron text-xs">
                  <span className="text-white/40 uppercase">Raid HP</span>
                  <span className="font-bold font-mono" style={{ color: activeWorldBoss.color }}>
                    {worldBossHp.toLocaleString()} / {activeWorldBoss.maxHp.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-4 bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${(worldBossHp / activeWorldBoss.maxHp) * 100}%`,
                      background: `linear-gradient(90deg, ${activeWorldBoss.color}99, ${activeWorldBoss.color})`,
                      boxShadow: `0 0 10px ${activeWorldBoss.color}50`
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center font-mono">
                  <div className="bg-zinc-950/60 p-3 border border-white/5 rounded">
                    <div className="text-[10px] text-white/40 uppercase">Active DPS</div>
                    <div className="text-base font-orbitron font-black text-purple-400 mt-1">
                      {((shadowArmy.infantry || 0) * 5 + (shadowArmy.knight || 0) * 20 + (shadowArmy.general || 0) * 100).toLocaleString()}
                      <span className="text-[9px] font-normal text-white/40 ml-1">/s</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/60 p-3 border border-white/5 rounded">
                    <div className="text-[10px] text-white/40 uppercase">Raid Status</div>
                    <div className={`text-xs font-bold mt-1.5 uppercase ${worldBossDefeated ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>
                      {worldBossDefeated ? 'DEFEATED' : 'ENGAGED'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Direct Attacks */}
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-6">
              <h3 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
                <Zap className="text-yellow-400 w-5 h-5" /> Direct Attacks & Operations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 p-5 border border-white/5 rounded-xl space-y-3">
                  <h4 className="font-orbitron font-bold text-white text-sm uppercase">Discipline Bombardment</h4>
                  <p className="font-mono text-xs text-white/35 uppercase leading-relaxed">
                    Strike the weekly boss directly by activating a Scroll of Discipline. Inflicts 50,000 DMG.
                  </p>
                  <button
                    disabled={(inventory.discipline_scroll || 0) <= 0 || worldBossDefeated}
                    onClick={() => useInventoryItem('discipline_scroll')}
                    className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 disabled:bg-zinc-900/10 disabled:text-white/10 disabled:border-zinc-800 border border-red-500/20 text-red-400 font-orbitron font-bold uppercase text-xs rounded tracking-widest transition-all"
                  >
                    Activate Scroll (Have {inventory.discipline_scroll || 0})
                  </button>
                </div>

                <div className="bg-zinc-950/50 p-5 border border-white/5 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-orbitron font-bold text-white text-sm uppercase">Tactical Support</h4>
                    <p className="font-mono text-xs text-white/35 uppercase leading-relaxed mt-1">
                      Every quest completed in the Active Sector deals shockwave damage (500% DMG) to {activeWorldBoss.name}.
                    </p>
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono border-t border-white/5 pt-2 mt-2">
                    Active Multiplier: 500% Shockwave DMG
                  </div>
                </div>
              </div>

              <div className="border p-5 rounded-lg font-mono"
                   style={{ backgroundColor: `${activeWorldBoss.color}05`, borderColor: `${activeWorldBoss.color}25` }}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-orbitron"
                    style={{ color: activeWorldBoss.color }}>
                  <AlertCircle className="w-4 h-4" /> RAID MISSION OBJECTIVE
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed uppercase">
                  {activeWorldBoss.name} is the active weekly manga/manhwa threat. Raise a powerful Shadow Army to automate defeat. Upon vanquishing, a reward pool of 5,000 Gold is instantly granted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Shadow Army ── */}
      {activeTab === 'army' && (
        <div className="relative z-10 space-y-6">
          <div className="glass-panel p-6 text-center space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-950/10 pointer-events-none" />
            <h2 className="font-orbitron text-3xl font-black uppercase text-purple-400 tracking-[0.3em] animate-pulse">
              ARISE...
            </h2>
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest max-w-xl mx-auto">
              Summon shadows of fallen foes using gold. Shadows deal automatic damage to the Weekly World Boss {activeWorldBoss.name}.
            </p>
            <div className="inline-block px-4 py-2 bg-purple-950/40 border border-purple-500/20 text-purple-300 font-orbitron text-xs rounded tracking-widest mt-2 uppercase">
              Passive Damage Rate: <span className="font-black text-white">{((shadowArmy.infantry || 0) * 5 + (shadowArmy.knight || 0) * 20 + (shadowArmy.general || 0) * 100).toLocaleString()} DPS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(SHADOW_UNITS).map(([key, unit]) => {
              const count = shadowArmy[key as keyof typeof shadowArmy] || 0;
              return (
                <div 
                  key={key}
                  className="bg-black/60 border border-purple-500/10 hover:border-purple-500/35 p-5 rounded-xl flex flex-col justify-between transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)'
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-3xl">{unit.icon}</span>
                      <span className="font-orbitron font-black text-purple-400 text-lg">x{count}</span>
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-white text-base uppercase">{unit.name}</h4>
                      <p className="font-mono text-[10px] text-white/30 mt-1 leading-normal uppercase">{unit.desc}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                      <span>EFFECT</span>
                      <span className="text-purple-400 font-bold">
                        {(unit as any).dps ? `+${(unit as any).dps} DPS` : `+${(unit as any).hps} HP Regen/s`}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => buyShadowSoldier(key, unit.cost)}
                      disabled={gold < unit.cost}
                      className={`w-full py-2.5 font-orbitron font-bold uppercase text-[10px] tracking-widest border rounded transition-all duration-200 ${
                        gold >= unit.cost 
                          ? 'border-purple-500 bg-purple-950/20 text-purple-300 hover:bg-purple-500 hover:text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
                          : 'border-zinc-800 text-white/10 bg-zinc-900/10 cursor-not-allowed'
                      }`}
                    >
                      Summon ({unit.cost} G)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: Loot & Bag ── */}
      {activeTab === 'inventory' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shop */}
          <div className="glass-panel p-6 space-y-6">
            <h3 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <ShoppingBag className="text-amber-500 w-5 h-5" /> Tactical Shop
            </h3>

            <div className="space-y-4">
              {Object.entries(INVENTORY_ITEMS)
                .filter(([_, item]) => item.cost > 0) // Only buyable items
                .map(([key, item]) => (
                  <div 
                    key={key} 
                    className="flex justify-between items-center bg-zinc-950/60 p-4 border border-white/5 rounded-lg group hover:border-amber-500/20 transition-all font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-orbitron font-bold text-white text-xs uppercase">{item.name}</h4>
                        <p className="text-[10px] text-white/30 mt-0.5 leading-normal uppercase">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => buyShopItem(key, item.cost)}
                      disabled={gold < item.cost}
                      className={`px-4 py-2 border rounded font-orbitron font-bold text-[10px] tracking-widest transition-all ${
                        gold >= item.cost 
                          ? 'border-amber-500 bg-amber-950/20 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                          : 'border-zinc-800 text-white/10 bg-zinc-900/10 cursor-not-allowed'
                      }`}
                    >
                      {item.cost} G
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Bag & Chest Unlocking */}
          <div className="space-y-6">
            {/* Chest opening panel */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-orbitron text-xl font-bold uppercase tracking-widest text-purple-400 border-b border-white/5 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Shadow Chest Unlocks
              </h3>
              
              <div className="bg-zinc-950/60 border border-purple-500/10 p-5 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <span className="text-5xl">📦</span>
                    <span className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black font-orbitron">
                      {inventory.loot_box || 0}
                    </span>
                  </div>
                  <div className="font-mono text-xl text-white">+</div>
                  <div className="relative">
                    <span className="text-5xl">🔑</span>
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded font-black font-orbitron">
                      {inventory.loot_key || 0}
                    </span>
                  </div>
                </div>

                <div className="flex-1 font-mono text-xs max-w-xs uppercase leading-relaxed text-zinc-400">
                  Combine 1x Shadow Loot Chest & 1x Shadow Key to unlock items, potions, and gold bundles.
                </div>

                <button
                  onClick={handleOpenLootBox}
                  disabled={!inventory.loot_box || !inventory.loot_key}
                  className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-900 disabled:to-zinc-950 disabled:text-white/10 disabled:border-zinc-800 border border-purple-500/20 text-white font-orbitron font-bold uppercase text-xs rounded tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                >
                  Unlock Chest
                </button>
              </div>
            </div>

            {/* Bag list */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">
                🎒 Inventory Bag
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(INVENTORY_ITEMS).map(([key, item]) => {
                  const count = inventory[key] || 0;
                  const isUsable = key !== 'loot_box' && key !== 'loot_key';
                  return (
                    <div 
                      key={key} 
                      className={`bg-zinc-950/60 p-4 border rounded-lg flex flex-col justify-between transition-all font-mono ${
                        count > 0 ? 'border-white/10' : 'border-zinc-900 opacity-20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-orbitron font-black text-white/50 text-sm">x{count}</span>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-orbitron font-bold text-white text-[11px] uppercase truncate">{item.name}</h4>
                        <p className="text-[9px] text-white/30 leading-tight uppercase mt-0.5">{item.desc}</p>
                      </div>

                      {isUsable && (
                        <button
                          disabled={count <= 0}
                          onClick={() => useInventoryItem(key)}
                          className="w-full py-1.5 bg-zinc-900 border border-zinc-800 hover:border-white/20 text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded transition-all mt-4 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Use Item
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARED: Command Log Terminal ── */}
      <div className="relative z-10 space-y-3">
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
              {[...Array(24)].map((_, i) => {
                const startX = Math.random() * 100;
                const endX = startX + (Math.sin(i) * 12);
                const scaleStart = Math.random() * 0.4 + 0.3;
                const scaleEnd = scaleStart * 1.6;
                const duration = Math.random() * 3 + 2.5;
                const delay = Math.random() * 2.5;
                return (
                  <div
                    key={i}
                    className="victory-particle"
                    style={{
                      backgroundColor: defeatedBossColor,
                      boxShadow: `0 0 8px ${defeatedBossColor}, 0 0 16px ${defeatedBossColor}`,
                      // @ts-ignore
                      '--x-start': `${startX}vw`,
                      '--x-end': `${endX}vw`,
                      '--scale-start': scaleStart,
                      '--scale-end': scaleEnd,
                      '--duration': `${duration}s`,
                      '--delay': `${delay}s`
                    }}
                  />
                );
              })}
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
