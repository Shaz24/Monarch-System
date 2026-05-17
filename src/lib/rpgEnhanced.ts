// Phase 2: Enhanced RPG engine
// NEW FILE — does NOT modify src/lib/rpg.ts

// ─── XP Rewards ────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  WAKE_UP_ON_TIME: 20,
  COMPLETE_WORKOUT: 80,
  DEEP_STUDY_2HRS: 60,
  ZERO_DOOMSCROLLING: 40,
  HEALTHY_EATING: 50,
  CONTENT_CREATION: 40,
  COLD_SHOWER: 15,
  SLEEP_ON_SCHEDULE: 50,
  MEDITATION: 30,
  CODING_DSA: 60,
  FREELANCE_EARN: 50,
  NO_JUNK_FOOD: 25,
  HIGH_PROTEIN: 30,
  MARTIAL_ARTS: 45,
  SOCIAL_CONFIDENCE: 35,
  JOURNALING: 20,
  YOUTUBE_UPLOAD: 40,
  INSTAGRAM_VIDEO: 35,
  ALL_LAWS_BONUS: 100,
} as const;

// ─── Streak Multipliers ─────────────────────────────────────────────────────
export const getStreakMultiplier = (streakDays: number): number => {
  if (streakDays >= 60) return 2.0;
  if (streakDays >= 30) return 1.75;
  if (streakDays >= 21) return 1.5;
  if (streakDays >= 14) return 1.25;
  if (streakDays >= 7) return 1.1;
  return 1.0;
};

// ─── Aura System ───────────────────────────────────────────────────────────
export const AURA_CHANGES = {
  PERFECT_DAY: +5,
  MEDITATION_DAY: +2,
  WORKOUT_DAY: +3,
  MISSED_DAY: -20,
  THREE_CONSECUTIVE_MISSED: -50,
  DOOMSCROLLING: -10,
} as const;

export interface AuraTier {
  name: string;
  color: string;
  glow: string;
}

export const getAuraTier = (aura: number): AuraTier => {
  if (aura >= 900) return { name: 'Monarch', color: '#7B2FFF', glow: 'shadow-purple' };
  if (aura >= 750) return { name: 'Shadow', color: '#6B21E8', glow: 'shadow-violet' };
  if (aura >= 600) return { name: 'Elite', color: '#4F46E5', glow: 'shadow-indigo' };
  if (aura >= 450) return { name: 'Hunter', color: '#00D4FF', glow: 'shadow-blue' };
  if (aura >= 250) return { name: 'Apprentice', color: '#0EA5E9', glow: 'shadow-sky' };
  if (aura >= 100) return { name: 'Awakening', color: '#334155', glow: 'shadow-slate' };
  return { name: 'Dormant', color: '#1E293B', glow: 'none' };
};

// ─── Second Body Stages ─────────────────────────────────────────────────────
export interface SecondBodyStage {
  stage: number;
  name: string;
  description: string;
  range: string;
  timeframe: string;
}

export const getSecondBodyStage = (level: number): SecondBodyStage => {
  if (level >= 85) return {
    stage: 5,
    name: 'Second Body Aura',
    description: 'You have achieved what most only dream of.',
    range: 'Lv. 85+',
    timeframe: '4+ years',
  };
  if (level >= 60) return {
    stage: 4,
    name: 'Elite Anime Build',
    description: 'Webtoon-level physique. Explosive and aesthetic.',
    range: 'Lv. 60–85',
    timeframe: '2–4 years',
  };
  if (level >= 40) return {
    stage: 3,
    name: 'Noticeably Aesthetic',
    description: 'People are noticing. Posture is elite.',
    range: 'Lv. 40–60',
    timeframe: '1–2 years',
  };
  if (level >= 20) return {
    stage: 2,
    name: 'Disciplined Trainee',
    description: 'The grind is working. Keep going.',
    range: 'Lv. 20–40',
    timeframe: '3–9 months',
  };
  return {
    stage: 1,
    name: 'Beginner Awakening',
    description: 'The journey of a thousand miles begins.',
    range: 'Lv. 1–20',
    timeframe: '0–3 months',
  };
};

// ─── Journey to Level 85 ────────────────────────────────────────────────────
export const XP_FOR_85 = 357250;

export interface JourneyStats {
  XP_FOR_85: number;
  xpRemaining: number;
  daysRemaining: number | null;
  percentComplete: string;
}

export const getJourneyStats = (
  currentLevel: number,
  currentXP: number,
  avgDailyXP: number,
): JourneyStats => {
  void currentLevel; // kept for API parity
  const xpRemaining = Math.max(0, XP_FOR_85 - currentXP);
  const daysRemaining = avgDailyXP > 0 ? Math.ceil(xpRemaining / avgDailyXP) : null;
  const percentComplete = Math.min(100, (currentXP / XP_FOR_85) * 100).toFixed(1);
  return { XP_FOR_85, xpRemaining, daysRemaining, percentComplete };
};

// ─── Motivation Quotes ──────────────────────────────────────────────────────
export const MOTIVATION_QUOTES = [
  'A strong day = 400 XP. You are 400 XP closer to who you\'re becoming.',
  'Daniel didn\'t get that body in a month. Neither will you. Show up anyway.',
  'Every cold shower, every rep, every line of code — it compounds.',
  'The system doesn\'t reward talent. It rewards consistency.',
  'Mori Jin trained when no one was watching. So do you.',
  '500,000 XP separates you from your final form. Earn them one day at a time.',
  'The aura isn\'t given. It\'s built — rep by rep, day by day, year by year.',
] as const;

// Get a quote seeded by today's date so it changes daily
export const getDailyQuote = (): string => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length];
};

// ─── Boss Battles Templates ─────────────────────────────────────────────────
export const BOSS_BATTLES_TEMPLATE = [
  {
    boss_name: 'The Lazy Demon',
    boss_description: 'Defeat laziness. Complete 25 out of 30 days fully.',
    condition_target: 25,
    condition_type: 'perfect_days',
    reward_xp: 500,
    reward_title: 'Iron Will',
    reward_aura: 50,
  },
  {
    boss_name: 'The Weak Body Gate',
    boss_description: '20 workouts + protein goal hit 20 days this month.',
    condition_target: 20,
    condition_type: 'workouts',
    reward_xp: 800,
    reward_title: 'Body Awakened',
    reward_aura: 80,
  },
  {
    boss_name: 'The Algorithm Gate',
    boss_description: 'Solve 50 LeetCode problems this month.',
    condition_target: 50,
    condition_type: 'leetcode',
    reward_xp: 600,
    reward_title: 'Code Hunter',
    reward_aura: 60,
  },
  {
    boss_name: 'The Silence Test',
    boss_description: '7 consecutive dopamine detox days.',
    condition_target: 7,
    condition_type: 'detox_streak',
    reward_xp: 400,
    reward_title: 'Stoic Mind',
    reward_aura: 75,
  },
  {
    boss_name: "The Creator's Gate",
    boss_description: 'Upload 8 pieces of content this month.',
    condition_target: 8,
    condition_type: 'content_uploads',
    reward_xp: 500,
    reward_title: 'Content Monarch',
    reward_aura: 55,
  },
] as const;
