import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useWeeklyActivity() {
  const { user } = useAuthStore();
  const [weeklyData, setWeeklyData] = useState([
    { day: 'M', score: 0, fullDate: '' },
    { day: 'T', score: 0, fullDate: '' },
    { day: 'W', score: 0, fullDate: '' },
    { day: 'T', score: 0, fullDate: '' },
    { day: 'F', score: 0, fullDate: '' },
    { day: 'S', score: 0, fullDate: '' },
    { day: 'S', score: 0, fullDate: '' },
  ]);
  const [grade, setGrade] = useState('N/A');

  useEffect(() => {
    async function fetchActivity() {
      if (!user || !isSupabaseConfigured) return;

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // We'll approximate total score by adding activity_logs xp and task_completions xp
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('created_at, xp_earned')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: tasks } = await supabase
        .from('task_completions')
        .select('completed_at, xp_earned')
        .eq('user_id', user.id)
        .gte('completed_at', sevenDaysAgo.toISOString());

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

      setWeeklyData(chartData);

      // Grade logic based on total XP over 7 days
      if (totalXP > 500) setGrade('S');
      else if (totalXP > 300) setGrade('A');
      else if (totalXP > 150) setGrade('B');
      else if (totalXP > 50) setGrade('C');
      else if (totalXP > 0) setGrade('D');
      else setGrade('F');
    }

    fetchActivity();
  }, [user]);

  return { weeklyData, grade };
}
