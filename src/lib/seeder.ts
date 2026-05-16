import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

const STATS = ['strength', 'discipline', 'intelligence', 'creativity', 'endurance', 'charisma', 'focus', 'stoicism', 'wealth', 'consistency'];

const DEFAULT_TASKS = [
  { time_slot: '04:30', title: 'Wake Up & Hydrate', description: 'Immediate rise, no snooze. 500ml water.', xp_reward: 20, difficulty: 'D', stat_category: 'discipline' },
  { time_slot: '04:45', title: 'Morning Meditation', description: 'Clear the mind.', xp_reward: 30, difficulty: 'C', stat_category: 'stoicism' },
  { time_slot: '05:00', title: 'Deep Work Session 1', description: 'Uninterrupted focus.', xp_reward: 100, difficulty: 'A', stat_category: 'focus' },
  { time_slot: '07:00', title: 'Intense Workout', description: 'Strength or Cardio.', xp_reward: 80, difficulty: 'B', stat_category: 'strength' },
  { time_slot: '08:30', title: 'Cold Shower', description: 'Mental resilience.', xp_reward: 50, difficulty: 'C', stat_category: 'endurance' },
  { time_slot: '09:00', title: 'Deep Work Session 2', description: 'Core project work.', xp_reward: 100, difficulty: 'A', stat_category: 'focus' },
  { time_slot: '12:00', title: 'Healthy Meal', description: 'High protein, low carb.', xp_reward: 20, difficulty: 'D', stat_category: 'discipline' },
  { time_slot: '13:00', title: 'Learning / Reading', description: 'Expand knowledge.', xp_reward: 60, difficulty: 'B', stat_category: 'intelligence' },
  { time_slot: '14:30', title: 'Creative Work', description: 'Content or problem solving.', xp_reward: 70, difficulty: 'B', stat_category: 'creativity' },
  { time_slot: '16:00', title: 'Admin & Emails', description: 'Clear the backlog.', xp_reward: 10, difficulty: 'E', stat_category: 'consistency' },
  { time_slot: '17:00', title: 'Networking / Social', description: 'Build relationships.', xp_reward: 40, difficulty: 'C', stat_category: 'charisma' },
  { time_slot: '18:30', title: 'Evening Walk', description: 'Decompress.', xp_reward: 20, difficulty: 'D', stat_category: 'endurance' },
  { time_slot: '19:30', title: 'Side Hustle / Finance', description: 'Wealth generation.', xp_reward: 90, difficulty: 'A', stat_category: 'wealth' },
  { time_slot: '21:00', title: 'Journal & Plan', description: 'Review day, plan tomorrow.', xp_reward: 40, difficulty: 'C', stat_category: 'stoicism' },
  { time_slot: '21:30', title: 'Sleep', description: 'Lights out.', xp_reward: 50, difficulty: 'C', stat_category: 'discipline' },
];

export async function seedInitialData(user: User) {
  try {
    // 1. Check if profile exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    
    if (!profile) {
      // Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player',
        avatar_url: user.user_metadata?.avatar_url || '',
        current_level: 1,
        current_xp: 0,
        rank: 'E',
        aura_level: 100,
        streak_days: 0
      });

      if (profileError) throw profileError;

      // Create Stats
      const statsToInsert = STATS.map(stat => ({
        user_id: user.id,
        stat_name: stat,
        level: 1,
        xp: 0
      }));

      const { error: statsError } = await supabase.from('stats').insert(statsToInsert);
      if (statsError) throw statsError;

      // Create Daily Tasks
      const tasksToInsert = DEFAULT_TASKS.map(task => ({
        user_id: user.id,
        time_slot: task.time_slot,
        title: task.title,
        description: task.description,
        xp_reward: task.xp_reward,
        difficulty: task.difficulty,
        stat_category: task.stat_category,
        is_recurring: true
      }));

      const { error: tasksError } = await supabase.from('daily_tasks').insert(tasksToInsert);
      if (tasksError) throw tasksError;

      console.log('Successfully seeded initial user data.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
