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

export function useActivityLogs(category: ActivityLog['category']) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
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
        // If the table doesn't exist yet, just silently fail so the UI doesn't crash
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
    statCategories: string[] = []
  ) => {
    if (!user) return;

    const newLog: Partial<ActivityLog> = {
      user_id: user.id,
      category,
      activity_type: activityType,
      duration_minutes: durationMinutes,
      xp_earned: xpEarned,
      metadata,
    };

    if (!isSupabaseConfigured) {
      setLogs(prev => [{ ...newLog, id: Math.random().toString(), created_at: new Date().toISOString() } as ActivityLog, ...prev]);
      return;
    }

    try {
      // 1. Insert the log
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([newLog])
        .select()
        .single();
        
      if (error) throw error;
      
      setLogs(prev => [data as ActivityLog, ...prev]);

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
