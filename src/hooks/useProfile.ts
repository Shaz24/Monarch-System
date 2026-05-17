import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  current_level: number;
  current_xp: number;
  rank: string;
  aura_level: number;
  aura_score?: number;
  streak_days: number;
  journey_start_date?: string | null;
  total_xp_alltime?: number;
  visibility: {
    show_level: boolean;
    show_streak: boolean;
    show_stats: boolean;
    show_rank: boolean;
    show_achievements: boolean;
  };
  created_at: string;
}

export interface StatEntry {
  stat_name: string;
  level: number;
  xp: number;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  stats: StatEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      const emailHandle = user?.email?.split('@')[0] ?? 'player_01';
      setProfile({
        id: user?.id ?? 'demo',
        username: user?.user_metadata?.username ?? emailHandle,
        display_name: user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? emailHandle,
        bio: user?.user_metadata?.bio ?? '',
        avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
        current_level: 1,
        current_xp: 0,
        rank: 'E',
        aura_level: 100,
        streak_days: 0,
        visibility: {
          show_level: true,
          show_streak: true,
          show_stats: false,
          show_rank: true,
          show_achievements: true,
        },
        created_at: new Date().toISOString(),
      });
      setStats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let profileData = null;
      let statsData = null;

      const profileResponse = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (profileResponse.error) {
        // PGRST116 means zero rows returned (profile doesn't exist yet)
        if (profileResponse.error.code === 'PGRST116') {
          const emailHandle = user?.email?.split('@')[0] ?? 'player_01';
          const newProfile = {
            id: user.id,
            username: user?.user_metadata?.username ?? emailHandle,
            display_name: user?.user_metadata?.full_name ?? emailHandle,
            current_level: 1,
            current_xp: 0,
            rank: 'E',
            aura_level: 100,
            streak_days: 0,
          };
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (insertError) throw insertError;
          profileData = insertedProfile;

          // Also insert default stats
          const defaultStats = [
            'strength', 'discipline', 'intelligence', 'creativity', 
            'focus', 'endurance', 'charisma', 'stoicism', 'wealth', 'consistency'
          ].map(stat => ({
            user_id: user.id,
            stat_name: stat,
            level: 1,
            xp: 0
          }));
          
          await supabase.from('stats').insert(defaultStats);
        } else {
          throw profileResponse.error;
        }
      } else {
        profileData = profileResponse.data;
      }

      const statsResponse = await supabase.from('stats').select('stat_name, level, xp').eq('user_id', user.id);
      if (statsResponse.error) throw statsResponse.error;
      statsData = statsResponse.data;

      // Merge fallbacks: DB value wins, falls back to user metadata or sensible defaults.
      // This handles the case where display_name / bio / visibility columns don't exist yet.
      const defaultVisibility = {
        show_level: true,
        show_streak: true,
        show_stats: false,
        show_rank: true,
        show_achievements: true,
      };
      const p = profileData as any;
      const merged: UserProfile = {
        ...p,
        // Text fields: DB first, then user_metadata, then email-derived
        display_name:
          p.display_name ??
          user.user_metadata?.full_name ??
          p.username ??
          user.email?.split('@')[0] ??
          'Player',
        bio: p.bio ?? user.user_metadata?.bio ?? '',
        avatar_url:
          p.avatar_url ||
          user.user_metadata?.avatar_url ||
          null,
        // JSONB field: DB first, then defaults
        visibility: p.visibility ?? defaultVisibility,
      };

      setProfile(merged);
      setStats((statsData ?? []) as StatEntry[]);
    } catch (err: any) {
      setError(err.message);
      console.error('useProfile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return { profile, stats, loading, error, refetch: fetchProfile, updateProfile };
}
