import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface ActivityLog {
  id: string;
  user_id: string;
  category: 'fitness' | 'mind' | 'coding' | 'creator';
  activity_type: string;
  duration_minutes: number;
  metadata: any;
  xp_earned: number;
  created_at: string;
}

// Self-healing migration rules for legacy mock/incorrect logs in LocalStorage
const QUEST_DURATIONS: Record<string, number> = {
  '100 Push-ups — No Mercy': 15,
  '200 Bodyweight Squats': 20,
  '50 Pull-ups (any grip)': 15,
  '10-minute Plank Challenge': 10,
  '5KM Run — Sub 25 minutes': 25,
  '1000 Calf Raises (Park Protocol)': 20,
  '3 Sets of Dips to Failure': 10,
  '50 Burpees — Full Extension': 15,
  '200 Sit-ups — Lookism Style': 15,
  '30-min Shadow Boxing': 30,
  'Wall Sit — 5 minutes total': 5,
  '100 Jump Squats — Explosive': 15,
  'Ice Cold Shower — No hesitation': 5,
  'Wake at 5AM — Protocol Active': 5,
  '1-Hour No-Phone Morning': 60,
  'Meditate for 20 minutes': 20,
  'Journal 3 pages — Full honesty': 15,
  'Eat Zero Processed Food today': 10,
  'No Social Media for 12 hours': 0,
  '1 Hour Deep Reading — No distractions': 60
};

const MIND_QUESTS = new Set([
  'Ice Cold Shower — No hesitation',
  'Wake at 5AM — Protocol Active',
  '1-Hour No-Phone Morning',
  'Meditate for 20 minutes',
  'Journal 3 pages — Full honesty',
  'Eat Zero Processed Food today',
  'No Social Media for 12 hours',
  '1 Hour Deep Reading — No distractions'
]);

function healLocalStorageLogs(userId: string) {
  const fitnessKey = `monarch_logs_fitness_${userId}`;
  const mindKey = `monarch_logs_mind_${userId}`;

  try {
    const rawFitness = localStorage.getItem(fitnessKey);
    if (!rawFitness) return;

    const fitnessLogs = JSON.parse(rawFitness) as ActivityLog[];
    const cleanFitness: ActivityLog[] = [];
    const migratedToMind: ActivityLog[] = [];
    let changed = false;

    for (const log of fitnessLogs) {
      const title = log.activity_type;

      // Rule 1: If it belongs to Mind/Discipline, migrate it
      if (MIND_QUESTS.has(title)) {
        changed = true;
        const healedDuration = log.duration_minutes === 0 ? (QUEST_DURATIONS[title] ?? 0) : log.duration_minutes;
        migratedToMind.push({
          ...log,
          category: 'mind',
          duration_minutes: healedDuration
        });
      } else {
        // Rule 2: If it's physical but has 0m duration, heal the duration
        if (log.duration_minutes === 0 && QUEST_DURATIONS[title] !== undefined) {
          changed = true;
          cleanFitness.push({
            ...log,
            duration_minutes: QUEST_DURATIONS[title]
          });
        } else {
          cleanFitness.push(log);
        }
      }
    }

    if (changed) {
      localStorage.setItem(fitnessKey, JSON.stringify(cleanFitness));

      // Append migrated logs to mind key
      const rawMind = localStorage.getItem(mindKey);
      const existingMind = rawMind ? JSON.parse(rawMind) as ActivityLog[] : [];
      const updatedMind = [...migratedToMind, ...existingMind];
      localStorage.setItem(mindKey, JSON.stringify(updatedMind));

      console.log(`Self-healed ${migratedToMind.length} legacy logs from fitness to mind.`);
    }
  } catch (e) {
    console.error('Error during self-healing migration:', e);
  }
}

export function useActivityLogs(category: ActivityLog['category']) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Run self-healing migration once on fetch to fix legacy local storage logs
      healLocalStorageLogs(user.id);

      // Offline/Local Storage Fallback
      const localKey = `monarch_logs_${category}_${user.id}`;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) {
          setLogs(JSON.parse(raw) as ActivityLog[]);
        } else {
          setLogs([]);
        }
      } catch (e) {
        console.error('Failed to load local logs:', e);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('activity_logs table not found. Please run the SQL migration.');
        } else {
          throw error;
        }
      } else {
        setLogs(data as ActivityLog[]);
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, category]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (
    activityType: string,
    durationMinutes: number,
    xpEarned: number,
    metadata: any = {},
    statCategories: string[] = [],
    customCategory?: ActivityLog['category']
  ) => {
    if (!user) return;

    const activeCategory = customCategory ?? category;

    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(7),
      user_id: user.id,
      category: activeCategory,
      activity_type: activityType,
      duration_minutes: durationMinutes,
      xp_earned: xpEarned,
      metadata,
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      // Offline/Local Storage Fallback
      const localKey = `monarch_logs_${activeCategory}_${user.id}`;
      try {
        const raw = localStorage.getItem(localKey);
        const existing = raw ? JSON.parse(raw) as ActivityLog[] : [];
        const updated = [newLog, ...existing];
        localStorage.setItem(localKey, JSON.stringify(updated));
        
        // Only update local state if activeCategory matches the current hook's category
        if (activeCategory === category) {
          setLogs(updated);
        }
      } catch (e) {
        console.error('Failed to save local log:', e);
      }
      return;
    }

    try {
      // 1. Insert the log
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: newLog.user_id,
            category: newLog.category,
            activity_type: newLog.activity_type,
            duration_minutes: newLog.duration_minutes,
            xp_earned: newLog.xp_earned,
            metadata: newLog.metadata
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (activeCategory === category) {
        setLogs(prev => [data as ActivityLog, ...prev]);
      }

      // 2. Update the stats via RPC
      if (statCategories.length > 0 || xpEarned > 0) {
        const { error: rpcError } = await supabase.rpc('grant_xp', {
          p_user_id: user.id,
          p_xp_amount: xpEarned,
          p_stat_names: statCategories.map(s => s.toLowerCase())
        });
        
        if (rpcError) {
          console.error('RPC Error granting XP:', rpcError);
        }
      }

    } catch (err) {
      console.error('Add log error:', err);
    }
  };

  return { logs, loading, addLog, refetch: fetchLogs };
}
