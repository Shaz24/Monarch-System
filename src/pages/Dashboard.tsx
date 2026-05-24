import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Target, Clock, ArrowRight, Volume2, Dumbbell, Brain, Terminal,
  Video, Swords, LineChart as LineChartIcon, Flame, Star, CheckCircle2, Circle,
  TrendingUp, Calendar, ChevronRight
} from 'lucide-react';
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
import toast from 'react-hot-toast';

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

const DAILY_RITUALS = [
  { id: 'cold_shower', label: 'Cold Shower Protocol', icon: '🚿', xp: 25 },
  { id: 'meditation', label: '10-min Meditation', icon: '🧘', xp: 20 },
  { id: 'workout', label: 'Physical Training', icon: '💪', xp: 40 },
  { id: 'reading', label: 'Read 30 Minutes', icon: '📖', xp: 30 },
  { id: 'journaling', label: 'Journal Entry', icon: '✍️', xp: 20 },
  { id: 'no_social', label: 'No Social Media AM', icon: '📵', xp: 15 },
];

const MODULE_SHORTCUTS = [
  { path: '/schedule', label: 'Directives', icon: Target, color: '#A78BFA', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', key: 'S' },
  { path: '/fitness', label: 'Physical', icon: Dumbbell, color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', key: 'F' },
  { path: '/mind', label: 'Mental', icon: Brain, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', key: 'M' },
  { path: '/coding', label: 'Engineering', icon: Terminal, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', key: 'C' },
  { path: '/creator', label: 'Broadcast', icon: Video, color: '#F97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', key: 'R' },
  { path: '/boss-mode', label: 'Boss Mode', icon: Swords, color: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)', key: 'B' },
  { path: '/analytics', label: 'Analytics', icon: LineChartIcon, color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', key: 'A' },
];

interface DashboardBoss {
  id: string;
  boss_name: string;
  condition_target: number;
  condition_current: number;
  reward_xp: number;
  is_completed: boolean;
}

// Typewriter hook
function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
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
  const [bossRadarPing, setBossRadarPing] = useState(false);

  // Daily rituals state
  const [completedRituals, setCompletedRituals] = useState<Set<string>>(() => {
    const todayKey = `monarch_rituals_${new Date().toISOString().split('T')[0]}`;
    const saved = localStorage.getItem(todayKey);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const saveRituals = useCallback((newSet: Set<string>) => {
    const todayKey = `monarch_rituals_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, JSON.stringify(Array.from(newSet)));
  }, []);

  const toggleRitual = (id: string) => {
    setCompletedRituals(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const ritual = DAILY_RITUALS.find(r => r.id === id);
        if (ritual) toast.success(`+${ritual.xp} XP — ${ritual.label} complete!`, { icon: ritual.icon });
      }
      saveRituals(next);
      return next;
    });
  };

  const ritualXpTotal = Array.from(completedRituals).reduce((sum, id) => {
    const r = DAILY_RITUALS.find(x => x.id === id);
    return sum + (r?.xp ?? 0);
  }, 0);

  // Time & Clock
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

  // Boss radar ping
  useEffect(() => {
    if (!activeBoss) return;
    const interval = setInterval(() => setBossRadarPing(p => !p), 2000);
    return () => clearInterval(interval);
  }, [activeBoss]);

  // Fetch active boss & logs
  useEffect(() => {
    if (!user) return;
    const MONTH_YEAR = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const fetchDashboardAdditions = async () => {
      if (!isSupabaseConfigured) {
        const localKey = `monarch_boss_battles_${user.id}_${MONTH_YEAR}`;
        const raw = localStorage.getItem(localKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as DashboardBoss[];
            setActiveBoss(parsed.find(b => !b.is_completed) || null);
          } catch (e) { console.error(e); }
        }

        const categories = ['fitness', 'mind', 'coding', 'creator'];
        const allLogs: any[] = [];
        categories.forEach(cat => {
          const raw = localStorage.getItem(`monarch_logs_${cat}_${user.id}`);
          if (raw) { try { allLogs.push(...JSON.parse(raw)); } catch (e) {} }
        });
        setRecentLogs(allLogs);
      } else {
        try {
          const { data } = await supabase.from('boss_battles').select('*').eq('user_id', user.id).eq('is_completed', false).order('id', { ascending: true }).limit(1);
          if (data && data.length > 0) setActiveBoss(data[0] as DashboardBoss);
        } catch (e) {}
        try {
          const { data } = await supabase.from('activity_logs').select('*').eq('user_id', user.id);
          if (data) setRecentLogs(data);
        } catch (e) {}
      }
    };

    fetchDashboardAdditions();
  }, [user]);

  const currentLevel = profile?.current_level ?? 1;
  const currentXp = profile?.current_xp ?? 0;
  const xpNeeded = currentLevel * 100;
  const xpPercent = Math.min(100, Math.round((currentXp % xpNeeded) / xpNeeded * 100));
  const rank = getRankFromLevel(currentLevel);

  const animatedLevel = useCountUp(currentLevel);
  const animatedAura = useCountUp(profile?.aura_level ?? 100);
  const animatedStreak = useCountUp(profile?.streak_days ?? 0);

  const hoursLeft = 23 - currentTime.getHours() + (60 - currentTime.getMinutes()) / 60;
  const hoursPercent = (hoursLeft / 24) * 100;
  const clockFormatted = currentTime.toLocaleTimeString([], { hour12: false });
  const dateFormatted = currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const todayXp = useMemo(() => {
    const logsToday = recentLogs.filter(log => new Date(log.created_at) >= todayStart);
    return logsToday.reduce((sum, log) => sum + (log.xp_earned || 0), 0) + completedTaskIds.size * 15 + ritualXpTotal;
  }, [recentLogs, completedTaskIds, todayStart, ritualXpTotal]);

  const dailyGoal = 200;
  const goalPercent = Math.min(100, Math.round((todayXp / dailyGoal) * 100));

  const systemHealth = useMemo(() => {
    const streakVal = Math.min(100, (profile?.streak_days ?? 0) * 10);
    const avgStatLevel = stats.length > 0 ? (stats.reduce((acc, s) => acc + s.level, 0) / stats.length) : 1;
    const statVal = Math.min(100, avgStatLevel * 8);
    const tasksVal = tasks.length > 0 ? (completedTaskIds.size / tasks.length) * 100 : 100;
    return Math.round((streakVal * 0.3) + (statVal * 0.4) + (tasksVal * 0.3));
  }, [profile, stats, tasks, completedTaskIds]);

  const contributionGrid = useMemo(() => {
    const grid = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83 - today.getDay());
    for (let i = 0; i < 84; i++) {
      const currentDate = new Date(startDate); currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const nextDay = new Date(currentDate); nextDay.setDate(currentDate.getDate() + 1);
      const dayLogs = recentLogs.filter(log => { const d = new Date(log.created_at); return d >= currentDate && d < nextDay; });
      grid.push({ date: dateStr, xp: dayLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0) });
    }
    return grid;
  }, [recentLogs]);

  const statVelocities = useMemo(() => {
    const velocities: Record<string, { thisWeek: number; sparkline: any[] }> = {};
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    stats.forEach(s => {
      const key = s.stat_name.toLowerCase();
      const mappedCats: Record<string, string[]> = {
        strength: ['fitness'], endurance: ['fitness'], discipline: ['mind'], focus: ['mind'],
        stoicism: ['mind'], intelligence: ['coding'], consistency: ['mind'], wealth: ['creator'],
        charisma: ['creator'], creativity: ['creator']
      };
      const cats = mappedCats[key] || ['mind'];
      const currentCatLogs = recentLogs.filter(log => cats.includes(log.category?.toLowerCase()));
      const weeklyLogs = currentCatLogs.filter(log => new Date(log.created_at) >= oneWeekAgo);
      const sparklineData = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - idx)); d.setHours(0,0,0,0);
        const nextD = new Date(d); nextD.setDate(d.getDate() + 1);
        return { val: currentCatLogs.filter(log => { const c = new Date(log.created_at); return c >= d && c < nextD; }).reduce((sum, l) => sum + (l.xp_earned || 0), 0) };
      });
      velocities[key] = { thisWeek: weeklyLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0), sparkline: sparklineData };
    });
    return velocities;
  }, [stats, recentLogs]);

  // Power Forecast
  const powerForecast = useMemo(() => {
    const avgDailyXp = recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + (l.xp_earned || 0), 0) / Math.max(1, [...new Set(recentLogs.map(l => l.created_at?.split('T')[0]))].length)
      : 0;
    const projectedWeek = Math.round(avgDailyXp * 7);
    const projectedLevel = currentLevel + Math.floor((currentXp + projectedWeek) / xpNeeded);
    return { avgDailyXp: Math.round(avgDailyXp), projectedWeek, projectedLevel };
  }, [recentLogs, currentLevel, currentXp, xpNeeded]);

  // Streak mini calendar (last 30 days)
  const streakCalendar = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const nextD = new Date(d); nextD.setDate(d.getDate() + 1);
      const hasActivity = recentLogs.some(l => { const c = new Date(l.created_at); return c >= d && c < nextD; });
      days.push({ date: d, hasActivity, isToday: i === 0 });
    }
    return days;
  }, [recentLogs]);

  // Typewriter for quote
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const { displayed: displayedQuote, done: quoteDone } = useTypewriter(currentQuote.text, 35);

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
      className="p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 relative overflow-hidden"
    >
      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-monarch/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Floating hexagon particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="hex-particle absolute text-monarch/20"
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 4) * 22}%`,
              fontSize: `${16 + (i % 3) * 12}px`,
              '--duration': `${7 + i * 1.5}s`,
              animationDelay: `${i * 0.8}s`,
            } as React.CSSProperties}
          >
            ⬡
          </div>
        ))}
      </div>

      {/* ══ SECTION 1 — Profile + Clock ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="absolute inset-0 scanline-overlay opacity-30" />
          
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-xl border border-monarch-glow/30 flex items-center justify-center bg-void z-10 overflow-hidden avatar-ring">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-12 h-12 text-[#A78BFA] animate-pulse" />
              )}
            </div>
            {/* Rank badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#F59E0B] to-[#FF6B00] text-black text-[9px] font-black px-2 py-0.5 rounded font-mono z-20">
              {rank}
            </div>
          </div>
          
          <div className="flex-1 w-full z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="font-display text-[10px] text-[#A78BFA] tracking-widest uppercase font-bold">
                  {rank}-Class Hunter • Rating: {grade}
                </p>
                <h1 className="font-display text-3xl font-black text-[#F1F5F9] uppercase tracking-wider glow-text mt-1">
                  {profile?.display_name || profile?.username || 'Player_01'}
                </h1>
                <p className="font-mono text-[10px] text-white/30 mt-1">{dateFormatted}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-[10px] text-[#94A3B8] tracking-widest uppercase">LVL</p>
                <p className="font-display text-4xl font-bold text-[#F59E0B] glow-gold">{animatedLevel}</p>
              </div>
            </div>

            {/* XP Bar with glow effect */}
            <div className="w-full h-4 bg-void/50 border border-white/5 rounded-full relative overflow-hidden mt-4 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-monarch to-[#A78BFA] relative rounded-full"
              >
                <div className="progress-glow absolute inset-0 rounded-full" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[10px] text-[#94A3B8] tracking-wide">
              <span>{currentXp} XP</span>
              <span>{xpNeeded} XP to next level</span>
            </div>

            {/* Streak + Aura pills */}
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Flame className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px] text-amber-400 font-bold">{animatedStreak} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3 text-purple-400" />
                <span className="font-mono text-[10px] text-purple-400 font-bold">{animatedAura}% Aura</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clock + System Health */}
        <div className="glass-card p-6 flex flex-col justify-between border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span className="font-display text-[10px] font-bold uppercase tracking-widest">Chronos Radar</span>
            </div>
          </div>

          <div className="my-3 text-center">
            <span className="font-mono text-4xl font-bold text-white tracking-widest">{clockFormatted}</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-white/50">
              <span>Day Cycle Remaining</span>
              <span className={hoursLeft < 4 ? "text-red-500 font-bold animate-pulse" : "text-cyan-400"}>
                {hoursLeft.toFixed(1)} HR
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/60 border border-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${hoursPercent}%` }}
                className={`h-full rounded-full ${hoursLeft < 4 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'}`}
              />
            </div>

            {/* System Health compact gauge */}
            <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/5">
              <span className="text-white/40 uppercase">System Integrity</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-monarch to-cyan-400 rounded-full"
                    style={{ width: `${systemHealth}%` }}
                  />
                </div>
                <span className="text-cyan-400 font-bold">{systemHealth}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 2 — Quick Module Navigator ══ */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-monarch pl-3 text-[#F1F5F9]">
            Core Systems
          </h2>
          <span className="font-mono text-[9px] text-white/30 uppercase">Quick Access</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 stagger-grid">
          {MODULE_SHORTCUTS.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.path}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(mod.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer group"
                style={{ background: mod.bg, borderColor: mod.border }}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: mod.color }} />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">{mod.label}</span>
                <span className="font-mono text-[8px] text-white/20 hidden sm:block">[{mod.key}]</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══ SECTION 3 — Daily Rituals + Daily XP ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Rituals Checklist */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-amber-500 pl-3 text-[#F1F5F9]">
              Daily Rituals Protocol
            </h2>
            <span className="font-mono text-[10px] text-amber-400 font-bold">
              {completedRituals.size}/{DAILY_RITUALS.length} Complete
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DAILY_RITUALS.map((ritual) => {
              const done = completedRituals.has(ritual.id);
              return (
                <motion.button
                  key={ritual.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleRitual(ritual.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer ${
                    done
                      ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'bg-black/30 border-white/5 hover:border-white/15'
                  }`}
                >
                  <span className="text-xl">{ritual.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-xs ${done ? 'text-green-400 line-through opacity-70' : 'text-white/80'}`}>
                      {ritual.label}
                    </p>
                    <p className="font-mono text-[9px] text-white/30">+{ritual.xp} XP</p>
                  </div>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 ritual-check-anim" />
                    : <Circle className="w-4 h-4 text-white/20 shrink-0" />
                  }
                </motion.button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="w-full h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(completedRituals.size / DAILY_RITUALS.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="ml-3 font-mono text-[10px] text-amber-400 font-bold whitespace-nowrap">
              +{ritualXpTotal} XP
            </span>
          </div>
        </div>

        {/* Right Column: Daily XP + Power Forecast */}
        <div className="space-y-4">
          {/* Daily XP Goal */}
          <div className={`glass-card p-5 transition-all duration-300 ${todayXp >= dailyGoal ? 'border-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.08)]' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Daily XP Quota</span>
              <span className="font-mono text-xs text-white/80">{todayXp} / {dailyGoal}</span>
            </div>
            <div className="w-full h-3 bg-black/60 border border-white/5 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                animate={{ width: `${goalPercent}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${todayXp >= dailyGoal ? 'from-green-500 to-emerald-400' : 'from-monarch to-cyan-400'}`}
              >
                <div className="progress-glow absolute inset-0" />
              </motion.div>
            </div>
            {todayXp >= dailyGoal ? (
              <div className="mt-2 text-center text-green-400 font-mono text-[9px] uppercase tracking-widest font-bold animate-pulse">
                ✓ Daily quota fulfilled! +Bonus Multiplier
              </div>
            ) : (
              <div className="mt-2 text-center text-white/30 font-mono text-[9px] uppercase tracking-widest">
                {dailyGoal - todayXp} XP remaining
              </div>
            )}
          </div>

          {/* Power Forecast */}
          <div className="glass-card p-5 border-monarch/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-monarch/5 rounded-full blur-[30px]" />
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-monarch" />
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Power Forecast</span>
            </div>
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-white/40">Avg Daily XP</span>
                <span className="text-cyan-400 font-bold">{powerForecast.avgDailyXp} XP/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">7-Day Projection</span>
                <span className="text-monarch font-bold">+{powerForecast.projectedWeek} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Est. Future Level</span>
                <span className="text-amber-400 font-bold">LVL {powerForecast.projectedLevel}</span>
              </div>
            </div>
            {powerForecast.avgDailyXp === 0 && (
              <p className="text-white/20 font-mono text-[9px] uppercase mt-2">Log activities to generate forecast</p>
            )}
          </div>
        </div>
      </div>

      {/* ══ SECTION 4 — Stat Velocities ══ */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-monarch pl-3 text-[#F1F5F9]">
            Player Stat Velocities
          </h2>
          <Target className="w-4 h-4 text-monarch" />
        </div>
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 stagger-grid">
            {stats.map((stat) => {
              const statKey = stat.stat_name.toLowerCase();
              const vel = statVelocities[statKey] || { thisWeek: 0, sparkline: [] };
              return (
                <div key={stat.stat_name} className="flex flex-col items-center p-3 rounded-lg bg-black/20 border border-white/[0.03] space-y-2 hover:border-monarch/20 transition-all">
                  <StatRing
                    statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                    level={stat.level}
                    xp={stat.xp % 100}
                  />
                  <div className="w-full h-8 flex items-center justify-center overflow-hidden pointer-events-none mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vel.sparkline}>
                        <Line type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="font-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-500/10">
                    +{vel.thisWeek} XP wk
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

      {/* ══ SECTION 5 — Heatmap + Streak Calendar + Quote ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 12-Week Contribution Heatmap */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest border-l-2 border-cyan-400 pl-3 text-[#F1F5F9]">
              RPG Contribution Heatmap
            </h2>
            <span className="font-mono text-[9px] text-white/30 uppercase">Last 12 Weeks</span>
          </div>
          <div className="overflow-x-auto pr-2 hide-scrollbar">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] py-1 justify-start">
              {contributionGrid.map((day, idx) => {
                let colorClass = 'bg-white/[0.02] border-white/[0.04]';
                if (day.xp > 0 && day.xp <= 50) colorClass = 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400/80';
                else if (day.xp > 50 && day.xp <= 150) colorClass = 'bg-cyan-500/40 border-cyan-400/50';
                else if (day.xp > 150) colorClass = 'bg-monarch border-monarch-glow/50 shadow-[0_0_8px_rgba(124,58,237,0.5)]';
                return (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 flex items-center justify-center font-mono text-[8px] font-bold cursor-help ${colorClass}`}
                    title={`${day.date}: ${day.xp} XP`}
                  >
                    {day.xp > 0 ? day.xp : ''}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[9px] font-mono text-white/30 uppercase">
            <span>Void</span>
            <div className="w-2.5 h-2.5 rounded bg-white/[0.02] border border-white/[0.04]" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-950/20 border border-cyan-500/20" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400/50" />
            <div className="w-2.5 h-2.5 rounded bg-monarch border-monarch-glow/50" />
            <span>Overdrive</span>
          </div>

          {/* Streak mini-calendar */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-[9px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 30-Day Activity
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {streakCalendar.map((day, i) => (
                <div
                  key={i}
                  title={day.date.toLocaleDateString()}
                  className={`w-4 h-4 rounded-sm transition-all hover:scale-110 ${
                    day.isToday
                      ? 'ring-1 ring-cyan-400 ' + (day.hasActivity ? 'bg-cyan-400' : 'bg-white/10')
                      : day.hasActivity
                      ? 'bg-monarch/70'
                      : 'bg-white/[0.04]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Quote Panel */}
        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-void/40 to-black/60">
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
            <span>Daily Laws</span>
            <Volume2 className="w-3.5 h-3.5" />
          </div>

          <div className="my-6 min-h-[100px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className={`font-display font-medium text-sm text-[#F1F5F9] leading-relaxed italic ${!quoteDone ? 'typewriter-cursor' : ''}`}>
                  "{displayedQuote}"
                </p>
                <AnimatePresence>
                  {quoteDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-[10px] text-monarch font-bold uppercase tracking-wider mt-3"
                    >
                      — {currentQuote.author}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
            className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono text-[10px] tracking-widest uppercase hover:text-white transition-all text-center flex items-center justify-center gap-2"
          >
            Next Principle
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ══ SECTION 6 — Boss Battle Preview ══ */}
      {activeBoss && (
        <div className="glass-card p-6 border-red-500/20 shadow-[0_0_35px_rgba(239,68,68,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
          {/* Animated radar ping */}
          <div className="absolute top-4 left-4">
            <div className={`w-3 h-3 rounded-full bg-red-500 ${bossRadarPing ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`} />
            <div className={`absolute inset-0 rounded-full bg-red-500/30 ${bossRadarPing ? 'animate-ping' : ''}`} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-8">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase tracking-[0.22em] animate-pulse">
                BOSS THREAT RADAR ACTIVE
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white mt-1.5">
                Target: {activeBoss.boss_name}
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest pt-1">
                <span>XP Reward: <span className="text-red-400 font-bold">+{activeBoss.reward_xp} XP</span></span>
                <span>Type: Monthly Battle</span>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-1">
              <div className="flex justify-between font-mono text-[9px] uppercase text-white/40">
                <span>Armor Integrity</span>
                <span className="text-red-400">{Math.round((activeBoss.condition_current / activeBoss.condition_target) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-white/5 overflow-hidden rounded">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ width: `${(activeBoss.condition_current / activeBoss.condition_target) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/boss-mode')}
              className="px-6 py-3 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400 hover:text-red-300 font-display text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer grow-0 shrink-0"
            >
              ENGAGE TARGET
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Decorative RPG components */}
      <JourneyTimeline currentLevel={currentLevel} currentXP={profile?.total_xp_alltime ?? currentXp} avgDailyXP={200} />
      <DailyLaws />
    </motion.div>
  );
}
