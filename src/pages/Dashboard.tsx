import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Target, Clock, ArrowRight, Volume2, Dumbbell, Brain, Terminal,
  Video, Swords, LineChart as LineChartIcon, Flame, Star, CheckCircle2, Circle,
  TrendingUp, Calendar, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatRing } from '../components/StatRing';
import { ProgressRing } from '../components/ui/ProgressRing';
import { StatBadge } from '../components/ui/StatBadge';
import { Heatmap } from '../components/ui/Heatmap';
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

  // Time & Clock — pauses when tab is hidden to save CPU
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => { timer = setInterval(() => setCurrentTime(new Date()), 1000); };
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => document.hidden ? stop() : start();
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
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

  // ── Single O(n) pass over recentLogs → shared date+category index ──────────
  const logsIndex = useMemo(() => {
    const byDate: Record<string, number> = {};       // dateStr -> total xp
    const byCatDate: Record<string, Record<string, number>> = {}; // cat -> dateStr -> xp
    const activeDates = new Set<string>();

    for (const log of recentLogs) {
      const dateStr = log.created_at?.split('T')[0];
      if (!dateStr) continue;
      byDate[dateStr] = (byDate[dateStr] ?? 0) + (log.xp_earned || 0);
      activeDates.add(dateStr);
      const cat = log.category?.toLowerCase() ?? 'misc';
      if (!byCatDate[cat]) byCatDate[cat] = {};
      byCatDate[cat][dateStr] = (byCatDate[cat][dateStr] ?? 0) + (log.xp_earned || 0);
    }
    return { byDate, byCatDate, activeDates };
  }, [recentLogs]);

  const contributionGrid = useMemo(() => {
    const grid = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83 - today.getDay());
    for (let i = 0; i < 84; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      grid.push({ date: dateStr, xp: logsIndex.byDate[dateStr] ?? 0 });
    }
    return grid;
  }, [logsIndex]);

  const statVelocities = useMemo(() => {
    const velocities: Record<string, { thisWeek: number; sparkline: any[] }> = {};
    const oneWeekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const mappedCats: Record<string, string[]> = {
      strength: ['fitness'], endurance: ['fitness'], discipline: ['mind'], focus: ['mind'],
      stoicism: ['mind'], intelligence: ['coding'], consistency: ['mind'], wealth: ['creator'],
      charisma: ['creator'], creativity: ['creator']
    };
    stats.forEach(s => {
      const key = s.stat_name.toLowerCase();
      const cats = mappedCats[key] || ['mind'];
      let thisWeek = 0;
      const sparkline: { val: number }[] = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - idx)); d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString().split('T')[0];
        const val = cats.reduce((sum, cat) => sum + (logsIndex.byCatDate[cat]?.[dateStr] ?? 0), 0);
        if (dateStr >= oneWeekAgoStr) thisWeek += val;
        return { val };
      });
      velocities[key] = { thisWeek, sparkline };
    });
    return velocities;
  }, [stats, logsIndex]);

  // Streak mini calendar (last 30 days)
  const streakCalendar = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      return { date: d, hasActivity: logsIndex.activeDates.has(dateStr), isToday: i === 29 };
    });
  }, [logsIndex]);

  // Power Forecast
  const powerForecast = useMemo(() => {
    const totalXp = recentLogs.reduce((s, l) => s + (l.xp_earned || 0), 0);
    const uniqueDays = Object.keys(logsIndex.byDate).length;
    const avgDailyXp = uniqueDays > 0 ? totalXp / uniqueDays : 0;
    const projectedWeek = Math.round(avgDailyXp * 7);
    const projectedLevel = currentLevel + Math.floor((currentXp + projectedWeek) / xpNeeded);
    return { avgDailyXp: Math.round(avgDailyXp), projectedWeek, projectedLevel };
  }, [recentLogs, logsIndex, currentLevel, currentXp, xpNeeded]);

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
      className="p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-8 relative overflow-hidden"
    >
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-monarch/4 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/4 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ══ HERO HUD — Profile + Level + XP ══ */}
      <div className="glass-3 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 scanline-overlay opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-monarch-glow/50 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Avatar + Ring */}
          <div className="relative shrink-0">
            <ProgressRing
              percent={xpPercent}
              size={100}
              strokeWidth={5}
              gradientFrom="#F59E0B"
              gradientTo="#A78BFA"
            >
              <div className="w-[72px] h-[72px] rounded-2xl border border-monarch-glow/30 overflow-hidden bg-void flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-9 h-9 text-[#A78BFA]" />
                )}
              </div>
            </ProgressRing>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#F59E0B] to-[#FF6B00] text-black text-[8px] font-black px-2 py-0.5 rounded-md font-mono z-20 shadow-lg">
              {rank}
            </div>
          </div>

          {/* Name + Meta */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
              <span className="font-mono text-[9px] text-monarch-glow/70 tracking-[0.2em] uppercase font-bold">
                {rank}-Class Hunter • Rating: {grade}
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-black text-[#F1F5F9] uppercase tracking-wider glow-text">
              {profile?.display_name || profile?.username || 'Player_01'}
            </h1>
            <p className="font-mono text-[10px] text-white/30 mt-1">{dateFormatted} • {clockFormatted}</p>

            {/* Inline badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                <Flame className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px] text-amber-400 font-bold">{animatedStreak}d Streak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                <Star className="w-3 h-3 text-purple-400" />
                <span className="font-mono text-[10px] text-purple-400 font-bold">{animatedAura}% Aura</span>
              </div>
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[10px] text-cyan-400 font-bold">{completedTaskIds.size}/{tasks.length} Directives</span>
              </div>
            </div>
          </div>

          {/* Level + XP Column */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Level</span>
            <span className="font-display text-5xl font-black text-[#F59E0B] glow-gold tabular-nums">{animatedLevel}</span>
            <div className="w-32 space-y-1 mt-2">
              <div className="w-full h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#A78BFA] rounded-full relative"
                >
                  <div className="progress-glow absolute inset-0 rounded-full" />
                </motion.div>
              </div>
              <div className="flex justify-between font-mono text-[8px] text-white/30">
                <span>{currentXp} XP</span>
                <span>{xpNeeded} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ QUICK STATS ROW ══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-grid">
        <StatBadge icon={Flame} label="Today's XP" value={todayXp} suffix=" XP" color="#F59E0B" />
        <StatBadge icon={Target} label="Daily Goal" value={goalPercent} suffix="%" color={todayXp >= dailyGoal ? '#10B981' : '#06B6D4'} />
        <StatBadge icon={Shield} label="System Health" value={systemHealth} suffix="%" color="#A78BFA" />
        <StatBadge
          icon={TrendingUp}
          label="Power Forecast"
          value={powerForecast.avgDailyXp}
          suffix=" XP/day"
          color="#06B6D4"
          trend={powerForecast.avgDailyXp > 0 ? Math.round((powerForecast.projectedWeek / 7 / Math.max(1, powerForecast.avgDailyXp) - 1) * 100) : 0}
        />
      </div>

      {/* ══ CORE SYSTEMS NAVIGATOR ══ */}
      <div className="glass-2 p-5">
        <div className="section-divider mb-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#F1F5F9]">Core Systems</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 stagger-grid">
          {MODULE_SHORTCUTS.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.path}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(mod.path)}
                className="card-elevated flex flex-col items-center gap-2.5 p-3.5 cursor-pointer group"
                style={{ borderColor: `${mod.color}20` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: mod.bg, border: `1px solid ${mod.border}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: mod.color }} />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">{mod.label}</span>
                <span className="font-mono text-[7px] text-white/15 hidden sm:block">[{mod.key}]</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══ DAILY RITUALS + DAILY XP GOAL ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rituals */}
        <div className="lg:col-span-2 glass-2 p-6">
          <div className="section-divider mb-4">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#F1F5F9]">Daily Rituals</h2>
            <span className="font-mono text-[10px] text-amber-400 font-bold ml-auto">
              {completedRituals.size}/{DAILY_RITUALS.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DAILY_RITUALS.map((ritual) => {
              const done = completedRituals.has(ritual.id);
              return (
                <motion.button
                  key={ritual.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleRitual(ritual.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                    done
                      ? 'bg-emerald-500/8 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-lg">{ritual.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${done ? 'text-emerald-400/70 line-through' : 'text-white/80'}`}>
                      {ritual.label}
                    </p>
                    <p className="font-mono text-[9px] text-white/25">+{ritual.xp} XP</p>
                  </div>
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ritual-check-anim" />
                    : <Circle className="w-5 h-5 text-white/15 shrink-0 group-hover:text-white/30 transition-colors" />
                  }
                </motion.button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(completedRituals.size / DAILY_RITUALS.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="font-mono text-[10px] text-amber-400 font-bold whitespace-nowrap">+{ritualXpTotal} XP</span>
          </div>
        </div>

        {/* Right side: XP Goal + Power Forecast */}
        <div className="space-y-4">
          {/* Daily XP Goal */}
          <div className={`glass-2 p-5 transition-all ${todayXp >= dailyGoal ? 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.06)]' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white/50">Daily XP Quota</span>
              <span className="font-mono text-xs text-white/80 font-bold tabular-nums">{todayXp} / {dailyGoal}</span>
            </div>
            <div className="w-full h-3 bg-black/50 border border-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${goalPercent}%` }}
                className={`h-full rounded-full ${todayXp >= dailyGoal ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-monarch to-cyan-400'}`}
              >
                <div className="progress-glow absolute inset-0" />
              </motion.div>
            </div>
            <p className={`mt-2 text-center font-mono text-[9px] uppercase tracking-widest ${todayXp >= dailyGoal ? 'text-emerald-400 font-bold animate-pulse' : 'text-white/25'}`}>
              {todayXp >= dailyGoal ? '✓ Quota fulfilled! +Bonus' : `${dailyGoal - todayXp} XP remaining`}
            </p>
          </div>

          {/* Power Forecast */}
          <div className="glass-2 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-monarch/5 rounded-full blur-[30px]" />
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-monarch" />
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white/50">Power Forecast</span>
            </div>
            <div className="space-y-2.5 text-[11px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/40">Avg Daily</span>
                <span className="text-cyan-400 font-bold">{powerForecast.avgDailyXp} XP/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">7-Day Projection</span>
                <span className="text-monarch font-bold">+{powerForecast.projectedWeek} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Est. Level</span>
                <span className="text-amber-400 font-bold">LVL {powerForecast.projectedLevel}</span>
              </div>
            </div>
          </div>

          {/* System Clock */}
          <div className="glass-1 p-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Day Cycle</span>
              </div>
              <span className={hoursLeft < 4 ? "text-red-400 font-bold animate-pulse" : "text-cyan-400 font-bold"}>
                {hoursLeft.toFixed(1)} HR
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden mt-2">
              <motion.div
                animate={{ width: `${hoursPercent}%` }}
                className={`h-full rounded-full ${hoursLeft < 4 ? 'bg-red-500' : 'bg-cyan-400'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ STAT VELOCITIES ══ */}
      <div className="glass-2 p-6">
        <div className="section-divider mb-5">
          <Target className="w-4 h-4 text-monarch" />
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#F1F5F9]">Stat Velocities</h2>
        </div>
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 stagger-grid">
            {stats.map((stat) => {
              const statKey = stat.stat_name.toLowerCase();
              const vel = statVelocities[statKey] || { thisWeek: 0, sparkline: [] };
              return (
                <div key={stat.stat_name} className="card-elevated p-3 flex flex-col items-center gap-2">
                  <StatRing
                    statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                    level={stat.level}
                    xp={stat.xp % 100}
                  />
                  <div className="w-full h-8 flex items-center justify-center overflow-hidden pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vel.sparkline}>
                        <Line type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="font-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/20 px-2 py-0.5 rounded-md border border-cyan-500/10">
                    +{vel.thisWeek} XP/wk
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/20 font-mono text-xs uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
            No stats initialized. Complete directives to level up.
          </div>
        )}
      </div>

      {/* ══ CONTRIBUTION HEATMAP + QUOTE ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2 glass-2 p-6">
          <div className="section-divider mb-4">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#F1F5F9]">Activity Heatmap</h2>
            <span className="font-mono text-[9px] text-white/25 uppercase ml-auto">Last 12 Weeks</span>
          </div>
          <div className="overflow-x-auto hide-scrollbar">
            <Heatmap
              data={contributionGrid.map(d => ({ date: d.date, value: d.xp }))}
              weeks={12}
              colors={[
                'var(--heatmap-empty)',
                'rgba(6,182,212,0.2)',
                'rgba(6,182,212,0.45)',
                'rgba(124,58,237,0.5)',
                'rgba(167,139,250,0.75)',
                '#F59E0B',
              ]}
            />
          </div>

          {/* Streak mini-calendar */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 30-Day Activity
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {streakCalendar.map((day, i) => (
                <div
                  key={i}
                  title={day.date.toLocaleDateString()}
                  className={`w-4 h-4 rounded-sm transition-all hover:scale-125 ${
                    day.isToday
                      ? 'ring-1 ring-cyan-400 ' + (day.hasActivity ? 'bg-cyan-400' : 'bg-white/10')
                      : day.hasActivity
                      ? 'bg-monarch/60'
                      : 'bg-white/[0.04]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="glass-2 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/30 uppercase tracking-widest pb-3 border-b border-white/5">
              <span>Daily Laws</span>
              <Volume2 className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 flex flex-col justify-center my-6 min-h-[100px]">
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
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-white/70 font-mono text-[10px] tracking-widest uppercase hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Next Principle <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ══ BOSS BATTLE PREVIEW ══ */}
      {activeBoss && (
        <div className="glass-3 p-6 border-red-500/15 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-[50px] pointer-events-none" />

          <div className="absolute top-4 left-4">
            <div className={`w-3 h-3 rounded-full bg-red-500 ${bossRadarPing ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`} />
            <div className={`absolute inset-0 rounded-full bg-red-500/30 ${bossRadarPing ? 'animate-ping' : ''}`} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-8">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                <Swords className="w-3 h-3" /> Boss Threat Detected
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white mt-1">{activeBoss.boss_name}</h3>
              <div className="flex items-center gap-3 text-[10px] font-mono text-white/30 uppercase">
                <span>Reward: <span className="text-red-400 font-bold">+{activeBoss.reward_xp} XP</span></span>
              </div>
            </div>

            <div className="w-full md:w-56 space-y-1">
              <div className="flex justify-between font-mono text-[9px] uppercase text-white/40">
                <span>HP</span>
                <span className="text-red-400">{Math.round((activeBoss.condition_current / activeBoss.condition_target) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-white/5 overflow-hidden rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                  style={{ width: `${(activeBoss.condition_current / activeBoss.condition_target) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/boss-mode')}
              className="px-5 py-3 rounded-xl bg-red-950/20 hover:bg-red-950/30 border border-red-500/25 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] text-red-400 hover:text-red-300 font-display text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              Engage <ArrowRight className="w-4 h-4" />
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
