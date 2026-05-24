// ─── Boss Mode Static Data ────────────────────────────────────────────────────
// Extracted from BossMode.tsx so Vite can tree-shake/split it independently.

export interface BossQuest {
  id: string;
  title: string;
  category: string;
  xp: number;
  damage: number;
  completed: boolean;
  icon: string;
  duration?: number;
}

export const QUEST_POOL: Omit<BossQuest, 'id' | 'completed'>[] = [
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

export const CATEGORY_COLOR: Record<string, string> = {
  strength: '#ff5a00',
  endurance: '#ff003c',
  discipline: '#00D4FF',
  mind: '#7B2FFF',
};

export const BOSSES = [
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

export const DIFFICULTY_SETTINGS = {
  easy:      { name: 'EASY',      desc: 'No counterattacks. Standard drops.',        mult: 1.0, xpMult: 1.0, counter: 0.0,  dmg: 0,  goldMult: 1.0, dropChance: 0.1  },
  hard:      { name: 'HARD',      desc: '15% counter (10 dmg). +25% Gold.',          mult: 1.5, xpMult: 1.5, counter: 0.15, dmg: 10, goldMult: 1.25, dropChance: 0.35 },
  nightmare: { name: 'NIGHTMARE', desc: '30% counter (20 dmg). +50% Gold.',          mult: 2.0, xpMult: 2.0, counter: 0.30, dmg: 20, goldMult: 1.5,  dropChance: 0.65 },
  monarch:   { name: 'MONARCH',   desc: '50% counter (40 dmg). +100% Gold.',         mult: 3.0, xpMult: 3.0, counter: 0.50, dmg: 40, goldMult: 2.0,  dropChance: 1.0  },
};

export const INVENTORY_ITEMS = {
  elixir_life:         { name: 'Elixir of Life',        desc: 'Restores 50 Hunter HP instantly.',           icon: '🧪', cost: 120 },
  discipline_scroll:   { name: 'Discipline Scroll',      desc: 'Deals 50,000 DMG to World Boss.',            icon: '📜', cost: 400 },
  raid_shield:         { name: 'Raid Shield',             desc: 'Equip to block 3 boss counterattacks.',      icon: '🛡️', cost: 250 },
  focus_potion:        { name: 'Focus Potion',            desc: 'Doubles the damage of your next strike.',    icon: '⚡', cost: 300 },
  loot_box:            { name: 'Shadow Loot Chest',       desc: 'Contains random items or massive Gold.',     icon: '📦', cost: 0   },
  loot_key:            { name: 'Shadow Key',              desc: 'Used to unlock a Shadow Loot Chest.',        icon: '🔑', cost: 80  },
};

export const SHADOW_UNITS = {
  infantry: { name: 'Shadow Infantry', desc: 'Basic soldier raised from the grave.',         dps: 5,   cost: 250,  icon: '🛡️' },
  knight:   { name: 'Shadow Knight',   desc: 'Armored knight with heavy blade.',             dps: 20,  cost: 750,  icon: '⚔️' },
  healer:   { name: 'Shadow Healer',   desc: 'Support unit that heals Player +2 HP/sec.',   hps: 2,   cost: 1200, icon: '💚' },
  general:  { name: 'Shadow General',  desc: 'Legendary commander dealing 100 DPS.',         dps: 100, cost: 4000, icon: '👑' },
};

export const WORLD_BOSS_POOL = [
  { name: 'Antares',      sub: 'THE DRAGON EMPEROR',    maxHp: 1000000, desc: "The Monarch of Destruction, ruler of the Shadow Army's greatest rival force.", color: '#ff003c', series: 'Solo Leveling' },
  { name: 'Frieza',       sub: 'THE GALACTIC TYRANT',   maxHp: 1200000, desc: 'Ruler of the galactic empire, ruthless, cold-blooded, and capable of multiple bio-transformations.', color: '#b829e3', series: 'Dragon Ball' },
  { name: 'Sukuna',       sub: 'THE KING OF CURSES',    maxHp: 900000,  desc: 'A deadly imaginary demon who existed one thousand years ago, now reincarnated in modern times.', color: '#e23636', series: 'Jujutsu Kaisen' },
  { name: 'Mujin Park',   sub: 'THE SUPREME GOD',       maxHp: 1500000, desc: 'A divine god who possesses the powers of Tathagata, aiming to rewrite human society.', color: '#00d2ff', series: 'God of HighSchool' },
  { name: 'Charles Choi', sub: 'THE ELITE',              maxHp: 800000,  desc: 'The mastermind behind HNH Group and the creator of the Ten Genius network.', color: '#ff5a00', series: 'Lookism' },
  { name: 'Zero',         sub: 'THE NIGHTMARE CREATOR', maxHp: 1100000, desc: 'The mysterious supreme entity bringing structural imbalance to the Lucid Adventure.', color: '#7B2FFF', series: 'Hardcore Leveling Warrior' },
  { name: 'Madara Uchiha', sub: 'THE GHOST OF UCHIHA',  maxHp: 1300000, desc: 'Legendary leader of the Uchiha clan who summoned the Infinite Tsukuyomi.', color: '#ff004f', series: 'Naruto' },
  { name: 'Aizen Sosuke', sub: 'THE SHINIGAMI TRAITOR', maxHp: 1400000, desc: 'Genius soul reaper captain who betrayed the Soul Society to attain godhood using the Hogyoku.', color: '#7b828a', series: 'Bleach' },
];

export function pickRandomQuests(n: number, excludeTitles: string[] = []): BossQuest[] {
  const available = QUEST_POOL.filter(q => !excludeTitles.includes(q.title));
  const pool = available.length >= n ? available : [...QUEST_POOL];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((q, i) => ({
    ...q,
    id: `q${i}_${Date.now()}`,
    completed: false,
  }));
}
