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

// SWR Cache for tasks and completed tasks
let cachedTasks: Task[] | null = null;
let cachedCompletedTaskIds: Set<string> = new Set();
let isInitialFetched = false;

export function useTasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>(
    cachedTasks || [
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
    ]
  );
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(cachedCompletedTaskIds);
  const [loading, setLoading] = useState(!cachedTasks);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      const mockTasks: Task[] = [
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
      ];
      cachedTasks = mockTasks;
      setTasks(mockTasks);
      setLoading(false);
      return;
    }

    if (!isSilent && !cachedTasks) {
      setLoading(true);
    }
    setError(null);

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Parallelize queries to get tasks and daily completions at the same time
      const [tasksRes, completionsRes] = await Promise.all([
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('time_slot', { ascending: true }),
        supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', user.id)
          .gte('completed_at', startOfDay.toISOString())
      ]);

      if (tasksRes.error) throw tasksRes.error;

      const loadedTasks = tasksRes.data as Task[];
      const loadedCompletedIds = new Set<string>();

      if (!completionsRes.error && completionsRes.data) {
        completionsRes.data.forEach(c => loadedCompletedIds.add(c.task_id));
      }

      // Update Cache
      cachedTasks = loadedTasks;
      cachedCompletedTaskIds = loadedCompletedIds;
      isInitialFetched = true;

      // Update State
      setTasks(loadedTasks);
      setCompletedTaskIds(loadedCompletedIds);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // SWR Pattern: load cached instantly, fetch fresh in background
    if (cachedTasks) {
      setTasks(cachedTasks);
      setCompletedTaskIds(cachedCompletedTaskIds);
      fetchTasks(true); // silent background fetch
    } else {
      fetchTasks(false);
    }
  }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    if (!user || !isSupabaseConfigured) {
      const newTask = {
        id: Math.random().toString(36).substring(7),
        user_id: 'demo',
        time_slot: taskData.time_slot || '12:00',
        title: taskData.title || 'New Task',
        description: taskData.description || null,
        xp_reward: taskData.xp_reward || 10,
        difficulty: taskData.difficulty || 'E',
        stat_category: taskData.stat_category || 'discipline',
        is_recurring: taskData.is_recurring ?? true,
        notes: taskData.notes || null,
        created_at: new Date().toISOString()
      } as Task;
      
      const updatedTasks = [...tasks, newTask].sort((a, b) => a.time_slot.localeCompare(b.time_slot));
      cachedTasks = updatedTasks;
      setTasks(updatedTasks);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedTasks = [...tasks, data as Task].sort((a, b) => a.time_slot.localeCompare(b.time_slot));
      cachedTasks = updatedTasks;
      setTasks(updatedTasks);
    } catch (err: any) {
      console.error('Add task error:', err);
      throw err;
    }
  };

  const completeTask = async (taskId: string, xpReward: number) => {
    if (!user || !isSupabaseConfigured) {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      cachedTasks = updatedTasks;
      setTasks(updatedTasks);
      return;
    }

    if (completedTaskIds.has(taskId)) {
      console.warn('Task already completed today');
      return;
    }
    
    try {
      // Optimistically update UI state
      const nextCompleted = new Set(completedTaskIds);
      nextCompleted.add(taskId);
      cachedCompletedTaskIds = nextCompleted;
      setCompletedTaskIds(nextCompleted);

      // Find stat category for task and optimistically update user level/XP instantly
      const task = tasks.find(t => t.id === taskId);
      const statCategories = task ? [task.stat_category] : [];
      window.dispatchEvent(new CustomEvent('monarch-xp-granted', {
        detail: { xpAdded: xpReward, statNames: statCategories.map(s => s.toLowerCase()) }
      }));

      // 1. Record completion
      const { error: completeError } = await supabase
        .from('task_completions')
        .insert([{ user_id: user.id, task_id: taskId, xp_earned: xpReward }]);
      if (completeError) throw completeError;

      // 2. Grant XP via RPC
      const { error: rpcError } = await supabase.rpc('grant_xp', {
        p_user_id: user.id,
        p_xp_amount: xpReward,
        p_stat_names: statCategories
      });

      if (rpcError) {
        console.error('RPC Error granting XP:', rpcError);
      }
    } catch (err: any) {
      console.error('Complete task error:', err);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistically update
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    cachedTasks = updatedTasks;
    setTasks(updatedTasks);

    if (!user || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (err) {
      console.error('Update task error:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistically update
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    cachedTasks = updatedTasks;
    setTasks(updatedTasks);

    if (!user || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (err) {
      console.error('Delete task error:', err);
      throw err;
    }
  };

  return { 
    tasks, 
    completedTaskIds, 
    loading: !isInitialFetched && loading, // Only block UI if we don't have task data yet
    error, 
    refetch: () => fetchTasks(false), 
    addTask, 
    completeTask, 
    updateTask, 
    deleteTask 
  };
}
