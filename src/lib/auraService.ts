// Phase 5: Aura service — new file, does NOT edit existing lib files
import { supabase, isSupabaseConfigured } from './supabase';
import { AURA_CHANGES } from './rpgEnhanced';

// ─── Update aura score ──────────────────────────────────────────────────────
export async function updateAura(
  userId: string,
  change: number,
  reason: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured) {
    // LocalStorage offline fallback
    try {
      const localLogsKey = `monarch_aura_log_${userId}`;
      const rawLogs = localStorage.getItem(localLogsKey);
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.push({
        user_id: userId,
        date: today,
        aura_change: change,
        reason,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(localLogsKey, JSON.stringify(logs));

      // Local storage fallback for profiles
      const profileKey = `monarch_profile_${userId}`;
      const rawProfile = localStorage.getItem(profileKey);
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        p.aura_score = Math.max(0, Math.min(1000, (p.aura_score ?? 100) + change));
        localStorage.setItem(profileKey, JSON.stringify(p));
      }
    } catch (e) {
      console.error('Failed to log local aura change:', e);
    }
    return;
  }

  try {
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
  } catch (err) {
    console.error('Failed to update aura in database:', err);
  }
}

// ─── Check if aura was already updated today for a given reason ─────────────
export async function hasAuraLoggedToday(
  userId: string,
  reason: string,
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured) {
    try {
      const localLogsKey = `monarch_aura_log_${userId}`;
      const rawLogs = localStorage.getItem(localLogsKey);
      if (!rawLogs) return false;
      const logs = JSON.parse(rawLogs);
      return logs.some((l: any) => l.date === today && l.reason === reason);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  try {
    const { data } = await supabase
      .from('aura_log')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('reason', reason)
      .maybeSingle();
    return data !== null;
  } catch (err) {
    console.error('Failed to check aura logged status:', err);
    return false;
  }
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
