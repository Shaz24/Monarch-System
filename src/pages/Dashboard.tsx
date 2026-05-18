import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Clock, ArrowRight, Volume2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatRing } from '../components/StatRing';
import { useProfile } from '../hooks/useProfile';
import { useWeeklyActivity } from '../hooks/useWeeklyActivity';
import { useTasks } from '../hooks/useTasks';
import { getRankFromLevel } from '../lib/rpg';
import { JourneyTimeline } from '../components/enhanced/JourneyTimeline';
import { DailyLaws } from '../components/enhanced/DailyLaws';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useCountUp } from '../hooks/useCountUp';

const MOTIVATIONAL_QUOTES = [
  { text: "The only way to grow is to challenge your limits.", author: "Sung Jinwoo" },
  { text: "Wake up. The system is waiting. No excuses.", author: "System Protocol" },
  { text: "An ant cannot understand the realm of a monarch.", author: "Shadow Monarch" },
  { text: "If you do not move forward, the system leaves you behind.", author: "Sung Jinwoo" },
  { text: "To conquer the mind is to conquer the world.", author: "Marcus Aurelius" },
  { text: "Do not explain your philosophy. Embody it.", author: "Epictetus" },
  { text: "I will rise. Even if I have to crawl.", author: "Sung Jinwoo" },
  { text: "Strength does not come from winning. It comes from struggle.", author: "Stoic Wisdom" },
  { text: "Every directive completed is a step closer to the throne.", author: "Monarch System" },
  { text: "The shadow of doubt is cast out by the light of discipline.", author: "Discipline Protocol" },
  { text: "No excuses. Only absolute results.", author: "Solo Leveling UI" },
  { text: "The grind never lies. Core systems active.", author: "Sung Jinwoo" },
  { text: "Iron sharpens iron. Level up daily.", author: "Stoic Maxim" },
  { text: "I am the Monarch of my own destiny.", author: "Sung Jinwoo" },
  { text: "Master yourself, master the game.", author: "System Guide" },
  { text: "Doubt is the enemy of execution.", author: "Epictetus" },
  { text: "Turn pain into power. Level up.", author: "Shadow Army Command" },
  { text: "A true monarch does not fear failure. They adapt.", author: "Sung Jinwoo" },
  { text: "Protocol initialized: Eliminate weakness.", author: "System AI" },
  { text: "Your level reflects your dedication.", author: "Monarch Guide" }
];

interface DashboardBoss {
  id: string;
  boss_name: string;
  condition_target: number;
  condition_current: number;
  reward_xp: number;
  is_completed: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, stats, loading: profileLoading } = useProfile();
  const { grade } = useWeeklyActivity();
  const { tasks, completedTaskIds, loading: tasksLoading } = useTasks();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeBoss, setActiveBoss] = useState<DashboardBoss | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Time & Clock hooks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quotes cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active boss & all activity logs for heatmap and velocity
  useEffect(() => {
    if (!user) return;

    const MONTH_YEAR = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const fetchDashboardAdditions = async () => {
      // 1. Fetch uncompleted boss battle
      if (!isSupabaseConfigured) {
        const localKey = `monarch_boss_battles_${user.id}_${MONTH_YEAR}`;
        const raw = localStorage.getItem(localKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as DashboardBoss[];
            const firstActive = parsed.find(b => !b.is_completed) || null;
            setActiveBoss(firstActive);
          } catch (e) {
            console.error('Failed to parse local bosses:', e);
          }
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('boss_battles')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .order('id', { ascending: true })
            .limit(1);
          if (!error && data && data.length > 0) {
            setActiveBoss(data[0] as DashboardBoss);
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Fetch recent activity logs for heatmap & velocity
      if (!isSupabaseConfigured) {
        const categories = ['fitness', 'mind', 'coding', 'creator'];
        const allLogs: any[] = [];
        categories.forEach(cat => {
          const raw = localStorage.getItem(`monarch_logs_${cat}_${user.id}`);
          if (raw) {
            try {
              allLogs.push(...JSON.parse(raw));
            } catch (e) {}
          }
        });
        setRecentLogs(allLogs);
      } else {
        try {
          const { data } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id);
          if (data) setRecentLogs(data);
        } catch (e) {}
      }
    };

    fetchDashboardAdditions();
  }, [user]);

  // Calculate parameters
  const currentLevel = profile?.current_level ?? 1;
  const currentXp = profile?.current_xp ?? 0;
  const xpNeeded = currentLevel * 100;
  const xpPercent = Math.min(100, Math.round((currentXp % xpNeeded) / xpNeeded * 100));
  const rank = getRankFromLevel(currentLevel);

  // Animated counts
  const animatedLevel = useCountUp(currentLevel);
  const animatedAura = useCountUp(profile?.aura_level ?? 100);
  const animatedStreak = useCountUp(profile?.streak_days ?? 0);

  // Day Countdown Calculations
  const hoursLeft = 23 - currentTime.getHours() + (60 - currentTime.getMinutes()) / 60;
  const hoursPercent = (hoursLeft / 24) * 100;
  const clockFormatted = currentTime.toLocaleTimeString([], { hour12: false });

  // Today's XP goal progress
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayXp = useMemo(() => {
    // XP from activity logs created today
    const logsToday = recentLogs.filter(log => new Date(log.created_at) >= todayStart);
    const activityXp = logsToday.reduce((sum, log) => sum + (log.xp_earned || 0), 0);

    // XP from task completions today
    // useTasks hooks manages tasks completed today optimistically, let's also estimate from completed tasks
    const tasksCount = completedTaskIds.size;
    const tasksXp = tasksCount * 15; // approximate XP per completed directive

    return activityXp + tasksXp;
  }, [recentLogs, completedTaskIds, todayStart]);

  const dailyGoal = 200;
  const goalPercent = Math.min(100, Math.round((todayXp / dailyGoal) * 100));

  // System Health Score
  const systemHealth = useMemo(() => {
    const streakVal = Math.min(100, (profile?.streak_days ?? 0) * 10);
    const avgStatLevel = stats.length > 0 ? (stats.reduce((acc, s) => acc + s.level, 0) / stats.length) : 1;
    const statVal = Math.min(100, avgStatLevel * 8);
    const tasksVal = tasks.length > 0 ? (completedTaskIds.size / tasks.length) * 100 : 100;
    return Math.round((streakVal * 0.3) + (statVal * 0.4) + (tasksVal * 0.3));
  }, [profile, stats, tasks, completedTaskIds]);

  // GitHub-style 12-week RPG Contribution Heatmap
  const contributionGrid = useMemo(() => {
    const grid = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find date 12 weeks (84 days) ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83 - today.getDay());

    for (let i = 0; i < 84; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Filter activity logs on this date
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);

      const dayLogs = recentLogs.filter(log => {
        const d = new Date(log.created_at);
        return d >= currentDate && d < nextDay;
      });

      const dayXp = dayLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0);
      grid.push({ date: dateStr, xp: dayXp });
    }
    return grid;
  }, [recentLogs]);

  // Compute velocity stats & sparklines
  const statVelocities = useMemo(() => {
    const velocities: Record<string, { thisWeek: number; sparkline: any[] }> = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    stats.forEach(s => {
      const key = s.stat_name.toLowerCase();
      // Map category naming formats
      const mappedCats: Record<string, string[]> = {
        strength: ['fitness'],
        endurance: ['fitness'],
        discipline: ['mind'],
        focus: ['mind'],
        stoicism: ['mind'],
        intelligence: ['coding'],
        consistency: ['mind'],
        wealth: ['creator'],
        charisma: ['creator'],
        creativity: ['creator']
      };

      const cats = mappedCats[key] || ['mind'];
      const currentCatLogs = recentLogs.filter(log => cats.includes(log.category.toLowerCase()));

      // Calculate recent XP in the last 7 days
      const weeklyLogs = currentCatLogs.filter(log => new Date(log.created_at) >= oneWeekAgo);
      const weeklyXp = weeklyLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0);

      // Generate 7 points for a simple line sparkline
      const sparklineData = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - idx));
        d.setHours(0,0,0,0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const logsOnDay = currentCatLogs.filter(log => {
          const c = new Date(log.created_at);
          return c >= d && c < nextD;
        });

        return { val: logsOnDay.reduce((sum, l) => sum + (l.xp_earned || 0), 0) };
      });

      velocities[key] = {
        thisWeek: weeklyXp,
        sparkline: sparklineData
      };
    });

    return velocities;
  }, [stats, recentLogs]);

  if (profileLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="font-display text-xs text-[#A78BFA] uppercase tracking-[0.2em] animate-pulse glow-text">
          Syncing Core Monarch Systems...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 relative overflow-hidden"
    >
      {/* Background glowing violet & cyan spots */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-monarch/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* SECTION 1 — Identity Profile Header + Digital Clock HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-xl border border-monarch-glow/30 shadow-[0_0_20px_rgba(124,58,237,0.15)] flex items-center justify-center bg-void z-10 shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-12 h-12 text-[#A78BFA] animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 w-full z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="font-display text-[10px] text-[#A78BFA] tracking-widest uppercase font-bold">
                  Rank: {rank}-Class Hunter • Rating: {grade}
                </p>
                <h1 className="font-display text-3xl font-black text-[#F1F5F9] uppercase tracking-wider glow-text mt-1">
                  {profile?.display_name || profile?.username || 'Player_01'}
                </h1>
              </div>
              <div className="text-right">
                <p className="font-display text-[10px] text-[#94A3B8] tracking-widest uppercase">LVL</p>
                <p className="font-display text-4xl font-bold text-[#F59E0B] glow-gold">{animatedLevel}</p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="w-full h-4 bg-void/50 border border-white/5 rounded-full relative overflow-hidden mt-4 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-monarch to-[#A78BFA] relative rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[10px] text-[#94A3B8] tracking-wide">
              <span>{currentXp} XP</span>
              <span>{xpNeeded} XP</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Countdown HUD */}
        <div className="glass-card p-6 flex flex-col justify-between border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span className="font-display text-[10px] font-bold uppercase tracking-widest">Chronos Radar</span>
            </div>
            <span className="font-space-mono text-xs text-white/80 tracking-widest">{clockFormatted}</span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-space-mono uppercase text-white/50">
              <span>Day Cycle Remaining</span>
              <span className={hoursLeft < 4 ? "text-red-500 font-bold animate-pulse" : "text-cyan-400"}>
                {hoursLeft.toFixed(1)} HR
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/60 border border-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${hoursPercent}%` }}
                className={`h-full rounded-full ${
                  hoursLeft < 4 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                }`}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[9px] font-space-mono text-white/30 uppercase tracking-widest">
            <span>Cycle reset: 00:00</span>
            <span>Integrity: Stable</span>
          </div>
        </div>

      </div>

      {/* SECTION 2 — Stat Velocity, Heatmap, Motivational Quote, Daily XP, System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Stat rings & Velocity Sparklines */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-monarch pl-3 text-[#F1F5F9]">
              Player Stat Velocities
            </h2>
            <Target className="w-4 h-4 text-monarch" />
          </div>

          {stats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {stats.map((stat) => {
                const statKey = stat.stat_name.toLowerCase();
                const vel = statVelocities[statKey] || { thisWeek: 0, sparkline: [] };
                return (
                  <div key={stat.stat_name} className="flex flex-col items-center p-3 rounded-lg bg-black/20 border border-white/[0.03] space-y-2">
                    <StatRing
                      statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                      level={stat.level}
                      xp={stat.xp % 100}
                    />
                    
                    {/* Sparkline Thumbnail */}
                    <div className="w-full h-8 flex items-center justify-center overflow-hidden pointer-events-none mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vel.sparkline}>
                          <Line
                            type="monotone"
                            dataKey="val"
                            stroke="#06B6D4"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <span className="font-space-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-500/10">
                      +{vel.thisWeek} XP this wk
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-[#94A3B8]/30 font-mono text-xs uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
              No stats initialized. Complete directives to level up.
            </div>
          )}
        </div>

        {/* Right Side Column */}
        <div className="space-y-6">
          
          {/* Circular System Health SVG Gauge */}
          <div className="glass-card p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] border-b border-white/5 pb-2 w-full text-left">
              System Core Health
            </h3>

            <div className="relative w-36 h-36 flex items-center justify-center mt-4">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Glowing status circle */}
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="url(#healthGradient)"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - systemHealth / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute text-center">
                <span className="block font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-monarch to-cyan-400 drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                  {systemHealth}%
                </span>
                <span className="font-space-mono text-[9px] uppercase tracking-widest text-white/40">Integrity</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 w-full text-[10px] font-space-mono text-white/50 text-left border-t border-white/5 pt-3">
              <div>Aura Level: <span className="text-[#A78BFA] font-bold">{animatedAura}%</span></div>
              <div>Streak: <span className="text-gold font-bold">{animatedStreak}D</span></div>
            </div>
          </div>

          {/* Daily XP Goal Progress */}
          <div className={`glass-card p-6 transition-all duration-300 ${
            todayXp >= dailyGoal ? 'border-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.08)]' : ''
          }`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                Daily XP quota progress
              </span>
              <span className="font-space-mono text-xs text-white/80">
                {todayXp} / {dailyGoal} XP
              </span>
            </div>

            <div className="w-full h-3 bg-black/60 border border-white/5 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                animate={{ width: `${goalPercent}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  todayXp >= dailyGoal
                    ? 'from-green-500 to-emerald-400'
                    : 'from-monarch to-cyan-400'
                }`}
              />
            </div>

            {todayXp >= dailyGoal ? (
              <div className="mt-2 text-center text-green-400 font-space-mono text-[9px] uppercase tracking-widest font-bold animate-pulse">
                ✓ Daily quota fulfilled! +Bonus Multiplier
              </div>
            ) : (
              <div className="mt-2 text-center text-white/30 font-space-mono text-[9px] uppercase tracking-widest">
                Acquire {dailyGoal - todayXp} more XP to secure quota
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SECTION 3 — 12-Week Contributions RPG Heatmap & Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 12-Week Contribution Grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-cyan-400 pl-3 text-[#F1F5F9]">
              RPG Contribution Heatmap
            </h2>
            <span className="font-space-mono text-[9px] text-white/30 uppercase">Last 12 Weeks</span>
          </div>

          <div className="overflow-x-auto pr-2 hide-scrollbar">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] py-1 justify-start">
              {contributionGrid.map((day, idx) => {
                let colorClass = 'bg-white/[0.02] border-white/[0.04]';
                let glowStyle = {};

                if (day.xp > 0 && day.xp <= 50) {
                  colorClass = 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400/80';
                } else if (day.xp > 50 && day.xp <= 150) {
                  colorClass = 'bg-cyan-500/40 border-cyan-400/50';
                } else if (day.xp > 150) {
                  colorClass = 'bg-monarch border-monarch-glow/50 shadow-[0_0_8px_rgba(124,58,237,0.5)]';
                }

                return (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 flex items-center justify-center font-space-mono text-[8px] font-bold cursor-help ${colorClass}`}
                    style={glowStyle}
                    title={`${day.date}: ${day.xp} XP`}
                  >
                    {day.xp > 0 ? day.xp : ''}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-[9px] font-space-mono text-white/30 uppercase">
            <span>Void</span>
            <div className="w-2.5 h-2.5 rounded bg-white/[0.02] border border-white/[0.04]" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-950/20 border border-cyan-500/20" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400/50" />
            <div className="w-2.5 h-2.5 rounded bg-monarch border-monarch-glow/50" />
            <span>Overdrive</span>
          </div>
        </div>

        {/* Motivational Quotes Panel */}
        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-void/40 to-black/60">
          <div className="flex justify-between items-center text-[10px] font-space-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
            <span>Daily Laws</span>
            <Volume2 className="w-3.5 h-3.5" />
          </div>

          <div className="my-6 min-h-[80px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="font-display font-medium text-sm text-[#F1F5F9] leading-relaxed italic">
                  "{MOTIVATIONAL_QUOTES[quoteIndex].text}"
                </p>
                <p className="font-space-mono text-[10px] text-monarch font-bold uppercase tracking-wider mt-3">
                  — {MOTIVATIONAL_QUOTES[quoteIndex].author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
            className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-space-mono text-[10px] tracking-widest uppercase hover:text-white transition-all text-center"
          >
            Reflect Next Principle
          </button>
        </div>

      </div>

      {/* SECTION 4 — Mini Boss Radar preview */}
      {activeBoss && (
        <div className="glass-card p-6 border-red-500/20 shadow-[0_0_35px_rgba(239,68,68,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-red-500 font-orbitron text-xs font-bold uppercase tracking-[0.22em] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                BOSS THREAT RADAR ACTIVE
              </div>
              <h3 className="font-orbitron text-xl font-bold uppercase tracking-wider text-white mt-1.5">
                Target: {activeBoss.boss_name}
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-space-mono text-white/40 uppercase tracking-widest pt-1">
                <span>XP reward: <span className="text-red-400 font-bold">+{activeBoss.reward_xp} XP</span></span>
                <span>Type: Monthly Battle</span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="w-full md:w-64 space-y-1">
              <div className="flex justify-between font-space-mono text-[9px] uppercase text-white/40">
                <span>Armor Integrity</span>
                <span className="text-red-400">
                  {Math.round((activeBoss.condition_current / activeBoss.condition_target) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ width: `${(activeBoss.condition_current / activeBoss.condition_target) * 100}%` }}
                />
              </div>
            </div>

            {/* Engage Button */}
            <button
              onClick={() => navigate('/boss-mode')}
              className="px-6 py-3 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400 hover:text-red-300 font-orbitron text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer grow-0 shrink-0"
            >
              ENGAGE TARGET
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Decorative RPG components */}
      <JourneyTimeline
        currentLevel={currentLevel}
        currentXP={profile?.total_xp_alltime ?? currentXp}
        avgDailyXP={200}
      />
      <DailyLaws />
    </motion.div>
  );
}
