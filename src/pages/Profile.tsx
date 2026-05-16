import { motion } from 'framer-motion';
import { User, LogOut, Shield, Trophy, Settings, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { showAchievementToast } from '../components/AchievementToast';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { id: '1', title: 'Awakening', description: 'Initialize system connection.', icon: '⚡', unlocked: true },
  { id: '2', title: 'First Blood', description: 'Complete your first daily directive.', icon: '🗡️', unlocked: true },
  { id: '3', title: 'Discipline Adept', description: 'Maintain a 7-day streak.', icon: '🔥', unlocked: true },
  { id: '4', title: 'C-Rank Hunter', description: 'Reach Level 35.', icon: '🛡️', unlocked: false },
  { id: '5', title: 'Monk Mode', description: 'Complete a 120-minute focus session.', icon: '🧠', unlocked: false },
  { id: '6', title: 'Architect', description: 'Merge 50 code commits.', icon: '💻', unlocked: false },
];

export default function Profile() {
  const { user } = useAuthStore();

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Connection terminated.');
    } catch (error) {
      toast.error('Failed to disconnect.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-accent-blue" />
            )}
          </div>
          <div>
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player_01'}
            </h1>
            <p className="font-space-mono text-sm text-accent-blue tracking-widest uppercase mt-1">
              D-Class Hunter
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm text-[#ff5a00] hover:text-white border-[#ff5a00] hover:bg-[#ff5a00]"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-blue" />
              Status Window
            </h2>
            
            <div className="space-y-4 font-space-mono text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">LEVEL</span>
                <span className="text-white">12</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">TITLE</span>
                <span className="text-white">Shadow Trainee</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">AURA</span>
                <span className="text-accent-purple">100 / 100</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">STREAK</span>
                <span className="text-[#ff5a00]">14 DAYS</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">SYSTEM ID</span>
                <span className="text-white/30 truncate max-w-[150px]">{user?.id || 'UNKNOWN'}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-t-2 border-t-white/10">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-white/50" />
              Settings
            </h2>
            <div className="space-y-2">
              <button className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2 border-b border-white/5 transition-colors">
                Edit Profile
              </button>
              <button className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent-blue py-2 border-b border-white/5 transition-colors">
                Notification Preferences
              </button>
              <button className="w-full text-left font-space-mono text-xs uppercase tracking-widest text-[#ff5a00]/50 hover:text-[#ff5a00] py-2 transition-colors">
                Danger Zone (Reset Data)
              </button>
            </div>
          </div>
        </div>

        {/* Achievements Gallery */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 min-h-full border-t-2 border-t-[#FFD700]">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#FFD700]">
              <Trophy className="w-5 h-5" />
              Achievements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map((achieve) => (
                <div 
                  key={achieve.id} 
                  className={`p-4 border transition-all duration-300 flex items-start gap-4 ${
                    achieve.unlocked 
                      ? 'bg-void border-[#FFD700]/30 hover:border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                      : 'bg-void/30 border-white/5 opacity-50 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-2xl bg-black border ${achieve.unlocked ? 'border-[#FFD700]/50' : 'border-white/10'}`}>
                    {achieve.icon}
                  </div>
                  <div>
                    <h3 className={`font-orbitron font-bold tracking-widest uppercase ${achieve.unlocked ? 'text-[#FFD700]' : 'text-white/50'}`}>
                      {achieve.title}
                    </h3>
                    <p className="font-space-mono text-xs text-white/60 mt-1">
                      {achieve.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleTestAchievement}
              className="mt-8 w-full border border-dashed border-[#FFD700]/30 text-[#FFD700]/50 hover:text-[#FFD700] hover:border-[#FFD700] hover:bg-[#FFD700]/5 py-4 font-space-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Force System Achievement (Demo)
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
