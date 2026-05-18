import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Dumbbell, Timer, Flame, Plus, Scale,
  Moon, Target, TrendingUp, ChevronDown, ChevronUp, Zap, AlertTriangle, Trophy, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, YAxis } from 'recharts';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';
import { SecondBodyProtocol } from '../components/enhanced/SecondBodyProtocol';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { auraOnWorkout } from '../lib/auraService';
import { getSecondBodyStage } from '../lib/rpgEnhanced';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';
import { sounds } from '../lib/sound';

const WORKOUT_TYPES = [
  { label: 'Weightlifting', icon: '🏋️', stats: ['strength'], baseXpRate: 2.5 },
  { label: 'Calisthenics',  icon: '💪', stats: ['strength', 'endurance'], baseXpRate: 2.2 },
  { label: 'Cardio',        icon: '🏃', stats: ['endurance'], baseXpRate: 2.0 },
  { label: 'Martial Arts',  icon: '🥊', stats: ['strength', 'endurance'], baseXpRate: 3.0 },
  { label: 'Yoga / Stretch',icon: '🧘', stats: ['endurance'], baseXpRate: 1.5 },
  { label: 'HIIT',          icon: '⚡', stats: ['strength', 'endurance'], baseXpRate: 2.8 },
];

const EXERCISE_LIBRARY = [
  { name: 'Deadlift', category: 'Back/Legs', baseDifficulty: 'S' },
  { name: 'Barbell Squat', category: 'Legs', baseDifficulty: 'S' },
  { name: 'Bench Press', category: 'Chest', baseDifficulty: 'A' },
  { name: 'Overhead Press', category: 'Shoulders', baseDifficulty: 'A' },
  { name: 'Weighted Pull-up', category: 'Back', baseDifficulty: 'A' },
  { name: 'Bicep Curl', category: 'Arms', baseDifficulty: 'C' },
  { name: 'Dips', category: 'Arms/Chest', baseDifficulty: 'B' },
  { name: 'Push-up', category: 'Chest', baseDifficulty: 'D' },
  { name: 'Plank', category: 'Core', baseDifficulty: 'D' }
];

const INTENSITY_MULTI: Record<string, number> = { Low: 0.7, Medium: 1.0, High: 1.5 };
const INTENSITY_COLOR: Record<string, string> = {
  Low: '#334155', Medium: '#00D4FF', High: '#ff5a00',
};

const TYPE_ICON: Record<string, string> = Object.fromEntries(
  WORKOUT_TYPES.map(w => [w.label, w.icon])
);

const TODAY = new Date().toISOString().split('T')[0];

export default function Fitness() {
  const { addXpParticle } = useUIStore();
  const { user } = useAuthStore();
  const { logs, addLog, loading: logsLoading } = useActivityLogs('fitness');
  const { stats, profile } = useProfile();
  const currentLevel = profile?.current_level ?? 1;

  // Workout form
  const [wType, setWType] = useState('Weightlifting');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);

  // Exercise builder form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEx, setSelectedEx] = useState(EXERCISE_LIBRARY[0]);
  const [weightInput, setWeightInput] = useState('60');
  const [repsInput, setRepsInput] = useState('10');

  // Body metrics form
  const [showMetrics, setShowMetrics] = useState(false);
  const [weight, setWeight] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [sleepHrs, setSleepHrs] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  // Historical Weight Logs for trend chart
  const [weightHistory, setWeightHistory] = useState<any[]>([]);

  // PR highlight
  const [recentPr, setRecentPr] = useState<{ exercise: string; weight: number } | null>(null);

  // Fetch weight logs
  useEffect(() => {
    if (!user) return;

    const fetchWeightLogs = async () => {
      if (!isSupabaseConfigured) {
        // Fetch last 10 days from localstorage fallback
        const mockWeight = [];
        for (let i = 9; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const raw = localStorage.getItem(`monarch_fitness_metrics_${user.id}_${dateStr}`);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.weight_kg) {
                mockWeight.push({
                  date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  weight: parsed.weight_kg
                });
              }
            } catch (e) {}
          }
        }
        // Fallback seed
        if (mockWeight.length === 0) {
          setWeightHistory([
            { date: 'May 10', weight: 78.5 },
            { date: 'May 12', weight: 78.2 },
            { date: 'May 14', weight: 78.4 },
            { date: 'May 16', weight: 77.9 },
            { date: 'May 18', weight: 77.6 }
          ]);
        } else {
          setWeightHistory(mockWeight);
        }
      } else {
        try {
          const { data } = await supabase
            .from('fitness_logs')
            .select('date,weight_kg')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .limit(15);
          if (data) {
            setWeightHistory(data.map(d => ({
              date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              weight: d.weight_kg
            })));
          }
        } catch (e) {}
      }
    };

    fetchWeightLogs();
  }, [user, savingMetrics]);

  // Compute stat details
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };
  const strengthStat  = getStat('strength');
  const enduranceStat = getStat('endurance');

  const stage = getSecondBodyStage(currentLevel);

  // 1. Muscle group frequency heatmap (calculate from today's exercises)
  const muscleGroups = useMemo(() => {
    const trained = { chest: false, back: false, legs: false, shoulders: false, arms: false, core: false };
    const todayLogs = logs.filter(l => l.created_at.startsWith(TODAY));

    todayLogs.forEach(l => {
      const type = l.activity_type.toLowerCase();
      const n = (l.metadata?.exerciseName || '').toLowerCase();
      if (type.includes('weight') || type.includes('calisthenics')) {
        if (n.includes('bench') || n.includes('push') || n.includes('dip')) trained.chest = true;
        if (n.includes('dead') || n.includes('pull') || n.includes('row')) trained.back = true;
        if (n.includes('squat') || n.includes('dead') || n.includes('lunge')) trained.legs = true;
        if (n.includes('overhead') || n.includes('press')) trained.shoulders = true;
        if (n.includes('curl') || n.includes('arm') || n.includes('dip')) trained.arms = true;
        if (n.includes('plank') || n.includes('sit') || n.includes('core')) trained.core = true;
      }
    });

    return trained;
  }, [logs]);

  // 2. Cooldown Warning: Alert if 3 strength sessions inside rolling 24-hours
  const isCooldownWarningActive = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentStrengthLogs = logs.filter(l => {
      const cat = l.activity_type;
      const created = new Date(l.created_at);
      return (cat === 'Weightlifting' || cat === 'Calisthenics' || cat === 'HIIT') && created >= oneDayAgo;
    });
    return recentStrengthLogs.length >= 3;
  }, [logs]);

  // 3. Weekly chart data
  const weeklyChart = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
      const totalXP = dayLogs.reduce((s, l) => s + l.xp_earned, 0);
      const totalMin = dayLogs.reduce((s, l) => s + l.duration_minutes, 0);
      return { day: days[d.getDay()], xp: totalXP, minutes: totalMin, date: dateStr };
    });
  }, [logs]);

  const totalSessions = logs.length;
  const totalMinutes  = logs.reduce((s, l) => s + l.duration_minutes, 0);
  const totalXP       = logs.reduce((s, l) => s + l.xp_earned, 0);
  const thisWeekSessions = weeklyChart.filter(d => d.xp > 0).length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const dur = parseInt(duration) || 0;
    const multi = INTENSITY_MULTI[intensity] ?? 1.0;
    const wt = WORKOUT_TYPES.find(w => w.label === wType) ?? WORKOUT_TYPES[0];
    const xpEarned = Math.round(wt.baseXpRate * dur * multi);
    const statCats = wt.stats;

    await addLog(wType, dur, xpEarned, { intensity, notes: notes.trim() }, statCats);

    if (user) await auraOnWorkout(user.id).catch(console.error);

    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success(`+${xpEarned} XP — Training logged. The body adapts.`);
    setNotes('');
    setLogging(false);
  };

  // Log customized exercise sets
  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);

    const reps = parseInt(repsInput) || 1;
    const weightVal = parseFloat(weightInput) || 0;
    const xpEarned = Math.round(5 + (weightVal * 0.1) + reps); // dynamic XP formula

    // Check if new PR
    const prKey = `monarch_pr_${user?.id}_${selectedEx.name.toLowerCase()}`;
    const previousMax = parseFloat(localStorage.getItem(prKey) || '0');

    if (weightVal > previousMax) {
      localStorage.setItem(prKey, weightVal.toString());
      setRecentPr({ exercise: selectedEx.name, weight: weightVal });
      sounds.playFanfare();
      toast.success(`🏆 NEW PERSONAL RECORD: ${selectedEx.name} ${weightVal}kg established!`);
    } else {
      sounds.playChime();
    }

    await addLog(
      'Weightlifting', 
      10, 
      xpEarned, 
      { 
        intensity: 'High', 
        exerciseName: selectedEx.name,
        weight: weightVal, 
        reps,
        notes: `Trained ${selectedEx.name} @ ${weightVal}kg x ${reps} reps`
      }, 
      ['strength']
    );

    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    setLogging(false);
  };

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingMetrics(true);
    const payload: Record<string, number | string> = { user_id: user.id, date: TODAY };
    if (weight)   payload.weight_kg     = parseFloat(weight);
    if (protein)  payload.protein_g     = parseInt(protein);
    if (calories) payload.calories      = parseInt(calories);
    if (bodyFat)  payload.body_fat_pct  = parseFloat(bodyFat);
    if (sleepHrs) payload.sleep_hours   = parseFloat(sleepHrs);

    if (!isSupabaseConfigured) {
      try {
        const localKey = `monarch_fitness_metrics_${user.id}_${TODAY}`;
        localStorage.setItem(localKey, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save local metrics:', err);
      }
      setSavingMetrics(false);
      toast.success('Body metrics saved.');
      setShowMetrics(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('fitness_logs')
        .upsert(payload, { onConflict: 'user_id,date' });

      setSavingMetrics(false);
      if (error) { toast.error('Failed to save metrics.'); return; }
      toast.success('Body metrics saved.');
      setShowMetrics(false);
    } catch (err) {
      console.error(err);
      setSavingMetrics(false);
      toast.error('Failed to save metrics.');
    }
  };

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-8"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center bg-red-950/20 border border-red-500/40">
            <Activity className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold uppercase tracking-widest text-white">
              Physical <span className="text-red-500">Conditioning</span>
            </h1>
            <p className="font-space-mono text-xs text-white/40 tracking-widest uppercase mt-1">
              Build the vessel to wield the aura.
            </p>
          </div>
        </div>
        
        <div className="px-4 py-2 text-center bg-red-950/10 border border-red-500/30">
          <p className="font-space-mono text-[10px] text-white/30 uppercase tracking-widest">Current Stage</p>
          <p className="font-orbitron text-sm font-bold text-red-500 uppercase mt-0.5">{stage.name}</p>
        </div>
      </div>

      {/* OVERTRAINING COOLDOWN WARNING */}
      {isCooldownWarningActive && (
        <div className="glass-panel p-4 border-l-4 border-red-600 bg-red-950/20 flex items-center gap-4 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-orbitron text-xs font-bold text-red-500 uppercase tracking-widest">DANGER: OVERTRAINING DETECTED</h4>
            <p className="font-space-mono text-[10px] text-white/60 uppercase mt-0.5">
              3 Strength logs in under 24 hours. Initiate active rest cooldown to protect aura recovery!
            </p>
          </div>
        </div>
      )}

      {/* LIFT PR CELEBRATION BANNER */}
      {recentPr && (
        <div className="glass-panel p-5 border border-green-500/30 bg-green-950/20 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-gold animate-bounce" />
            <div>
              <h4 className="font-orbitron text-sm font-black text-green-400 uppercase tracking-wider">
                PERSONAL RECORD ESTABLISHED!
              </h4>
              <p className="font-space-mono text-xs text-white/80 mt-1">
                You successfully conquered the <span className="font-bold text-white">{recentPr.exercise}</span> set at <span className="font-bold text-green-400">{recentPr.weight}kg</span>!
              </p>
            </div>
          </div>
          <button 
            onClick={() => setRecentPr(null)}
            className="px-3 py-1 bg-green-950/40 border border-green-500/20 text-green-400 text-[10px] font-space-mono uppercase tracking-widest hover:bg-green-950/60"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* STATS SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, icon: <Dumbbell className="w-4 h-4" />, color: '#ff5a00' },
          { label: 'Total Minutes',  value: `${totalMinutes}m`, icon: <Timer className="w-4 h-4" />, color: '#00D4FF' },
          { label: 'Total XP',       value: totalXP.toLocaleString(), icon: <Zap className="w-4 h-4" />, color: '#7B2FFF' },
          { label: 'This Week',      value: `${thisWeekSessions}/7`, icon: <Flame className="w-4 h-4" />, color: '#ff003c' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-black/60 border border-white/[0.03]" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>{s.icon}
              <span className="font-space-mono text-[9px] uppercase tracking-widest text-white/30">{s.label}</span>
            </div>
            <p className="font-orbitron text-2xl font-bold text-white mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* CORE BODY WORKOUT BUILDER & GRIDS */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        
        {/* Left Column: Logs, Builder, Metrics */}
        <div className="space-y-6">

          {/* Exercise Sets Builder */}
          <div className="glass-panel p-6 border-t-2 border-t-red-500 bg-void/50">
            <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Dumbbell className="w-4 h-4 text-red-500" /> Set Builder
            </h2>

            <form onSubmit={handleLogSet} className="space-y-4">
              <div>
                <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Search Exercise</label>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search library..."
                    className="w-full bg-black/40 border border-white/10 p-2.5 pl-9 text-white font-space-mono text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="max-h-[120px] overflow-y-auto border border-white/5 bg-black/20 p-1 flex flex-col gap-1 hide-scrollbar">
                  {filteredExercises.map(ex => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => setSelectedEx(ex)}
                      className={`w-full text-left px-2 py-1.5 text-xs font-space-mono transition-all flex justify-between ${
                        selectedEx.name === ex.name ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/20' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <span>{ex.name}</span>
                      <span className="text-white/20 text-[9px]">{ex.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Reps</label>
                  <input
                    type="number"
                    value={repsInput}
                    onChange={e => setRepsInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={logging}
                className="w-full py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-500 font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
              >
                Log Completed Set
              </button>
            </form>
          </div>

          {/* Quick Regimen Logger */}
          <div className="glass-panel p-6 border-t-2 border-t-[#ff5a00] bg-void/50">
            <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Plus className="w-4 h-4 text-[#ff5a00]" /> Quick Regimen
            </h2>

            <form onSubmit={handleLogWorkout} className="space-y-4">
              <div>
                <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Regimen Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKOUT_TYPES.map(w => (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => setWType(w.label)}
                      className="px-3 py-2 flex items-center gap-2 text-left transition-all font-space-mono text-[10px]"
                      style={{
                        background: wType === w.label ? 'rgba(255,90,0,0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${wType === w.label ? '#ff5a00' : 'rgba(255,255,255,0.07)'}`,
                        color: wType === w.label ? '#ff5a00' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>{w.icon}</span> {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Duration (min)</label>
                  <input
                    type="number" min="1" value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-[#ff5a00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Intensity</label>
                  <select
                    value={intensity}
                    onChange={e => setIntensity(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-[#ff5a00] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Regimen Notes</label>
                <input
                  type="text" value={notes} placeholder="Notes..."
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono text-xs focus:border-[#ff5a00] focus:outline-none placeholder:text-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={logging}
                className="w-full py-3 bg-[#ff5a00]/10 hover:bg-[#ff5a00]/20 border border-[#ff5a00]/40 text-[#ff5a00] font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
              >
                Log Regimen
              </button>
            </form>
          </div>

          {/* Metrics Drawer */}
          <div className="glass-panel border border-white/5 bg-void/30">
            <button
              onClick={() => setShowMetrics(p => !p)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-[#00D4FF]" />
                <span className="font-orbitron text-xs font-bold uppercase tracking-widest text-white">Save Body Metrics</span>
              </div>
              {showMetrics ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>

            <AnimatePresence>
              {showMetrics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSaveMetrics} className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Weight (kg)', state: weight, set: setWeight, icon: <Scale className="w-3.5 h-3.5" />, type: 'number', step: '0.1' },
                        { label: 'Body Fat %',  state: bodyFat, set: setBodyFat, icon: <Target className="w-3.5 h-3.5" />, type: 'number', step: '0.1' },
                        { label: 'Protein (g)', state: protein, set: setProtein, icon: <Flame className="w-3.5 h-3.5" />, type: 'number', step: '1' },
                        { label: 'Calories',    state: calories, set: setCalories, icon: <Zap className="w-3.5 h-3.5" />, type: 'number', step: '1' },
                        { label: 'Sleep (hrs)', state: sleepHrs, set: setSleepHrs, icon: <Moon className="w-3.5 h-3.5" />, type: 'number', step: '0.5' },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="flex items-center gap-1 font-space-mono text-[8px] text-white/30 uppercase tracking-widest mb-1">
                            {f.icon} {f.label}
                          </label>
                          <input
                            type={f.type} step={f.step} value={f.state}
                            onChange={e => f.set(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-2 text-white font-space-mono text-xs focus:border-[#00D4FF] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit" disabled={savingMetrics}
                      className="w-full py-2.5 font-orbitron text-xs font-bold uppercase tracking-widest transition-all mt-2"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.4)', color: '#00D4FF' }}
                    >
                      {savingMetrics ? 'Saving...' : 'Save Metrics'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stat Rings */}
          <div className="grid grid-cols-2 gap-4">
            <StatRing statName="Strength"  level={strengthStat.level}  xp={strengthStat.xp % 100} />
            <StatRing statName="Endurance" level={enduranceStat.level} xp={enduranceStat.xp % 100} />
          </div>

        </div>

        {/* Right Column: Heatmap, Weight Trend, Training Logs */}
        <div className="space-y-6">

          {/* Muscle group SVG Silhouette Heatmap */}
          <div className="glass-panel p-5 bg-void/50 border border-white/5 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="font-orbitron text-sm font-bold uppercase tracking-widest text-white">
                Muscle Target Heatmap
              </h3>
              <p className="font-space-mono text-[10px] text-white/40 uppercase leading-relaxed">
                Visualizing physical stress matrix based on today's logged exercises and target sets.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 font-space-mono text-[9px] uppercase">
                <div className={`flex items-center gap-2 ${muscleGroups.chest ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.chest ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Chest
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.back ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.back ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Back
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.legs ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.legs ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Legs
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.shoulders ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.shoulders ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Shoulders
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.arms ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.arms ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Arms
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.core ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.core ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Core
                </div>
              </div>
            </div>

            {/* Glowing SVG human model */}
            <div className="w-32 h-44 shrink-0 flex items-center justify-center relative bg-black/40 border border-white/5 rounded p-2">
              <svg className="w-full h-full" viewBox="0 0 100 150">
                {/* Silhouette model outline */}
                <rect x="0" y="0" width="100" height="150" fill="transparent" />
                
                {/* Head */}
                <circle cx="50" cy="18" r="8" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                {/* Neck */}
                <rect x="47" y="24" width="6" height="6" fill="#1e293b" />
                
                {/* Torso / Chest */}
                <path d="M38,30 L62,30 L58,62 L42,62 Z" fill={muscleGroups.chest ? '#ef4444' : '#1e293b'} opacity="0.8" />
                {/* Torso / Back */}
                <path d="M43,62 L57,62 L55,75 L45,75 Z" fill={muscleGroups.back ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Shoulders */}
                <circle cx="34" cy="34" r="5" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <circle cx="66" cy="34" r="5" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Arms */}
                <rect x="29" y="38" width="6" height="25" rx="3" fill={muscleGroups.arms ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="65" y="38" width="6" height="25" rx="3" fill={muscleGroups.arms ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Core */}
                <rect x="44" y="45" width="12" height="15" fill={muscleGroups.core ? '#ef4444' : '#1e293b'} opacity="0.8" />

                {/* Legs */}
                <rect x="38" y="78" width="9" height="35" rx="4" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="53" y="78" width="9" height="35" rx="4" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Lower legs */}
                <rect x="39" y="112" width="7" height="25" rx="2" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="54" y="112" width="7" height="25" rx="2" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* Historical Body Weight goal tracking chart */}
          <div className="glass-panel p-5 bg-void/50 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#00D4FF]" /> Body Weight Trajectory
              </h3>
              <span className="font-space-mono text-[9px] text-[#00D4FF] font-bold">Goal: 75.0kg</span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#444" tick={{ fill: '#777', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fill: '#777', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#080D1A', border: '1px solid #00D4FF', fontFamily: 'Space Mono', fontSize: 10 }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#00D4FF" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Output Chart */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-[#ff5a00]" /> Weekly Output
              </h3>
              <span className="font-space-mono text-xs text-white/30">{thisWeekSessions} active days</span>
            </div>
            <div className="h-44 w-full" aria-label="Weekly physical conditioning output bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart} barSize={24} aria-label="Weekly physical output Bar Chart">
                  <XAxis dataKey="day" stroke="#333" tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,90,0,0.06)' }}
                    contentStyle={{ background: '#080D1A', border: '1px solid #ff5a00', fontFamily: 'Space Mono', fontSize: 11 }}
                  />
                  <Bar dataKey="xp" radius={[2, 2, 0, 0]}>
                    {weeklyChart.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.date === TODAY ? '#ff5a00' : entry.xp > 0 ? '#ff5a0066' : '#1a1a1a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Training Archives */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Flame className="w-4 h-4 text-[#ff5a00]" /> Training Archives
              <span className="font-space-mono text-xs text-white/20 font-normal normal-case ml-1">{totalSessions} records</span>
            </h3>

            {logsLoading ? (
              <div className="space-y-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="No Conditioning Records"
                description="Initialize your body conditioning sequence. Log your first workout to start tracking and earn XP."
              />
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 hide-scrollbar">
                <AnimatePresence>
                  {logs.map((log, idx) => {
                    const intensityColor = INTENSITY_COLOR[log.metadata?.intensity] ?? '#ff5a00';
                    const icon = TYPE_ICON[log.activity_type] ?? '🏋️';
                    const date = new Date(log.created_at);
                    const isToday = log.created_at.startsWith(TODAY);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                        className="flex items-center gap-4 p-3 transition-all"
                        style={{
                          background: isToday ? 'rgba(255,90,0,0.07)' : 'rgba(0,0,0,0.35)',
                          border: `1px solid ${isToday ? 'rgba(255,90,0,0.3)' : 'rgba(255,255,255,0.04)'}`,
                          borderLeft: `3px solid ${intensityColor}`,
                        }}
                      >
                        <span className="text-xl flex-shrink-0 w-8 text-center">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-archivo-narrow text-base text-white leading-tight">{log.activity_type}</p>
                            {isToday && (
                              <span className="font-space-mono text-[9px] px-1.5 py-0.5 uppercase" style={{ background: 'rgba(255,90,0,0.2)', color: '#ff5a00', border: '1px solid rgba(255,90,0,0.4)' }}>Today</span>
                            )}
                          </div>
                          <p className="font-space-mono text-[10px] text-white/30 mt-0.5">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •{' '}
                            {log.metadata?.intensity || 'Medium'} intensity
                            {log.metadata?.notes ? ` • ${log.metadata.notes}` : ''}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-0.5">
                          <div className="font-space-mono text-sm text-white/60">{log.duration_minutes}m</div>
                          <div
                            className="font-orbitron text-xs font-bold px-2 py-0.5"
                            style={{ background: 'rgba(255,90,0,0.12)', color: '#ff5a00', border: '1px solid rgba(255,90,0,0.3)' }}
                          >
                            +{log.xp_earned} XP
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Second Body Protocol */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,90,0,0.4), transparent)' }} />
          <span className="font-space-mono text-xs text-red-500/60 uppercase tracking-[0.4em]">Second Body Protocol</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(255,90,0,0.4), transparent)' }} />
        </div>
        <SecondBodyProtocol currentLevel={currentLevel} />
      </div>

    </motion.div>
  );
}
