// FILE 4: BossBattles.tsx — new component (does not conflict with BossMode page)
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Trophy, Zap } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { BOSS_BATTLES_TEMPLATE } from '../../lib/rpgEnhanced';
import toast from 'react-hot-toast';

interface BossBattle {
  id: string;
  boss_name: string;
  boss_description: string;
  condition_target: number;
  condition_current: number;
  condition_type: string;
  reward_xp: number;
  reward_title: string;
  reward_aura: number;
  is_completed: boolean;
  month_year: string;
}

const MONTH_YEAR = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

const BOSS_COLORS = ['#ff5a00', '#ff003c', '#7B2FFF', '#00D4FF', '#FFD700'];

export function BossBattles() {
  const { user } = useAuthStore();
  const [battles, setBattles] = useState<BossBattle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrSeed = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // LocalStorage offline fallback
      const localKey = `monarch_boss_battles_${user.id}_${MONTH_YEAR}`;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) {
          setBattles(JSON.parse(raw) as BossBattle[]);
        } else {
          // Seed local default templates
          const toInsert = BOSS_BATTLES_TEMPLATE.map((t, i) => ({
            ...t,
            id: `local_bb_${i}_${Date.now()}`,
            user_id: user.id,
            month_year: MONTH_YEAR,
            condition_current: 0,
            is_completed: false,
          }));
          localStorage.setItem(localKey, JSON.stringify(toInsert));
          setBattles(toInsert as BossBattle[]);
        }
      } catch (e) {
        console.error('Failed to load local boss battles:', e);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: existing, error } = await supabase
        .from('boss_battles')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', MONTH_YEAR);

      if (error) throw error;

      if (existing && existing.length > 0) {
        setBattles(existing as BossBattle[]);
      } else {
        // Seed this month's battles
        const toInsert = BOSS_BATTLES_TEMPLATE.map(t => ({
          ...t,
          user_id: user.id,
          month_year: MONTH_YEAR,
          condition_current: 0,
          is_completed: false,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('boss_battles')
          .insert(toInsert)
          .select();
          
        if (insertError) throw insertError;
        if (inserted) setBattles(inserted as BossBattle[]);
      }
    } catch (e) {
      console.error('Failed to fetch/seed boss battles:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrSeed(); }, [fetchOrSeed]);

  const handleClaim = async (battle: BossBattle) => {
    if (!user || battle.is_completed || battle.condition_current < battle.condition_target) return;

    if (!isSupabaseConfigured) {
      // LocalStorage offline fallback
      const localKey = `monarch_boss_battles_${user.id}_${MONTH_YEAR}`;
      const updated = battles.map(b => b.id === battle.id ? { ...b, is_completed: true } : b);
      localStorage.setItem(localKey, JSON.stringify(updated));
      setBattles(updated);
      toast.success(`🏆 ${battle.boss_name} DEFEATED! +${battle.reward_xp} XP`, { duration: 5000 });
      return;
    }

    try {
      const { error } = await supabase
        .from('boss_battles')
        .update({ is_completed: true })
        .eq('id', battle.id);
        
      if (error) throw error;
      
      setBattles(prev => prev.map(b => b.id === battle.id ? { ...b, is_completed: true } : b));
      toast.success(`🏆 ${battle.boss_name} DEFEATED! +${battle.reward_xp} XP`, { duration: 5000 });
    } catch (e) {
      console.error('Failed to claim boss battle reward:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center font-space-mono text-xs text-white/30 uppercase tracking-widest animate-pulse"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,0,60,0.1)' }}>
        Loading Boss Battles...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,0,60,0.15)' }}>
      <div className="flex items-center gap-3 mb-2">
        <Skull className="w-5 h-5 text-[#ff003c]" />
        <div>
          <h3 className="font-orbitron text-lg font-bold uppercase tracking-widest text-white">Monthly Boss Battles</h3>
          <p className="font-space-mono text-xs text-white/30 uppercase">{MONTH_YEAR}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {battles.map((battle, idx) => {
          const color = BOSS_COLORS[idx % BOSS_COLORS.length];
          const pct = Math.min(100, (battle.condition_current / battle.condition_target) * 100);
          const canClaim = !battle.is_completed && battle.condition_current >= battle.condition_target;

          return (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="relative p-4 space-y-3 overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: `1px solid ${color}30`,
                opacity: battle.is_completed ? 0.6 : 1,
              }}
            >
              {/* Defeated overlay */}
              <AnimatePresence>
                {battle.is_completed && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.75)' }}
                  >
                    <div className="text-center">
                      <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color }} />
                      <p className="font-orbitron text-sm font-bold uppercase tracking-widest" style={{ color }}>DEFEATED</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Boss name */}
              <div>
                <p className="font-space-mono text-[10px] uppercase tracking-widest text-white/30">Boss Threat</p>
                <h4 className="font-orbitron text-base font-bold uppercase tracking-wide text-white mt-0.5" style={{ textShadow: `0 0 10px ${color}` }}>
                  {battle.boss_name}
                </h4>
                <p className="font-archivo-narrow text-sm text-white/50 mt-1">{battle.boss_description}</p>
              </div>

              {/* HP Bar */}
              <div>
                <div className="flex justify-between font-space-mono text-[10px] text-white/40 mb-1">
                  <span>Progress</span>
                  <span style={{ color }}>{battle.condition_current} / {battle.condition_target}</span>
                </div>
                <div className="w-full h-3 bg-black/60 overflow-hidden" style={{ border: `1px solid ${color}30` }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full"
                    style={{
                      background: pct >= 100 ? `linear-gradient(90deg, #22c55e66, #22c55e)` : `linear-gradient(90deg, ${color}66, ${color})`,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-3 pt-1">
                <span className="font-space-mono text-xs" style={{ color }}>+{battle.reward_xp} XP</span>
                <span className="font-space-mono text-xs text-white/30">•</span>
                <span className="font-space-mono text-xs text-white/40">"{battle.reward_title}"</span>
                <span className="font-space-mono text-xs text-white/30">•</span>
                <Zap className="w-3 h-3" style={{ color }} />
                <span className="font-space-mono text-xs" style={{ color }}>+{battle.reward_aura} Aura</span>
              </div>

              {/* Claim button */}
              {canClaim && (
                <button
                  onClick={() => handleClaim(battle)}
                  className="w-full py-2 font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
                  style={{ background: `${color}22`, border: `1px solid ${color}`, color }}
                >
                  Claim Reward
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
