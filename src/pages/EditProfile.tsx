import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Lock, AlertTriangle,
  Save, Loader2, User, Mail, FileText, Globe, Swords, Trophy
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface VisibilitySettings {
  show_level: boolean;
  show_streak: boolean;
  show_stats: boolean;
  show_rank: boolean;
  show_achievements: boolean;
}

const DEFAULT_VISIBILITY: VisibilitySettings = {
  show_level: true,
  show_streak: true,
  show_stats: false,
  show_rank: true,
  show_achievements: true,
};

const VISIBILITY_OPTIONS: { key: keyof VisibilitySettings; label: string; icon: React.ElementType }[] = [
  { key: 'show_level', label: 'Current Level', icon: Swords },
  { key: 'show_rank', label: 'Hunter Rank', icon: Trophy },
  { key: 'show_streak', label: 'Activity Streak', icon: Globe },
  { key: 'show_stats', label: 'Core Stats Matrix', icon: Globe },
  { key: 'show_achievements', label: 'Achievements', icon: Trophy },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, loading, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state — seeded from real profile once loaded
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  // Seed form from fetched profile (runs once when profile loads)
  useEffect(() => {
    if (profile && !initialized) {
      setDisplayName(profile.display_name || profile.username || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar_url || null);
      setVisibility({ ...DEFAULT_VISIBILITY, ...(profile.visibility || {}) });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        username: username.trim() || displayName.toLowerCase().replace(/\s+/g, '_'),
        bio: bio.trim(),
        avatar_url: avatarPreview || '',
        visibility,
      });
      toast.success('Hunter profile synchronized.', { icon: '✅' });
      setTimeout(() => navigate('/profile'), 800);
    } catch (err: any) {
      toast.error(err.message || 'Update failed. Check Supabase connection.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = (key: keyof VisibilitySettings) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-void p-6 md:p-10 max-w-2xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/70 hover:text-accent-blue hover:border-accent-blue transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-orbitron text-3xl font-bold uppercase tracking-widest text-white">
            Edit <span className="text-accent-blue">Profile</span>
          </h1>
          <p className="font-space-mono text-xs text-white/40 uppercase tracking-widest mt-1">
            Reconfigure Hunter Identity Parameters
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* Section 1: Visual Avatar Matrix */}
        <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
          <h2 className="font-orbitron text-lg font-bold uppercase tracking-widest text-white mb-1">
            Visual Avatar Matrix
          </h2>
          <p className="font-space-mono text-xs text-white/40 uppercase tracking-[0.15em] mb-6">
            Tap the icon to initialize a new visual manifestation.
            Accepted formats: JPG, PNG, GIF (Max 5MB).
          </p>

          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 border-2 border-accent-blue/50 group-hover:border-accent-blue overflow-hidden relative transition-colors shadow-neon-blue">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-void flex items-center justify-center">
                    <User className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-void/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-accent-blue" />
                </div>
              </div>
              {/* Corner bracket decorators */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent-blue" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-accent-blue" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-accent-blue" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent-blue" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              <p className="font-space-mono text-sm text-white/70">
                {avatarPreview ? 'Visual Override Ready' : 'No Avatar Loaded'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 font-space-mono text-xs text-accent-blue uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                Initialize Upload
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Identity Parameters */}
        <div className="glass-panel p-6 border-t-2 border-t-accent-purple">
          <h2 className="font-orbitron text-lg font-bold uppercase tracking-widest text-white mb-1">
            Identity Parameters
          </h2>

          <div className="flex items-start gap-2 px-3 py-2 bg-[#FFD700]/5 border border-[#FFD700]/30 mb-6 mt-2">
            <AlertTriangle className="w-4 h-4 text-[#FFD700] shrink-0 mt-0.5" />
            <p className="font-space-mono text-xs text-[#FFD700]/80 uppercase tracking-wider leading-relaxed">
              Core identity parameters synchronized with Hunter Association database.
            </p>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block font-space-mono text-xs text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User className="w-3 h-3" />
                Display Name
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={32}
                  placeholder="Enter your Hunter alias..."
                  className="w-full bg-void/50 border-b border-white/20 focus:border-accent-blue pb-2 pt-1 px-0 text-white font-archivo-narrow text-lg placeholder-white/20 outline-none transition-colors"
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="font-space-mono text-xs text-white/30">{displayName.length}/32</span>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block font-space-mono text-xs text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                System Handle
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                maxLength={20}
                placeholder="hunter_id"
                className="w-full bg-void/50 border-b border-white/20 focus:border-accent-purple pb-2 pt-1 px-0 text-white font-space-mono text-sm placeholder-white/20 outline-none transition-colors"
              />
              <div className="flex justify-between mt-1">
                <span className="font-space-mono text-xs text-white/30">@{username || 'hunter'}</span>
                <span className="font-space-mono text-xs text-white/30">{username.length}/20</span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block font-space-mono text-xs text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Bio Directive
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Describe your hunter's purpose and creed..."
                className="w-full bg-void/50 border-b border-white/20 focus:border-accent-purple pb-2 pt-1 px-0 text-white font-archivo-narrow text-base placeholder-white/20 outline-none resize-none transition-colors leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <span className="font-space-mono text-xs text-white/30">{bio.length}/160</span>
              </div>
            </div>

            {/* Email — read-only */}
            <div>
              <label className="block font-space-mono text-xs text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Auth Channel (Immutable)
              </label>
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-white/40 font-space-mono text-sm flex-1">{user?.email || '—'}</span>
                <Lock className="w-4 h-4 text-white/20 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Visibility Matrix */}
        <div className="glass-panel p-6 border-t-2 border-t-white/20">
          <h2 className="font-orbitron text-lg font-bold uppercase tracking-widest text-white mb-1">
            Visibility Matrix
          </h2>
          <p className="font-space-mono text-xs text-white/40 uppercase tracking-[0.12em] mb-6 leading-relaxed">
            Toggle which core attributes are broadcasted to the Hunter Association network interface.
          </p>

          <div className="space-y-3">
            {VISIBILITY_OPTIONS.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                onClick={() => toggleVisibility(key)}
                className={`flex items-center justify-between p-4 cursor-pointer border transition-all duration-200 ${
                  visibility[key]
                    ? 'border-accent-blue/40 bg-accent-blue/5 hover:border-accent-blue'
                    : 'border-white/10 bg-void/30 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${visibility[key] ? 'text-accent-blue' : 'text-white/40'}`} />
                  <span className="font-archivo-narrow text-lg text-white">{label}</span>
                </div>
                <div className={`w-10 h-5 relative transition-colors duration-200 ${visibility[key] ? 'bg-accent-blue' : 'bg-white/20'}`}>
                  <motion.div
                    animate={{ x: visibility[key] ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute top-0.5 w-4 h-4 bg-void"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel p-6 border-t-2 border-t-[#ff003c]/50">
          <h2 className="font-orbitron text-lg font-bold uppercase tracking-widest text-[#ff003c]/80 mb-1">
            System Override
          </h2>
          <p className="font-space-mono text-xs text-white/30 uppercase tracking-widest mb-4">
            Irreversible actions. Proceed with extreme caution.
          </p>
          <button
            type="button"
            onClick={() => setIsWipeConfirmOpen(true)}
            className="w-full py-3 border border-[#ff003c]/30 text-[#ff003c]/60 hover:text-[#ff003c] hover:border-[#ff003c] hover:bg-[#ff003c]/5 font-space-mono text-xs uppercase tracking-widest transition-all"
          >
            ⚠ Initiate Full Data Wipe
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2 pb-8">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex-1 py-4 border border-white/20 text-white/60 hover:text-white hover:border-white/50 font-space-mono text-sm uppercase tracking-widest transition-all"
          >
            Abort
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                COMMIT CHANGES
              </>
            )}
          </button>
        </div>

      </form>

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
