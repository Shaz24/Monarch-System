import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface WeeklyChartData {
  day: string;
  score: number;
  fullDate: string;
}

// SWR Module Cache for weekly activities
let cachedWeeklyData: WeeklyChartData[] | null = null;
let cachedGrade: string = 'N/A';

export function useWeeklyActivity() {
  const { user } = useAuthStore();
  const [weeklyData, setWeeklyData] = useState<WeeklyChartData[]>(
    cachedWeeklyData || [
      { day: 'M', score: 0, fullDate: '' },
      { day: 'T', score: 0, fullDate: '' },
      { day: 'W', score: 0, fullDate: '' },
      { day: 'T', score: 0, fullDate: '' },
      { day: 'F', score: 0, fullDate: '' },
      { day: 'S', score: 0, fullDate: '' },
      { day: 'S', score: 0, fullDate: '' },
    ]
  );
  const [grade, setGrade] = useState<string>(cachedGrade);

  const fetchActivity = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    try {
      // Parallelize both database query operations to cut roundtrip time in half
      const [activitiesRes, tasksRes] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('created_at, xp_earned')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('task_completions')
          .select('completed_at, xp_earned')
          .eq('user_id', user.id)
          .gte('completed_at', sevenDaysAgo.toISOString())
      ]);

      const activities = activitiesRes.data;
      const tasks = tasksRes.data;

      const dailyScores: Record<string, number> = {};

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dailyScores[dateString] = 0;
      }

      if (activities) {
        activities.forEach(a => {
          const dateString = new Date(a.created_at).toISOString().split('T')[0];
          if (dailyScores[dateString] !== undefined) {
            dailyScores[dateString] += a.xp_earned;
          }
        });
      }

      if (tasks) {
        tasks.forEach(t => {
          const dateString = new Date(t.completed_at).toISOString().split('T')[0];
          if (dailyScores[dateString] !== undefined) {
            dailyScores[dateString] += t.xp_earned;
          }
        });
      }

      const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      let totalXP = 0;

      const chartData = Object.keys(dailyScores).sort().map(dateStr => {
        const d = new Date(dateStr);
        const dayName = daysOfWeek[d.getDay()];
        totalXP += dailyScores[dateStr];
        return {
          day: dayName,
          score: dailyScores[dateStr],
          fullDate: dateStr
        };
      });

      // Grade logic based on total XP over 7 days
      let nextGrade = 'F';
      if (totalXP > 500) nextGrade = 'S';
      else if (totalXP > 300) nextGrade = 'A';
      else if (totalXP > 150) nextGrade = 'B';
      else if (totalXP > 50) nextGrade = 'C';
      else if (totalXP > 0) nextGrade = 'D';

      // Cache the results
      cachedWeeklyData = chartData;
      cachedGrade = nextGrade;

      // Update State
      setWeeklyData(chartData);
      setGrade(nextGrade);
    } catch (e) {
      console.error('Failed to fetch weekly activity metrics:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { weeklyData, grade, refetch: fetchActivity };
}
