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

// Global memory cache for SWR logs
const cachedActivityLogs: Record<string, ActivityLog[]> = {};
const cachedLogsLoaded: Record<string, boolean> = {};

export function useActivityLogs(category: ActivityLog['category']) {
  const { user } = useAuthStore();
  const cacheKey = user ? `${category}_${user.id}` : '';
  
  const [logs, setLogs] = useState<ActivityLog[]>(
    cacheKey ? (cachedActivityLogs[cacheKey] || []) : []
  );
  const [loading, setLoading] = useState(!cacheKey || !cachedLogsLoaded[cacheKey]);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const currentKey = `${category}_${user.id}`;

    if (!isSupabaseConfigured) {
      // Run self-healing migration once on fetch to fix legacy local storage logs
      healLocalStorageLogs(user.id);

      // Offline/Local Storage Fallback
      const localKey = `monarch_logs_${category}_${user.id}`;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) {
          const parsed = JSON.parse(raw) as ActivityLog[];
          cachedActivityLogs[currentKey] = parsed;
          cachedLogsLoaded[currentKey] = true;
          setLogs(parsed);
        } else {
          cachedActivityLogs[currentKey] = [];
          cachedLogsLoaded[currentKey] = true;
          setLogs([]);
        }
      } catch (e) {
        console.error('Failed to load local logs:', e);
      }
      setLoading(false);
      return;
    }

    if (!isSilent && !cachedLogsLoaded[currentKey]) {
      setLoading(true);
    }

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
      } else if (data) {
        const loadedLogs = data as ActivityLog[];
        cachedActivityLogs[currentKey] = loadedLogs;
        cachedLogsLoaded[currentKey] = true;
        setLogs(loadedLogs);
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, category]);

  useEffect(() => {
    if (cacheKey && cachedLogsLoaded[cacheKey]) {
      setLogs(cachedActivityLogs[cacheKey]);
      fetchLogs(true); // background silent fetch
    } else {
      fetchLogs(false);
    }
  }, [fetchLogs, cacheKey]);

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
    const currentKey = `${activeCategory}_${user.id}`;

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

    // Optimistically update memory cache and state
    if (activeCategory === category) {
      const updatedList = [newLog, ...logs];
      cachedActivityLogs[currentKey] = updatedList;
      setLogs(updatedList);
    }

    // Optimistically dispatch global XP / level update event immediately
    window.dispatchEvent(new CustomEvent('monarch-xp-granted', {
      detail: { xpAdded: xpEarned, statNames: statCategories.map(s => s.toLowerCase()) }
    }));

    if (!isSupabaseConfigured) {
      // Offline/Local Storage Fallback
      const localKey = `monarch_logs_${activeCategory}_${user.id}`;
      try {
        const raw = localStorage.getItem(localKey);
        const existing = raw ? JSON.parse(raw) as ActivityLog[] : [];
        const updated = [newLog, ...existing];
        localStorage.setItem(localKey, JSON.stringify(updated));
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
      
      // Update memory cache and state with DB response to preserve precise DB ID and timestamps
      if (data && activeCategory === category) {
        const freshLogs = logs.map(l => l.id === newLog.id ? (data as ActivityLog) : l);
        cachedActivityLogs[currentKey] = freshLogs;
        setLogs(freshLogs);
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

  return { 
    logs, 
    loading: !cachedLogsLoaded[cacheKey] && loading, // Only block UI if we have absolutely nothing loaded
    addLog, 
    refetch: () => fetchLogs(false) 
  };
}
