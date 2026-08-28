import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, Trophy, Settings, Star, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useProfile, clearProfileCache } from '../hooks/useProfile';
import { showAchievementToast } from '../components/AchievementToast';
import { StatRing } from '../components/StatRing';
import { getRankFromLevel } from '../lib/rpg';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { id: '1', title: 'Awakening', description: 'Initialize system connection.', icon: '⚡', condition: 'always', xp_reward: 100 },
  { id: '2', title: 'First Blood', description: 'Complete your first daily directive.', icon: '🗡️', condition: 'always', xp_reward: 150 },
  { id: '3', title: 'Discipline Adept', description: 'Maintain a 7-day streak.', icon: '🔥', condition: 'streak_7', xp_reward: 300 },
  { id: '4', title: 'C-Rank Hunter', description: 'Reach Level 35.', icon: '🛡️', condition: 'level_35', xp_reward: 500 },
  { id: '5', title: 'Monk Mode', description: 'Complete a 120-minute focus session.', icon: '🧠', condition: 'never', xp_reward: 400 },
  { id: '6', title: 'Architect', description: 'Merge 50 code commits.', icon: '💻', condition: 'never', xp_reward: 600 },
];

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { profile, stats, loading, error } = useProfile();
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isHoveredSettings, setIsHoveredSettings] = useState(false);

  const handleLogout = async () => {
    try {
      clearProfileCache();
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

  const getRankColor = (rankLetter: string) => {
    switch (rankLetter.toUpperCase()) {
      case 'S': return { fill: '#ff003c', glow: 'shadow-[0_0_15px_#ff003c]' };
      case 'A': return { fill: '#FFD700', glow: 'shadow-[0_0_15px_#FFD700]' };
      case 'B': return { fill: '#7B2FFF', glow: 'shadow-[0_0_15px_#7B2FFF]' };
      case 'C': return { fill: '#00D4FF', glow: 'shadow-[0_0_15px_#00D4FF]' };
      case 'D': return { fill: '#00ff88', glow: 'shadow-[0_0_15px_#00ff88]' };
      default: return { fill: '#666666', glow: 'shadow-[0_0_10px_rgba(255,255,255,0.1)]' };
    }
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
  const rankStyle = getRankColor(rank);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 md:p-12 max-w-[1200px] mx-auto w-full space-y-8 relative"
    >
      {/* Header zone with rotating avatar border */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10 module-header">
        <div className="flex items-center gap-5">
          
          {/* Conic Gradient rotating border avatar wrapper */}
          <div className="relative group/avatar cursor-pointer" onClick={() => navigate('/edit-profile')}>
            <div 
              className="absolute -inset-1 rounded-full opacity-70 blur-sm transition duration-500 group-hover/avatar:opacity-100 border-glow-cycle"
              style={{
                background: 'conic-gradient(from var(--angle), #00D4FF, #7B2FFF, #ff5a00, #00D4FF)',
              }}
            />
            <div className="w-20 h-20 bg-void border border-cyan-400/40 rounded-full flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="w-10 h-10 text-cyan-400" />
              )}
              {/* EDIT Overlay on hover */}
              <div className="absolute inset-0 bg-void/80 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="font-mono text-[10px] text-cyan-300 font-bold tracking-widest">EDIT</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-widest text-white glow-text">
                {profile?.display_name || profile?.username || 'Player_01'}
              </h1>
              
              {/* Custom Hexagonal Rank Badge */}
              <div 
                className={`w-9 h-10 flex items-center justify-center relative ${rankStyle.glow} select-none`}
                data-tooltip={`${rank}-Class Rank Rating`}
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill="#080D1A" stroke={rankStyle.fill} strokeWidth="6" />
                </svg>
                <span className="font-display font-black text-base z-10" style={{ color: rankStyle.fill }}>
                  {rank}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase font-bold">
                {rank}-Class Hunter
              </span>
              <span className="text-white/20">•</span>
              <span className="font-mono text-xs text-white/40">@{profile?.username || '—'}</span>
            </div>
            {profile?.bio && (
              <p className="font-body text-white/70 mt-2 text-sm max-w-sm leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn-danger flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-widest uppercase active:scale-95 transition-transform rounded-xl cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>

      {/* XP Progress Bar with Shimmer Effect and Arrow marker */}
      <div className="glass-2 p-6 rounded-2xl border border-white/[0.08] relative z-10 shadow-lg">
        <div className="flex justify-between font-mono text-xs text-white/50 uppercase tracking-widest mb-3">
          <span className="font-bold text-white">System XP — Level {profile?.current_level ?? 1}</span>
          <span className="text-cyan-400 font-bold tabular-nums">{profile?.current_xp ?? 0} / {(profile?.current_level ?? 1) * 100} XP</span>
        </div>
        <div className="relative h-4 bg-black/60 rounded-full overflow-hidden flex items-center border border-white/10 shimmer-bar">
          
          {/* Shimmering fill bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-monarch via-purple-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          />

          {/* Glowing cursor arrow marker at the end of the XP percentage */}
          {xpPercent > 0 && (
            <div 
              className="absolute h-full flex items-center z-10 pointer-events-none transition-all duration-300"
              style={{ left: `calc(${xpPercent}% - 5px)` }}
            >
              <span className="text-[10px] text-cyan-300 filter drop-shadow-[0_0_6px_#00D4FF] animate-pulse">▶</span>
            </div>
          )}
        </div>
        <p className="font-mono text-[10px] text-white/40 mt-2 font-bold">{xpPercent}% progress to Level {(profile?.current_level ?? 1) + 1}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Status Window & Settings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Status Window with scan-in staggered mounts */}
          <div className="glass-panel p-6 border-t-2 border-t-accent-blue bg-void/40 relative">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-blue" />
              Status Window
            </h2>
            <div className="space-y-4 font-space-mono text-sm">
              {[
                { label: 'LEVEL', value: profile?.current_level ?? '—' },
                { label: 'RANK', value: `${rank}-Class` },
                { label: 'AURA', value: `${profile?.aura_level ?? 100} / 100`, color: 'text-accent-purple font-bold' },
                { label: 'STREAK', value: `${profile?.streak_days ?? 0} DAYS`, color: 'text-[#ff5a00] font-bold' },
                { label: 'SYSTEM ID', value: user?.id?.slice(0, 12) + '…' || '—', color: 'text-white/30' },
              ].map(({ label, value, color }, idx) => (
                <div 
                  key={label} 
                  className="flex justify-between border-b border-white/5 pb-2.5 animate-[scan-in_200ms_ease-in-out_once]"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <span className="text-white/50">{label}</span>
                  <span className={color ?? 'text-white font-bold'}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings with Danger Zone shake hover effects */}
          <div 
            className={`glass-panel p-6 border-t-2 border-t-white/10 bg-void/40 transition-all duration-300 ${
              isHoveredSettings ? 'animate-[shake_0.3s_ease-in-out]' : ''
            }`}
          >
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-white/50" />
              Settings
            </h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/edit-profile')} className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2.5 border-b border-white/5 transition-colors">
                Edit Profile
              </button>
              <button 
                onClick={() => toast('Notification preferences are managed by your OS.', { icon: '🔔' })}
                className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2.5 border-b border-white/5 transition-colors"
              >
                Notification Preferences
              </button>
              <button 
                onClick={() => setIsWipeConfirmOpen(true)}
                onMouseEnter={() => setIsHoveredSettings(true)}
                onMouseLeave={() => setIsHoveredSettings(false)}
                className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-[#ff5a00] py-2.5 transition-colors animate-[danger-pulse_2s_infinite] border border-dashed rounded px-2.5 mt-3 text-center bg-[#ff5a00]/5 hover:bg-[#ff5a00]/10"
              >
                Danger Zone (Reset Data)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Stats Rings and Achievements */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Core Stats with Custom Tooltips */}
          {stats.length > 0 && (
            <div className="glass-panel p-6 bg-void/40 relative">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-accent-blue pl-3">
                Core Stats
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div 
                    key={stat.stat_name}
                    className="p-3 glass-panel border border-white/5 hover:border-accent-blue/30 transition-all rounded-lg cursor-help"
                    data-tooltip={`Stat: ${stat.stat_name.toUpperCase()} | Level: ${stat.level} | XP to next: ${100 - (stat.xp % 100)}`}
                  >
                    <StatRing
                      statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)}
                      level={stat.level}
                      xp={stat.xp % 100}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements displaying gold shimmers and rotation stamps */}
          <div className="glass-panel p-6 border-t-2 border-t-[#FFD700] bg-void/40 relative">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#FFD700]">
              <Trophy className="w-5 h-5" />
              Achievements
            </h2>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {ACHIEVEMENTS.map((achieve) => {
                const unlocked = isUnlocked(achieve.condition);
                return (
                  <motion.div 
                    variants={{
                      hidden: { scale: 0.9, opacity: 0 },
                      show: { scale: 1, opacity: 1 }
                    }}
                    key={achieve.id} 
                    className={`relative p-4 border rounded overflow-hidden transition-all duration-300 flex items-start gap-4 ${
                      unlocked 
                        ? 'bg-void border-[#FFD700]/30 hover:border-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.15)]' 
                        : 'bg-void/10 border-white/5 filter grayscale(100%) brightness-[30%]'
                    }`}
                  >
                    {/* Unlocked Gold shimmer border animation wrapper */}
                    {unlocked && (
                      <div className="absolute inset-0 border border-[#FFD700]/30 pointer-events-none rounded animate-pulse" />
                    )}

                    {/* Locked CLASSIFIED Stamp */}
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                        <span className="font-orbitron text-[#ff003c]/35 text-2xl font-black uppercase tracking-widest border-2 border-dashed border-[#ff003c]/35 px-2 py-0.5 rotate-[-15deg]">
                          [CLASSIFIED]
                        </span>
                      </div>
                    )}

                    <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-2xl bg-black border rounded relative z-10 ${unlocked ? 'border-[#FFD700]/50' : 'border-white/10'}`}>
                      {achieve.icon}
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-orbitron font-bold tracking-widest uppercase text-sm ${unlocked ? 'text-[#FFD700]' : 'text-white/40'}`}>
                          {achieve.title}
                        </h3>
                        {unlocked && (
                          <span className="font-space-mono text-[9px] text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-1.5 rounded">
                            +{achieve.xp_reward} XP
                          </span>
                        )}
                      </div>
                      <p className="font-space-mono text-xs text-white/50 mt-1">{achieve.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

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
