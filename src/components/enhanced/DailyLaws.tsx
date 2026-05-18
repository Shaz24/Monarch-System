// FILE 3: DailyLaws.tsx — new component
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { auraOnPerfectDay } from '../../lib/auraService';
import toast from 'react-hot-toast';

interface LawRow {
  id?: string;
  user_id?: string;
  date?: string;
  workout_done: boolean;
  protein_hit: boolean;
  sleep_done: boolean;
  no_junk: boolean;
  no_doomscroll: boolean;
  social_done: boolean;
  routine_followed: boolean;
  no_addictions: boolean;
  all_laws_completed: boolean;
}

const LAWS: { key: keyof LawRow; label: string; icon: string }[] = [
  { key: 'workout_done',     label: 'Complete Today\'s Workout',       icon: '💪' },
  { key: 'protein_hit',      label: 'Hit Protein Goal',                icon: '🥩' },
  { key: 'sleep_done',       label: 'Sleep 7–9 hrs (scheduled)',       icon: '😴' },
  { key: 'no_junk',          label: 'Zero Junk Food',                  icon: '🥗' },
  { key: 'no_doomscroll',    label: 'No Doomscrolling',                icon: '📵' },
  { key: 'social_done',      label: 'Meaningful Social Interaction',   icon: '🤝' },
  { key: 'routine_followed', label: 'Morning Routine Followed',        icon: '🌅' },
  { key: 'no_addictions',    label: 'Zero Addictive Substances',       icon: '🚫' },
];

const TODAY = new Date().toISOString().split('T')[0];

const defaultRow: LawRow = {
  workout_done: false, protein_hit: false, sleep_done: false,
  no_junk: false, no_doomscroll: false, social_done: false,
  routine_followed: false, no_addictions: false, all_laws_completed: false,
};

export function DailyLaws() {
  const { user } = useAuthStore();
  const [row, setRow] = useState<LawRow>(defaultRow);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  const checkedCount = LAWS.filter(l => row[l.key] === true).length;
  const compliance = Math.round((checkedCount / LAWS.length) * 100);

  const fetchToday = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // LocalStorage offline fallback
      const localKey = `monarch_daily_laws_${user.id}_${TODAY}`;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) {
          setRow(JSON.parse(raw) as LawRow);
        } else {
          setRow(defaultRow);
        }
      } catch (e) {
        console.error('Failed to load local daily laws:', e);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_laws')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', TODAY)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setRow(data as LawRow);
      } else {
        setRow(defaultRow);
      }
    } catch (e) {
      console.error('Failed to fetch daily laws:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const toggle = async (key: keyof LawRow) => {
    if (!user) return;
    const next = { ...row, [key]: !row[key] };
    const allDone = LAWS.every(l => next[l.key] === true);
    next.all_laws_completed = allDone;
    setRow(next);

    if (!isSupabaseConfigured) {
      // LocalStorage offline fallback
      const localKey = `monarch_daily_laws_${user.id}_${TODAY}`;
      localStorage.setItem(localKey, JSON.stringify(next));

      if (allDone && !row.all_laws_completed) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
        toast.success('⚡ PERFECT DAY — +100 XP BONUS!', { duration: 5000 });
        await auraOnPerfectDay(user.id).catch(console.error);
      }
      return;
    }

    try {
      const { error } = await supabase.from('daily_laws').upsert({
        user_id: user.id,
        date: TODAY,
        ...next,
      }, { onConflict: 'user_id,date' });

      if (error) throw error;
      toast.success('Protocol updated.');

      // Perfect day bonus
      if (allDone && !row.all_laws_completed) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
        toast.success('⚡ PERFECT DAY — +100 XP BONUS!', { duration: 5000 });
        await auraOnPerfectDay(user.id).catch(console.error);
      }
    } catch (err: any) {
      console.error('Failed to toggle daily law:', err);
      toast.error(err.message || 'Failed to update protocol.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center font-space-mono text-xs text-white/30 uppercase tracking-widest animate-pulse"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
        Loading Daily Laws...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 relative overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(0,212,255,0.15)' }}>

      {/* Confetti flash */}
      <AnimatePresence>
        {confetti && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.12), transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#00D4FF]" />
          <div>
            <h3 className="font-orbitron text-lg font-bold uppercase tracking-widest text-white">Daily Laws</h3>
            <p className="font-space-mono text-xs text-white/30 uppercase tracking-wide">Non-Negotiable Protocol</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-orbitron text-3xl font-black" style={{ color: compliance >= 90 ? '#22c55e' : compliance >= 70 ? '#00D4FF' : '#ff003c' }}>
            {checkedCount}/{LAWS.length}
          </span>
          <p className="font-space-mono text-xs text-white/30 uppercase">complete</p>
        </div>
      </div>

      {/* Law checkboxes */}
      <div className="space-y-2">
        {LAWS.map(law => {
          const done = row[law.key] === true;
          return (
            <motion.button
              key={law.key}
              onClick={() => toggle(law.key)}
              whileHover={{ x: 3 }}
              className="w-full flex items-center gap-4 p-3 text-left transition-all duration-200"
              style={{
                background: done ? 'rgba(0,212,255,0.07)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${done ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <span className="text-lg flex-shrink-0">{law.icon}</span>
              <span className={`font-archivo-narrow text-base flex-1 ${done ? 'line-through text-white/30' : 'text-white'}`}>
                {law.label}
              </span>
              <span style={{ color: done ? '#00D4FF' : 'rgba(255,255,255,0.15)' }}>
                {done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Compliance message */}
      <div className="p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${compliance >= 90 ? '#22c55e30' : compliance >= 70 ? '#00D4FF30' : '#ff003c30'}` }}>
        <p className="font-space-mono text-xs uppercase tracking-widest"
          style={{ color: compliance >= 90 ? '#22c55e' : compliance >= 70 ? '#00D4FF' : '#ff003c' }}>
          {compliance >= 90
            ? '⚡ Elite compliance. The system approves.'
            : compliance >= 70
            ? '📊 Solid effort. Push to 100% for the bonus.'
            : '⚠️ Below 70%. The system is watching. Don\'t break the chain.'}
        </p>
      </div>
    </div>
  );
}
