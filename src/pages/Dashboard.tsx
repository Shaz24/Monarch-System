import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Target, Clock, ArrowRight, Volume2, Dumbbell, Brain, Terminal,
  Video, Swords, LineChart as LineChartIcon, Flame, Star, CheckCircle2, Circle,
  TrendingUp, Calendar, ChevronRight, Zap
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

  // Time & Clock
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

  const logsIndex = useMemo(() => {
    const byDate: Record<string, number> = {};
    const byCatDate: Record<string, Record<string, number>> = {};
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

  const streakCalendar = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      return { date: d, hasActivity: logsIndex.activeDates.has(dateStr), isToday: i === 29 };
    });
  }, [logsIndex]);

  const powerForecast = useMemo(() => {
    const totalXp = recentLogs.reduce((s, l) => s + (l.xp_earned || 0), 0);
    const uniqueDays = Object.keys(logsIndex.byDate).length;
    const avgDailyXp = uniqueDays > 0 ? totalXp / uniqueDays : 0;
    const projectedWeek = Math.round(avgDailyXp * 7);
    const projectedLevel = currentLevel + Math.floor((currentXp + projectedWeek) / xpNeeded);
    return { avgDailyXp: Math.round(avgDailyXp), projectedWeek, projectedLevel };
  }, [recentLogs, logsIndex, currentLevel, currentXp, xpNeeded]);

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const { displayed: displayedQuote, done: quoteDone } = useTypewriter(currentQuote.text, 35);

  if (profileLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="font-orbitron text-xs text-monarch-glow uppercase tracking-[0.2em] animate-pulse glow-text-monarch">
          [ SYNCHRONIZING CORE MONARCH SYSTEMS... ]
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-8 relative overflow-hidden text-slate-100"
    >
      {/* Ambient background breathing orbs */}
      <div className="ambient-orb top-0 left-1/4 w-[550px] h-[550px] bg-monarch/8 -z-10 pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="ambient-orb top-1/2 right-1/4 w-[450px] h-[450px] bg-cyan-500/6 -z-10 pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="ambient-orb bottom-10 left-1/3 w-[400px] h-[400px] bg-amber-500/5 -z-10 pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* ══ HERO HUD — Character Status Sheet ══ */}
      <div className="holo-bracket-box holo-breathe p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="scan-sweep-beam" />
        <div className="absolute inset-0 bg-scanline-pattern opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Avatar + Hunter Aura Ring */}
          <div className="relative shrink-0">
            <ProgressRing
              percent={xpPercent}
              size={116}
              strokeWidth={7}
              gradientFrom="#F59E0B"
              gradientTo="#A78BFA"
            >
              <div className="w-[84px] h-[84px] rounded-2xl border border-monarch-glow/50 shadow-[0_0_25px_rgba(124,58,237,0.4)] overflow-hidden bg-void flex items-center justify-center hunter-aura">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-10 h-10 text-monarch-glow filter drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                )}
              </div>
            </ProgressRing>
            <div className="absolute -bottom-1 -right-1 rank-badge-s text-[10px] px-2.5 py-0.5 rounded-md font-orbitron z-20 shadow-[0_2px_12px_rgba(245,158,11,0.6)] border border-amber-300/60">
              {rank}-RANK
            </div>
          </div>

          {/* Name + Meta Status */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
              <span className="font-mono-tech text-[10px] text-monarch-glow tracking-[0.25em] uppercase font-bold flex items-center justify-center md:justify-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                HUNTER STATUS: ACTIVE • CLASS {rank} • RATING {grade}
              </span>
            </div>
            <h1 className="font-orbitron text-2xl md:text-4xl font-black text-white uppercase tracking-wider glow-text-monarch leading-tight">
              {profile?.display_name || profile?.username || 'SHADOW_MONARCH'}
            </h1>
            <p className="font-mono-tech text-[11px] text-white/50 mt-1 flex items-center justify-center md:justify-start gap-2">
              <span>{dateFormatted}</span>
              <span className="text-white/20">•</span>
              <span className="text-cyan-400 font-bold tracking-widest">{clockFormatted}</span>
            </p>

            {/* Inline badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mt-4">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-rajdhani text-sm text-amber-400 font-bold tracking-wide">{animatedStreak}d STREAK</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(167,139,250,0.2)]">
                <Star className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-rajdhani text-sm text-purple-400 font-bold tracking-wide">{animatedAura}% AURA</span>
              </div>
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-rajdhani text-sm text-cyan-400 font-bold tracking-wide">{completedTaskIds.size}/{tasks.length} DIRECTIVES</span>
              </div>
            </div>
          </div>

          {/* Level + XP Gauge */}
          <div className="flex flex-col items-center gap-1 shrink-0 p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[inset_0_0_25px_rgba(0,0,0,0.5)]">
            <span className="font-mono-tech text-[10px] text-monarch-glow uppercase tracking-widest font-bold">LEVEL PROGRESS</span>
            <span className="font-orbitron text-5xl font-black text-[#F59E0B] glow-text-gold tabular-nums">{animatedLevel}</span>
            <div className="w-44 space-y-1.5 mt-1.5">
              <div className="w-full h-3 bg-black/60 border border-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#F59E0B] via-[#EC4899] to-[#A78BFA] rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                />
              </div>
              <div className="flex justify-between font-mono-tech text-[9px]">
                <span className="text-white/40">{currentXp} XP</span>
                <span className="text-amber-400 font-bold">{xpNeeded} XP GOAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ QUICK STATS ROW ══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
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
      <div className="holo-bracket-box p-6 rounded-2xl relative overflow-hidden">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 rounded-full bg-gradient-to-b from-monarch to-cyan-400" />
            <h2 className="font-rajdhani text-sm font-bold uppercase tracking-widest text-white">CORE PROTOCOL MODULES</h2>
          </div>
          <span className="font-mono-tech text-[9px] text-white/40 tracking-widest uppercase">QUICK LINK SHORTCUTS</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {MODULE_SHORTCUTS.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.path}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(mod.path)}
                className="flex flex-col items-center gap-2.5 p-3.5 cursor-pointer group relative overflow-hidden transition-all duration-150 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.05]"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner"
                  style={{
                    background: mod.bg,
                    border: `1px solid ${mod.border}`,
                    boxShadow: `0 0 20px ${mod.color}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: mod.color, filter: `drop-shadow(0 0 6px ${mod.color}90)` }} />
                </div>
                <span className="font-rajdhani text-xs uppercase tracking-wider text-white/80 group-hover:text-white transition-colors font-bold">{mod.label}</span>
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-black/50 border border-white/10 font-mono-tech text-[8px] text-white/40">{mod.key}</kbd>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══ DAILY RITUALS + DAILY XP GOAL ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rituals */}
        <div className="lg:col-span-2 holo-bracket-box p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <h2 className="font-rajdhani text-sm font-bold uppercase tracking-widest text-white">Daily Rituals</h2>
            </div>
            <span className="font-mono-tech text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {completedRituals.size}/{DAILY_RITUALS.length} COMPLETE
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DAILY_RITUALS.map((ritual) => {
              const done = completedRituals.has(ritual.id);
              return (
                <motion.button
                  key={ritual.id}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -1 }}
                  onClick={() => toggleRitual(ritual.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer group ${
                    done
                      ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">{ritual.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-rajdhani text-sm font-semibold truncate transition-colors ${done ? 'text-emerald-400 line-through opacity-80' : 'text-white group-hover:text-white'}`}>
                      {ritual.label}
                    </p>
                    <p className="font-mono-tech text-[10px] text-amber-400 font-bold mt-0.5">+{ritual.xp} XP</p>
                  </div>
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    : <Circle className="w-5 h-5 text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
                  }
                </motion.button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-3 pt-3 border-t border-white/10">
            <div className="flex-1 h-2.5 bg-black/40 border border-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(completedRituals.size / DAILY_RITUALS.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="font-mono-tech text-[10px] text-amber-400 font-bold whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">+{ritualXpTotal} XP EARNED</span>
          </div>
        </div>

        {/* Right side: XP Goal + Power Forecast */}
        <div className="space-y-4">
          {/* Daily XP Goal */}
          <div className={`holo-bracket-box p-5 transition-all ${todayXp >= dailyGoal ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-rajdhani text-xs font-bold uppercase tracking-widest text-white/70">Daily XP Quota</span>
              <span className="font-mono-tech text-xs text-amber-400 font-bold tabular-nums">{todayXp} / {dailyGoal} XP</span>
            </div>
            <div className="w-full h-3 bg-black/50 border border-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${goalPercent}%` }}
                className={`h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)] ${todayXp >= dailyGoal ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-monarch via-purple-400 to-cyan-400'}`}
              />
            </div>
            <p className={`mt-2 text-center font-mono-tech text-[10px] uppercase tracking-widest ${todayXp >= dailyGoal ? 'text-emerald-400 font-bold animate-pulse' : 'text-white/40'}`}>
              {todayXp >= dailyGoal ? '✓ Quota fulfilled! +System Multiplier Active' : `${dailyGoal - todayXp} XP remaining today`}
            </p>
          </div>

          {/* Power Forecast */}
          <div className="holo-bracket-box p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="font-rajdhani text-xs font-bold uppercase tracking-widest text-white/70">Power Forecast</span>
            </div>
            <div className="space-y-2.5 text-xs font-mono-tech">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Avg Daily Velocity</span>
                <span className="text-cyan-400 font-bold">{powerForecast.avgDailyXp} XP/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">7-Day Trajectory</span>
                <span className="text-monarch-glow font-bold">+{powerForecast.projectedWeek} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Est. Rank Level</span>
                <span className="text-amber-400 font-bold">LVL {powerForecast.projectedLevel}</span>
              </div>
            </div>
          </div>

          {/* System Clock */}
          <div className="holo-bracket-box p-4">
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-white/60 uppercase">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Day Cycle</span>
              </div>
              <span className={hoursLeft < 4 ? "text-red-400 font-bold animate-pulse" : "text-cyan-400 font-bold"}>
                {hoursLeft.toFixed(1)} HR LEFT
              </span>
            </div>
            <div className="w-full h-2 bg-black/40 border border-white/10 rounded-full overflow-hidden mt-2">
              <motion.div
                animate={{ width: `${hoursPercent}%` }}
                className={`h-full rounded-full ${hoursLeft < 4 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ STAT VELOCITIES ══ */}
      <div className="holo-bracket-box p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-monarch-glow" />
            <h2 className="font-rajdhani text-sm font-bold uppercase tracking-widest text-white">Stat Velocities</h2>
          </div>
          <span className="font-mono-tech text-[9px] text-white/40 tracking-widest uppercase">7-Day Delta</span>
        </div>
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.map((stat) => {
              const statKey = stat.stat_name.toLowerCase();
              const vel = statVelocities[statKey] || { thisWeek: 0, sparkline: [] };
              return (
                <div key={stat.stat_name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col items-center gap-2 transition-all hover:border-cyan-400/40 hover:bg-white/[0.04]">
                  <StatRing
                    statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                    level={stat.level}
                    xp={stat.xp % 100}
                  />
                  <div className="w-full h-8 flex items-center justify-center overflow-hidden pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vel.sparkline}>
                        <Line type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="font-mono-tech text-[9px] text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                    +{vel.thisWeek} XP/wk
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/30 font-mono-tech text-xs uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
            No stats initialized. Complete directives to level up.
          </div>
        )}
      </div>

      {/* ══ CONTRIBUTION HEATMAP + QUOTE TERMINAL ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2 holo-bracket-box p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 className="font-rajdhani text-sm font-bold uppercase tracking-widest text-white">Activity Heatmap</h2>
            </div>
            <span className="font-mono-tech text-[10px] text-white/40 uppercase">Last 12 Weeks</span>
          </div>
          <div className="overflow-x-auto hide-scrollbar">
            <Heatmap
              data={contributionGrid.map(d => ({ date: d.date, value: d.xp }))}
              weeks={12}
              colors={[
                'var(--heatmap-empty)',
                'rgba(6,182,212,0.25)',
                'rgba(6,182,212,0.5)',
                'rgba(124,58,237,0.6)',
                'rgba(167,139,250,0.85)',
                '#F59E0B',
              ]}
            />
          </div>

          {/* Streak mini-calendar */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono-tech text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Calendar className="w-3 h-3 text-amber-400" /> 30-Day Activity Log
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {streakCalendar.map((day, i) => (
                <div
                  key={i}
                  title={day.date.toLocaleDateString()}
                  className={`w-4 h-4 rounded-sm transition-all hover:scale-125 ${
                    day.isToday
                      ? 'ring-2 ring-cyan-400 ' + (day.hasActivity ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white/20')
                      : day.hasActivity
                      ? 'bg-monarch-glow/80 shadow-[0_0_6px_rgba(167,139,250,0.4)]'
                      : 'bg-white/[0.04]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Quote Terminal */}
        <div className="holo-bracket-box p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            {/* Terminal Window Header */}
            <div className="flex justify-between items-center text-[10px] font-mono-tech pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <span className="ml-2 text-white/50 tracking-wider">// MONARCH_LAWS.SYS</span>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-monarch-glow/70" />
            </div>

            <div className="flex-1 flex flex-col justify-center my-6 min-h-[110px] pl-3 border-l-2 border-monarch-glow/60 bg-black/30 p-3 rounded-r-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-chakra font-medium text-sm md:text-base text-white leading-relaxed italic">
                    "{displayedQuote}"
                    {!quoteDone && <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse" />}
                  </p>
                  <AnimatePresence>
                    {quoteDone && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono-tech text-[11px] text-monarch-glow font-bold uppercase tracking-wider mt-3 flex items-center gap-1.5"
                      >
                        <span className="text-cyan-400">→</span> {currentQuote.author}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
              className="btn-tech-outline w-full py-2.5 text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              Next Protocol Principle <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══ BOSS BATTLE PREVIEW ══ */}
      {activeBoss && (
        <div className="holo-bracket-box p-6 border-red-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.2)] danger-aura-pulse">
          <div className="scan-sweep-beam" />
          <div className="absolute top-4 left-4">
            <div className={`w-3 h-3 rounded-full bg-red-500 ${bossRadarPing ? 'opacity-100' : 'opacity-40'} transition-opacity duration-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]`} />
            <div className={`absolute inset-0 rounded-full bg-red-500/40 ${bossRadarPing ? 'animate-ping' : ''}`} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-8">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-red-400 font-mono-tech text-[10px] font-bold uppercase tracking-[0.25em] animate-pulse">
                <Swords className="w-3.5 h-3.5 text-red-500" /> Class-S Boss Encounter Active
              </div>
              <h3 className="font-orbitron text-xl md:text-2xl font-black uppercase tracking-wider text-white mt-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] glow-text-danger">{activeBoss.boss_name}</h3>
              <div className="flex items-center gap-3 text-[10px] font-mono-tech text-white/50 uppercase">
                <span>Victory Bounty: <span className="text-amber-400 font-bold">+{activeBoss.reward_xp} XP</span></span>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-1.5">
              <div className="flex justify-between font-mono-tech text-[9px] uppercase text-white/60">
                <span>Boss Vitality</span>
                <span className="text-red-400 font-bold">{Math.round((activeBoss.condition_current / activeBoss.condition_target) * 100)}% HP</span>
              </div>
              <div className="w-full h-3 bg-black/60 border border-white/15 overflow-hidden rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${(activeBoss.condition_current / activeBoss.condition_target) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/boss-mode')}
              className="btn-hunter py-3 px-6 text-xs font-bold tracking-widest uppercase flex items-center gap-2 cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', borderColor: 'rgba(248,113,113,0.5)' }}
            >
              Engage Boss <ArrowRight className="w-4 h-4" />
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
