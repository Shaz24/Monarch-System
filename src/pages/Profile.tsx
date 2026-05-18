import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, Trophy, Settings, Star, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../hooks/useProfile';
import { showAchievementToast } from '../components/AchievementToast';
import { StatRing } from '../components/StatRing';
import { getRankFromLevel } from '../lib/rpg';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { id: '1', title: 'Awakening', description: 'Initialize system connection.', icon: '⚡', condition: 'always' },
  { id: '2', title: 'First Blood', description: 'Complete your first daily directive.', icon: '🗡️', condition: 'always' },
  { id: '3', title: 'Discipline Adept', description: 'Maintain a 7-day streak.', icon: '🔥', condition: 'streak_7' },
  { id: '4', title: 'C-Rank Hunter', description: 'Reach Level 35.', icon: '🛡️', condition: 'level_35' },
  { id: '5', title: 'Monk Mode', description: 'Complete a 120-minute focus session.', icon: '🧠', condition: 'never' },
  { id: '6', title: 'Architect', description: 'Merge 50 code commits.', icon: '💻', condition: 'never' },
];

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { profile, stats, loading, error } = useProfile();
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Connection terminated.');
    } catch {
      toast.error('Failed to disconnect.');
    }
  };

  const handleTestAchievement = () => {
    showAchievementToast({
      id: 'a1',
      name: 'System Override',
      description: 'You discovered the hidden developer override protocol.',
      xp_reward: 5000,
      icon: '⚡',
      unlock_condition: 'custom'
    });
  };

  // Determine which achievements are unlocked based on real data
  const isUnlocked = (condition: string) => {
    if (condition === 'always') return true;
    if (condition === 'never') return false;
    if (condition === 'streak_7') return (profile?.streak_days ?? 0) >= 7;
    if (condition === 'level_35') return (profile?.current_level ?? 1) >= 35;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-accent-blue animate-spin" />
          <span className="font-space-mono text-xs text-white/50 uppercase tracking-widest">
            Syncing Hunter Data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel p-8 border border-[#ff003c]/30 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-[#ff003c] mx-auto mb-4" />
          <p className="font-orbitron text-white mb-2 uppercase tracking-widest">Data Sync Failed</p>
          <p className="font-space-mono text-xs text-white/50">{error}</p>
        </div>
      </div>
    );
  }

  const xpForNextLevel = (profile?.current_level ?? 1) * 100;
  const xpPercent = Math.min(100, Math.round(((profile?.current_xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100));
  const rank = getRankFromLevel(profile?.current_level ?? 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue overflow-hidden relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-accent-blue" />
            )}
          </div>
          <div>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold uppercase tracking-widest text-white">
              {profile?.display_name || profile?.username || 'Player_01'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-space-mono text-sm text-accent-blue tracking-widest uppercase">
                {rank}-Class Hunter
              </span>
              <span className="text-white/20">•</span>
              <span className="font-space-mono text-sm text-white/40">@{profile?.username || '—'}</span>
            </div>
            {profile?.bio && (
              <p className="font-archivo-narrow text-white/60 mt-2 text-sm max-w-sm">{profile.bio}</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm text-[#ff5a00] hover:text-void hover:bg-[#ff5a00] border-[#ff5a00]"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>

      {/* XP Progress Bar */}
      <div className="glass-panel p-4 border border-white/10">
        <div className="flex justify-between font-space-mono text-xs text-white/50 uppercase tracking-widest mb-2">
          <span>System XP — Level {profile?.current_level ?? 1}</span>
          <span>{profile?.current_xp ?? 0} / {(profile?.current_level ?? 1) * 100} XP</span>
        </div>
        <div className="h-2 bg-white/10 w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-accent-blue shadow-neon-blue"
          />
        </div>
        <p className="font-space-mono text-xs text-white/30 mt-1">{xpPercent}% to next level</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Window */}
          <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-blue" />
              Status Window
            </h2>
            <div className="space-y-4 font-space-mono text-sm">
              {[
                { label: 'LEVEL', value: profile?.current_level ?? '—' },
                { label: 'RANK', value: `${rank}-Class` },
                { label: 'AURA', value: `${profile?.aura_level ?? 100} / 100`, color: 'text-accent-purple' },
                { label: 'STREAK', value: `${profile?.streak_days ?? 0} DAYS`, color: 'text-[#ff5a00]' },
                { label: 'SYSTEM ID', value: user?.id?.slice(0, 12) + '…' || '—', color: 'text-white/30' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">{label}</span>
                  <span className={color ?? 'text-white'}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-panel p-6 border-t-2 border-t-white/10">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-white/50" />
              Settings
            </h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/edit-profile')} className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2 border-b border-white/5 transition-colors">
                Edit Profile
              </button>
              <button 
                onClick={() => toast('Notification preferences are managed by your OS.', { icon: '🔔' })}
                className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2 border-b border-white/5 transition-colors"
              >
                Notification Preferences
              </button>
              <button 
                onClick={() => setIsWipeConfirmOpen(true)}
                className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-[#ff5a00]/50 hover:text-[#ff5a00] py-2 transition-colors"
              >
                Danger Zone (Reset Data)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Rings */}
          {stats.length > 0 && (
            <div className="glass-panel p-6">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-accent-blue pl-3">
                Core Stats
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <StatRing
                    key={stat.stat_name}
                    statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                    level={stat.level}
                    xp={stat.xp % 100}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="glass-panel p-6 border-t-2 border-t-[#FFD700]">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#FFD700]">
              <Trophy className="w-5 h-5" />
              Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map((achieve) => {
                const unlocked = isUnlocked(achieve.condition);
                return (
                  <div 
                    key={achieve.id} 
                    className={`p-4 border transition-all duration-300 flex items-start gap-4 ${
                      unlocked 
                        ? 'bg-void border-[#FFD700]/30 hover:border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                        : 'bg-void/30 border-white/5 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-2xl bg-black border ${unlocked ? 'border-[#FFD700]/50' : 'border-white/10'}`}>
                      {achieve.icon}
                    </div>
                    <div>
                      <h3 className={`font-orbitron font-bold tracking-widest uppercase text-sm ${unlocked ? 'text-[#FFD700]' : 'text-white/50'}`}>
                        {achieve.title}
                      </h3>
                      <p className="font-space-mono text-xs text-white/60 mt-1">{achieve.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={handleTestAchievement}
              className="mt-6 w-full border border-dashed border-[#FFD700]/30 text-[#FFD700]/50 hover:text-[#FFD700] hover:border-[#FFD700] hover:bg-[#FFD700]/5 py-4 font-space-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Force System Achievement (Demo)
            </button>
          </div>

        </div>
      </div>

      <ConfirmDialog
        isOpen={isWipeConfirmOpen}
        title="SYSTEM OVERRIDE DETECTED"
        message="WARNING: Initiate Full System Wipe? All stats, activity logs, and boss battle historical logs will be permanently deleted. This action CANNOT be undone. Proceeding will purge data across all associated databases."
        confirmLabel="PURGE SYSTEM"
        cancelLabel="ABORT PROTOCOL"
        onConfirm={async () => {
          setIsWipeConfirmOpen(false);
          // Instantly wipe all local storage keys starting with "monarch"
          Object.keys(localStorage).forEach(key => {
            if (key.toLowerCase().startsWith('monarch')) {
              localStorage.removeItem(key);
            }
          });

          if (!isSupabaseConfigured) {
            toast.success('System Wipe Complete. Reinitializing...', { duration: 4000 });
            setTimeout(() => window.location.reload(), 1500);
            return;
          }

          const targetId = user?.id ?? profile?.id;
          if (!targetId) {
            toast.error('No authenticated user session found.', { icon: '🚫' });
            return;
          }

          toast.loading('Initiating data purge across tables...', { id: 'purge-toast' });

          // Execute each database operation independently to be completely fault-tolerant
          const results = await Promise.allSettled([
            supabase.from('activity_logs').delete().eq('user_id', targetId),
            supabase.from('task_completions').delete().eq('user_id', targetId),
            supabase.from('boss_battles').delete().eq('user_id', targetId),
            supabase.from('daily_laws').delete().eq('user_id', targetId),
            supabase.from('aura_log').delete().eq('user_id', targetId),
            supabase.from('fitness_logs').delete().eq('user_id', targetId),
            supabase.from('mind_logs').delete().eq('user_id', targetId),
            supabase.from('coding_logs').delete().eq('user_id', targetId),
            supabase.from('creator_logs').delete().eq('user_id', targetId),
            supabase.from('stats').update({ xp: 0, level: 1 }).eq('user_id', targetId),
            supabase.from('profiles').update({ current_xp: 0, current_level: 1, streak_days: 0, aura_score: 0, total_xp_alltime: 0 }).eq('id', targetId)
          ]);

          const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any).error));

          if (failed.length > 0) {
            console.error('Wipe partial errors:', failed);
            toast.dismiss('purge-toast');
            toast.error(
              'Database reset partially blocked by Supabase. Please ensure you have run the RLS Delete Policy migration in your Supabase SQL Editor.',
              { duration: 8000 }
            );
            // Reload anyway to refresh UI state
            setTimeout(() => window.location.reload(), 3000);
          } else {
            toast.dismiss('purge-toast');
            toast.success('System Wipe Complete. Reinitializing...', { duration: 4000 });
            setTimeout(() => window.location.reload(), 1500);
          }
        }}
        onCancel={() => setIsWipeConfirmOpen(false)}
      />
    </motion.div>
  );
}
