// Phase 5: Aura service — new file, does NOT edit existing lib files
import { supabase } from './supabase';
import { AURA_CHANGES } from './rpgEnhanced';

// ─── Update aura score ──────────────────────────────────────────────────────
export async function updateAura(
  userId: string,
  change: number,
  reason: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Log the change
  await supabase.from('aura_log').insert({
    user_id: userId,
    date: today,
    aura_change: change,
    reason,
  });

  // Apply to profile (clamp 0–1000)
  const { data: profile } = await supabase
    .from('profiles')
    .select('aura_score')
    .eq('id', userId)
    .single();

  if (profile) {
    const newAura = Math.max(0, Math.min(1000, (profile.aura_score ?? 0) + change));
    await supabase
      .from('profiles')
      .update({ aura_score: newAura })
      .eq('id', userId);
  }
}

// ─── Check if aura was already updated today for a given reason ─────────────
export async function hasAuraLoggedToday(
  userId: string,
  reason: string,
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('aura_log')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('reason', reason)
    .maybeSingle();
  return data !== null;
}

// ─── Convenience helpers ────────────────────────────────────────────────────
export async function auraOnWorkout(userId: string): Promise<void> {
  const already = await hasAuraLoggedToday(userId, 'workout');
  if (!already) await updateAura(userId, AURA_CHANGES.WORKOUT_DAY, 'workout');
}

export async function auraOnMeditation(userId: string): Promise<void> {
  const already = await hasAuraLoggedToday(userId, 'meditation');
  if (!already) await updateAura(userId, AURA_CHANGES.MEDITATION_DAY, 'meditation');
}

export async function auraOnPerfectDay(userId: string): Promise<void> {
  const already = await hasAuraLoggedToday(userId, 'perfect_day');
  if (!already) await updateAura(userId, AURA_CHANGES.PERFECT_DAY, 'perfect_day');
}

export async function auraOnMissedDay(userId: string): Promise<void> {
  const already = await hasAuraLoggedToday(userId, 'missed_day');
  if (!already) await updateAura(userId, AURA_CHANGES.MISSED_DAY, 'missed_day');
}
