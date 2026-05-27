import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface HabitItem {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface HabitTrackerProps {
  habits?: HabitItem[];
  className?: string;
}

const DEFAULT_HABITS: HabitItem[] = [
  { id: 'cold_shower', label: 'Cold Shower', emoji: '🚿', color: '#06B6D4' },
  { id: 'no_social', label: 'No Social Media', emoji: '📵', color: '#EF4444' },
  { id: 'read_30', label: 'Read 30 Min', emoji: '📖', color: '#A78BFA' },
  { id: 'workout', label: 'Workout', emoji: '💪', color: '#F59E0B' },
  { id: 'healthy_food', label: 'Eat Clean', emoji: '🥗', color: '#10B981' },
  { id: 'no_junk', label: 'No Junk Food', emoji: '🚫', color: '#F97316' },
  { id: 'meditate', label: 'Meditate', emoji: '🧘', color: '#8B5CF6' },
  { id: 'journal', label: 'Journal', emoji: '✍️', color: '#EC4899' },
];

const todayKey = () => new Date().toISOString().split('T')[0];

const getStorageKey = (habitId: string, date: string) => `monarch_habit_${habitId}_${date}`;

const getStreak = (habitId: string): number => {
  let streak = 0;
  const d = new Date();
  // Start from yesterday (today might not be done yet)
  d.setDate(d.getDate() - 1);
  while (true) {
    const key = getStorageKey(habitId, d.toISOString().split('T')[0]);
    if (localStorage.getItem(key) === 'true') {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  // Check if today is also done
  if (localStorage.getItem(getStorageKey(habitId, todayKey())) === 'true') {
    streak++;
  }
  return streak;
};

export const HabitTracker = ({
  habits = DEFAULT_HABITS,
  className = '',
}: HabitTrackerProps) => {
  const today = todayKey();

  // State: which habits are done today
  const [completed, setCompleted] = useState<Set<string>>(() => {
    const set = new Set<string>();
    habits.forEach((h) => {
      if (localStorage.getItem(getStorageKey(h.id, today)) === 'true') {
        set.add(h.id);
      }
    });
    return set;
  });

  const [streaks, setStreaks] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    habits.forEach((h) => map.set(h.id, getStreak(h.id)));
    return map;
  });

  const toggleHabit = (habitId: string) => {
    const key = getStorageKey(habitId, today);
    const isDone = completed.has(habitId);

    if (isDone) {
      localStorage.removeItem(key);
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    } else {
      localStorage.setItem(key, 'true');
      setCompleted((prev) => new Set(prev).add(habitId));
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        toast(`${habit.emoji} ${habit.label} — done!`, { duration: 1500 });
      }
    }

    // Recalculate streak
    setTimeout(() => {
      setStreaks((prev) => {
        const next = new Map(prev);
        next.set(habitId, getStreak(habitId));
        return next;
      });
    }, 50);
  };

  const completionPercent = habits.length > 0
    ? Math.round((completed.size / habits.length) * 100)
    : 0;

  return (
    <div className={`glass-card p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Daily Habits
        </h3>
        <span className="font-mono text-[10px] text-white/30">
          {completed.size}/{habits.length} · {completionPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Habit grid */}
      <div className="grid grid-cols-2 gap-2">
        {habits.map((habit) => {
          const isDone = completed.has(habit.id);
          const streak = streaks.get(habit.id) ?? 0;

          return (
            <motion.button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left ${
                isDone
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/[0.02]'
              }`}
              style={isDone ? { borderColor: `${habit.color}30`, background: `${habit.color}08` } : {}}
            >
              {/* Check circle */}
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: isDone ? habit.color : 'rgba(255,255,255,0.15)',
                  background: isDone ? `${habit.color}25` : 'transparent',
                }}
              >
                {isDone && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <Check className="w-3 h-3" style={{ color: habit.color }} />
                  </motion.div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium block truncate ${isDone ? 'text-white/50 line-through' : 'text-white/80'}`}>
                  {habit.emoji} {habit.label}
                </span>
                {streak > 0 && (
                  <span className="font-mono text-[8px] flex items-center gap-0.5" style={{ color: habit.color }}>
                    <Flame className="w-2 h-2" /> {streak}d streak
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
