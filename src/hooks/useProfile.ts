import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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

// Stale-While-Revalidate Module-Level Cache
let cachedProfile: UserProfile | null = null;
let cachedStats: StatEntry[] = [];
let isOptimisticUpdatePending = false;

// Global observer pattern to prevent duplicate event listener updates
const listeners = new Set<(profile: UserProfile, stats: StatEntry[]) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('monarch-xp-granted', (e: Event) => {
    const customEvent = e as CustomEvent<{ xpAdded: number; statNames: string[] }>;
    const { xpAdded, statNames } = customEvent.detail || { xpAdded: 0, statNames: [] };

    if (cachedProfile) {
      isOptimisticUpdatePending = true;
      const nextXp = cachedProfile.current_xp + xpAdded;
      const nextLevel = Math.floor(nextXp / 100) + 1;
      const nextProfile = {
        ...cachedProfile,
        current_xp: nextXp,
        current_level: nextLevel
      };
      cachedProfile = nextProfile;

      let nextStats = cachedStats;
      if (cachedStats.length > 0 && statNames.length > 0) {
        const xpPerStat = Math.floor(xpAdded / statNames.length);
        nextStats = cachedStats.map(s => {
          if (statNames.includes(s.stat_name.toLowerCase())) {
            const nextStatXp = s.xp + xpPerStat;
            const nextStatLevel = Math.floor(nextStatXp / 100) + 1;
            return {
              ...s,
              xp: nextStatXp,
              level: nextStatLevel
            };
          }
          return s;
        });
        cachedStats = nextStats;
      }

      listeners.forEach(listener => listener(nextProfile, nextStats));
    }
  });
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [stats, setStats] = useState<StatEntry[]>(cachedStats);
  const [loading, setLoading] = useState(!cachedProfile);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      const emailHandle = user?.email?.split('@')[0] ?? 'player_01';
      const mockProfile: UserProfile = {
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
      };
      
      cachedProfile = mockProfile;
      cachedStats = [];
      setProfile(mockProfile);
      setStats([]);
      setLoading(false);
      return;
    }

    if (!isSilent && !cachedProfile) {
      setLoading(true);
    }
    setError(null);

    try {
      // Parallelize queries to double database retrieval speed
      const [profileResponse, statsResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('stats').select('stat_name, level, xp').eq('user_id', user.id)
      ]);

      let profileData = null;
      let statsData = statsResponse.data;

      if (profileResponse.error) {
        // PGRST116 means profile doesn't exist yet
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
          
          const { data: seededStats } = await supabase.from('stats').insert(defaultStats).select();
          statsData = seededStats || defaultStats;
        } else {
          throw profileResponse.error;
        }
      } else {
        profileData = profileResponse.data;
      }

      if (statsResponse.error) throw statsResponse.error;

      // Merge fallbacks
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
        visibility: p.visibility ?? defaultVisibility,
      };

      // If a manual refetch was requested, always bypass/reset the optimistic update flag
      if (!isSilent) {
        isOptimisticUpdatePending = false;
      }

      // If we have a pending optimistic update, and the database fetch has a lower XP
      // than our optimistic cache, then the database fetch is stale. We skip updating state.
      if (isOptimisticUpdatePending && cachedProfile && merged.current_xp < cachedProfile.current_xp) {
        console.log('useProfile: Database fetch is stale compared to optimistic cache. Keeping optimistic profile.');
        // Re-notify active instances to keep them in sync with the optimistic cache
        listeners.forEach(listener => listener(cachedProfile!, cachedStats));
        return;
      }

      // Clear the pending flag if the database has caught up
      if (isOptimisticUpdatePending && (!cachedProfile || merged.current_xp >= cachedProfile.current_xp)) {
        isOptimisticUpdatePending = false;
      }

      // Update Cache
      cachedProfile = merged;
      cachedStats = (statsData ?? []) as StatEntry[];

      // Notify all instances to keep everything in sync
      listeners.forEach(listener => listener(merged, cachedStats));
    } catch (err: any) {
      setError(err.message);
      console.error('useProfile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // SWR pattern: load from cache instantly, fetch fresh in background
    if (cachedProfile) {
      setProfile(cachedProfile);
      setStats(cachedStats);
      fetchProfile(true); // background update
    } else {
      fetchProfile(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const handleUpdate = (updatedProfile: UserProfile, updatedStats: StatEntry[]) => {
      setProfile(updatedProfile);
      setStats(updatedStats);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleDbSync = () => {
      console.log('useProfile hook received DB sync event. Fetching fresh profile...');
      fetchProfile(true);
    };
    window.addEventListener('monarch-db-sync', handleDbSync);
    return () => {
      window.removeEventListener('monarch-db-sync', handleDbSync);
    };
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    // Optimistically update cache and state
    if (cachedProfile) {
      const nextProfile = { ...cachedProfile, ...updates };
      cachedProfile = nextProfile;
      listeners.forEach(listener => listener(nextProfile, cachedStats));
    }

    if (!isSupabaseConfigured) {
      toast.success('Profile updated (Demo Mode)!');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  return { 
    profile, 
    stats, 
    loading: !profile && loading, // Only block UI if we don't have profile data yet
    error, 
    refetch: () => fetchProfile(false), 
    updateProfile 
  };
}
