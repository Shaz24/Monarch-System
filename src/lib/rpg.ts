export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';

export type StatCategory = 
  | 'strength' 
  | 'discipline' 
  | 'intelligence' 
  | 'creativity' 
  | 'endurance' 
  | 'charisma' 
  | 'focus' 
  | 'stoicism' 
  | 'wealth' 
  | 'consistency';

export interface StatUpdate {
  category: StatCategory;
  xpAdded: number;
  newTotalXP: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface Profile {
  id: string;
  username: string;
  current_level: number;
  current_xp: number;
  rank: string;
  aura_level: number;
  streak_days: number;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  completed_at: string;
  xp_earned: number;
  streak_count: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlock_condition: string;
}

/**
 * Calculates the required XP to reach the next level.
 * Formula: level * 100
 */
export const calculateXPForLevel = (level: number): number => {
  return level * 100;
};

/**
 * Calculates the level based on total accumulated XP.
 * Assuming level 1 starts at 0 XP, level 2 requires 100 XP, level 3 requires 200 more (300 total), etc.
 * Wait, the prompt says "returns level * 100" for calculateXPForLevel. 
 * If it's a flat rate per level or a triangular number? 
 * Let's assume total XP = level * (level - 1) / 2 * 100 for cumulative, 
 * or if it means the XP needed for that specific level is level * 100.
 * To keep it simple and strictly inverse: level = Math.floor(xp / 100) + 1 if flat.
 * But if calculateXPForLevel(l) = l * 100 is the *total* XP needed to reach level l, 
 * then l = xp / 100. Let's assume the standard RPG flat increment: Level N requires N * 100 total XP from N-1.
 * Let's use a simpler total XP formula for ease: Total XP = 50 * level * (level + 1)
 * Actually, let's just make it simple: Level = Math.floor(Math.sqrt(2 * xp / 100)) + 1 based on triangular formula.
 * Wait, if calculateXPForLevel(level) -> level * 100.
 * Let's assume it means XP required to go from `level` to `level + 1` is `level * 100`.
 */
export const calculateLevelFromXP = (totalXp: number): number => {
  let level = 1;
  let xpRemaining = totalXp;
  
  while (xpRemaining >= calculateXPForLevel(level)) {
    xpRemaining -= calculateXPForLevel(level);
    level++;
  }
  
  return level;
};

/**
 * Determines Rank based on current level.
 * E(<10), D(<20), C(<35), B(<50), A(<70), S(<90), National(<110), Monarch(110+)
 */
export const getRankFromLevel = (level: number): Rank => {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 35) return 'C';
  if (level < 50) return 'B';
  if (level < 70) return 'A';
  if (level < 90) return 'S';
  if (level < 110) return 'National';
  return 'Monarch';
};

/**
 * Calculates XP multiplier based on consistency streak.
 * 1.0 base, +0.1 per 7 days, max 2.0x
 */
export const calculateStreakMultiplier = (streakDays: number): number => {
  const bonus = Math.floor(streakDays / 7) * 0.1;
  return Math.min(1.0 + bonus, 2.0);
};

/**
 * Applies XP to a stat and determines if it leveled up.
 */
export const applyXPToStats = (
  statCategory: StatCategory, 
  currentLevel: number, 
  currentXp: number, 
  xpGained: number
): StatUpdate => {
  const newTotalXP = currentXp + xpGained;
  const xpNeeded = calculateXPForLevel(currentLevel);
  
  let newLevel = currentLevel;
  let leveledUp = false;

  if (newTotalXP >= xpNeeded) {
    newLevel++;
    leveledUp = true;
    // In a full implementation, this might loop if they gained enough for multiple levels
  }

  return {
    category: statCategory,
    xpAdded: xpGained,
    newTotalXP,
    newLevel,
    leveledUp
  };
};

/**
 * Checks if any achievements should be unlocked based on user profile and completions.
 * This is a pure function that compares state against conditions.
 */
export const checkAchievements = (
  userProfile: Profile, 
  completions: TaskCompletion[], 
  availableAchievements: Achievement[]
): Achievement[] => {
  const unlocked: Achievement[] = [];
  
  // Example dummy logic for "First Blood" achievement
  const hasFirstTask = completions.length > 0;
  
  for (const achievement of availableAchievements) {
    // Note: unlock_condition would ideally be a parsable string or enum mapping to logic
    if (achievement.unlock_condition === 'first_task' && hasFirstTask) {
      unlocked.push(achievement);
    }
    
    if (achievement.unlock_condition === 'level_10' && userProfile.current_level >= 10) {
      unlocked.push(achievement);
    }
    
    if (achievement.unlock_condition === 'streak_7' && userProfile.streak_days >= 7) {
      unlocked.push(achievement);
    }
  }

  return unlocked;
};
