import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface Task {
  id: string;
  user_id: string;
  time_slot: string;
  title: string;
  description: string | null;
  xp_reward: number;
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  stat_category: string;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
}

export function useTasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setTasks([
        {
          id: '1', user_id: 'demo', time_slot: '05:00', title: 'Awaken & Hydrate', description: null,
          xp_reward: 10, difficulty: 'E', stat_category: 'discipline', is_recurring: true, notes: null, created_at: new Date().toISOString()
        },
        {
          id: '2', user_id: 'demo', time_slot: '06:00', title: 'Deep Work Block 1', description: 'Focus without distraction',
          xp_reward: 50, difficulty: 'B', stat_category: 'focus', is_recurring: true, notes: null, created_at: new Date().toISOString()
        },
        {
          id: '3', user_id: 'demo', time_slot: '17:00', title: 'Physical Conditioning', description: 'Strength training',
          xp_reward: 40, difficulty: 'C', stat_category: 'strength', is_recurring: true, notes: null, created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('time_slot', { ascending: true });

      if (error) throw error;
      setTasks(data as Task[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      setTasks(prev => [...prev, data as Task].sort((a, b) => a.time_slot.localeCompare(b.time_slot)));
    } catch (err: any) {
      console.error('Add task error:', err);
      throw err;
    }
  };

  const completeTask = async (taskId: string, xpReward: number) => {
    if (!user || !isSupabaseConfigured) {
      // In demo mode, just remove the task from local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return;
    }
    
    try {
      // 1. Record completion
      const { error: completeError } = await supabase
        .from('task_completions')
        .insert([{ user_id: user.id, task_id: taskId, xp_earned: xpReward }]);
      if (completeError) throw completeError;

      // 2. Grant XP via RPC
      const task = tasks.find(t => t.id === taskId);
      const statCategories = task ? [task.stat_category] : [];
      
      const { error: rpcError } = await supabase.rpc('grant_xp', {
        p_user_id: user.id,
        p_xp_amount: xpReward,
        p_stat_names: statCategories
      });

      if (rpcError) {
        console.error('RPC Error granting XP:', rpcError);
      }

      // 3. We do NOT delete the task if it's recurring, but for simplicity here we assume it's "done" for the day
      // In a real app, we'd filter the UI based on completions. For now, let's just refetch.
      await fetchTasks();
    } catch (err: any) {
      console.error('Complete task error:', err);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !isSupabaseConfigured) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      return;
    }
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (err) {
      console.error('Update task error:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !isSupabaseConfigured) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return;
    }
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Delete task error:', err);
      throw err;
    }
  };

  return { tasks, loading, error, refetch: fetchTasks, addTask, completeTask, updateTask, deleteTask };
}
