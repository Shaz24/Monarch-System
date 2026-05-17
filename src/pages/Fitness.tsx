import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Dumbbell, Timer, Flame, Plus, Scale,
  Droplets, Moon, Target, TrendingUp, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

// ─── Type labels per workout ─────────────────────────────────────────────────
const WORKOUT_TYPES = [
  { label: 'Weightlifting', icon: '🏋️', stats: ['strength'], baseXpRate: 2.5 },
  { label: 'Calisthenics',  icon: '💪', stats: ['strength', 'endurance'], baseXpRate: 2.2 },
  { label: 'Cardio',        icon: '🏃', stats: ['endurance'], baseXpRate: 2.0 },
  { label: 'Martial Arts',  icon: '🥊', stats: ['strength', 'endurance'], baseXpRate: 3.0 },
  { label: 'Yoga / Stretch',icon: '🧘', stats: ['endurance'], baseXpRate: 1.5 },
  { label: 'HIIT',          icon: '⚡', stats: ['strength', 'endurance'], baseXpRate: 2.8 },
];

const INTENSITY_MULTI: Record<string, number> = { Low: 0.7, Medium: 1.0, High: 1.5 };
const INTENSITY_COLOR: Record<string, string> = {
  Low: '#334155', Medium: '#00D4FF', High: '#ff5a00',
};

const TYPE_ICON: Record<string, string> = Object.fromEntries(
  WORKOUT_TYPES.map(w => [w.label, w.icon])
);

const TODAY = new Date().toISOString().split('T')[0];

// ─── Component ────────────────────────────────────────────────────────────────
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

  // Body metrics form
  const [showMetrics, setShowMetrics] = useState(false);
  const [weight, setWeight] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [sleepHrs, setSleepHrs] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };
  const strengthStat  = getStat('strength');
  const enduranceStat = getStat('endurance');

  const stage = getSecondBodyStage(currentLevel);

  // ── Weekly chart data from real logs ──────────────────────────────────────
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

    // Aura bonus for workout
    if (user) await auraOnWorkout(user.id).catch(console.error);

    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success(`+${xpEarned} XP — Training logged. The body adapts.`);
    setNotes('');
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
      // LocalStorage offline fallback
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-8"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center" style={{ background: 'rgba(255,90,0,0.12)', border: '1px solid rgba(255,90,0,0.4)' }}>
            <Activity className="w-7 h-7 text-[#ff5a00]" />
          </div>
          <div>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold uppercase tracking-widest text-white">
              Physical <span className="text-[#ff5a00]">Conditioning</span>
            </h1>
            <p className="font-space-mono text-xs text-white/40 tracking-widest uppercase mt-1">
              Build the vessel to wield the aura.
            </p>
          </div>
        </div>
        {/* Current stage badge */}
        <div
          className="px-4 py-2 text-center"
          style={{ background: 'rgba(255,90,0,0.08)', border: '1px solid rgba(255,90,0,0.3)' }}
        >
          <p className="font-space-mono text-[10px] text-white/30 uppercase tracking-widest">Current Stage</p>
          <p className="font-orbitron text-sm font-bold text-[#ff5a00] uppercase mt-0.5">{stage.name}</p>
        </div>
      </div>

      {/* ── Stats Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, icon: <Dumbbell className="w-4 h-4" />, color: '#ff5a00' },
          { label: 'Total Minutes',  value: `${totalMinutes}m`, icon: <Timer className="w-4 h-4" />, color: '#00D4FF' },
          { label: 'Total XP',       value: totalXP.toLocaleString(), icon: <Zap className="w-4 h-4" />, color: '#7B2FFF' },
          { label: 'This Week',      value: `${thisWeekSessions}/7`, icon: <Flame className="w-4 h-4" />, color: '#ff003c' },
        ].map(s => (
          <div key={s.label} className="p-4" style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${s.color}25` }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>{s.icon}
              <span className="font-space-mono text-[10px] uppercase tracking-widest text-white/30">{s.label}</span>
            </div>
            <p className="font-orbitron text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">

        {/* LEFT — Log Panel */}
        <div className="space-y-5">

          {/* Workout Logger */}
          <div className="p-6 space-y-5" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,90,0,0.25)', borderTop: '2px solid #ff5a00' }}>
            <h2 className="font-orbitron text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-[#ff5a00]" /> Log Training
            </h2>

            <form onSubmit={handleLogWorkout} className="space-y-4">
              {/* Workout type grid */}
              <div>
                <label className="block font-space-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Regimen Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKOUT_TYPES.map(w => (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => setWType(w.label)}
                      className="px-3 py-2.5 flex items-center gap-2 text-left transition-all duration-200 font-archivo-narrow text-sm"
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

              {/* Duration */}
              <div>
                <label className="block font-space-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Duration (min)</label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="number" min="1" value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 pl-10 text-white font-archivo-narrow text-base focus:border-[#ff5a00] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block font-space-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Intensity</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(lvl => (
                    <button
                      key={lvl} type="button"
                      onClick={() => setIntensity(lvl)}
                      className="flex-1 py-2.5 font-space-mono text-xs uppercase tracking-widest border transition-all duration-200"
                      style={{
                        background: intensity === lvl ? `${INTENSITY_COLOR[lvl]}22` : 'rgba(0,0,0,0.3)',
                        borderColor: intensity === lvl ? INTENSITY_COLOR[lvl] : 'rgba(255,255,255,0.08)',
                        color: intensity === lvl ? INTENSITY_COLOR[lvl] : 'rgba(255,255,255,0.3)',
                      }}
                    >{lvl}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-space-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Notes (optional)</label>
                <input
                  type="text" value={notes} placeholder="e.g. PR on bench, felt strong..."
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-3 text-white font-archivo-narrow text-sm focus:border-[#ff5a00] focus:outline-none transition-colors placeholder:text-white/20"
                />
              </div>

              {/* XP preview */}
              <div className="flex items-center justify-between py-2 px-3" style={{ background: 'rgba(255,90,0,0.06)', border: '1px solid rgba(255,90,0,0.2)' }}>
                <span className="font-space-mono text-xs text-white/40 uppercase">XP Preview</span>
                <span className="font-orbitron font-bold text-[#ff5a00]">
                  +{Math.round((WORKOUT_TYPES.find(w => w.label === wType)?.baseXpRate ?? 2) * (parseInt(duration) || 0) * (INTENSITY_MULTI[intensity] ?? 1))} XP
                </span>
              </div>

              <button
                type="submit"
                disabled={logging}
                className="w-full py-3.5 flex items-center justify-center gap-2 font-orbitron text-sm font-bold uppercase tracking-widest transition-all duration-200"
                style={{ background: logging ? 'rgba(255,90,0,0.1)' : 'rgba(255,90,0,0.2)', border: '1px solid #ff5a00', color: '#ff5a00' }}
              >
                <Dumbbell className="w-4 h-4" />
                {logging ? 'Logging...' : 'Initiate Transfer'}
              </button>
            </form>
          </div>

          {/* Body Metrics Logger */}
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <button
              onClick={() => setShowMetrics(p => !p)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-[#00D4FF]" />
                <span className="font-orbitron text-sm font-bold uppercase tracking-widest text-white">Today's Body Metrics</span>
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
                        { label: 'Water (ml)',  state: '', set: () => {}, icon: <Droplets className="w-3.5 h-3.5" />, type: 'number', step: '100' },
                        { label: 'Sleep (hrs)', state: sleepHrs, set: setSleepHrs, icon: <Moon className="w-3.5 h-3.5" />, type: 'number', step: '0.5' },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="flex items-center gap-1 font-space-mono text-[9px] text-white/30 uppercase tracking-widest mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>
                            {f.icon} {f.label}
                          </label>
                          <input
                            type={f.type} step={f.step} value={f.state}
                            onChange={e => f.set(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-archivo-narrow text-sm focus:border-[#00D4FF] focus:outline-none transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit" disabled={savingMetrics}
                      className="w-full py-2.5 font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
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

        {/* RIGHT — Data Panel */}
        <div className="space-y-6">

          {/* Weekly Activity Chart */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-[#ff5a00]" /> Weekly Output
              </h3>
              <span className="font-space-mono text-xs text-white/30">{thisWeekSessions} active days</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart} barSize={24}>
                  <XAxis dataKey="day" stroke="#333" tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,90,0,0.06)' }}
                    contentStyle={{ background: '#080D1A', border: '1px solid #ff5a00', fontFamily: 'Space Mono', fontSize: 11 }}
                    formatter={(v: any, name: any) => {
                      const label = name === 'xp' ? `${v} XP` : `${v} min`;
                      const key = name === 'xp' ? 'XP Earned' : 'Minutes';
                      return [label, key];
                    }}
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

          {/* Training Archives — REAL data */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Flame className="w-4 h-4 text-[#ff5a00]" /> Training Archives
              <span className="font-space-mono text-xs text-white/20 font-normal normal-case ml-1">{totalSessions} records</span>
            </h3>

            {logsLoading ? (
              <div className="py-10 text-center font-space-mono text-xs text-white/20 uppercase tracking-widest animate-pulse">Loading records...</div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-white/08">
                <Dumbbell className="w-10 h-10 mx-auto mb-3 text-white/10" />
                <p className="font-space-mono text-xs text-white/20 uppercase tracking-widest">No conditioning records found.</p>
                <p className="font-space-mono text-[10px] text-white/10 mt-1">Log your first session above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#ff5a0033 transparent' }}>
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

      {/* ── Second Body Protocol ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,90,0,0.4), transparent)' }} />
          <span className="font-space-mono text-xs text-[#ff5a00]/60 uppercase tracking-[0.4em]">Second Body Protocol</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(255,90,0,0.4), transparent)' }} />
        </div>
        <SecondBodyProtocol currentLevel={currentLevel} />
      </div>

    </motion.div>
  );
}
