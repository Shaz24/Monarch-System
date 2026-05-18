import { motion } from 'framer-motion';
import { Flame, Shield, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatRing } from '../components/StatRing';
import { useUIStore } from '../store/uiStore';
import { useProfile } from '../hooks/useProfile';
import { useWeeklyActivity } from '../hooks/useWeeklyActivity';
import { getRankFromLevel } from '../lib/rpg';
import { JourneyTimeline } from '../components/enhanced/JourneyTimeline';
import { DailyLaws } from '../components/enhanced/DailyLaws';
import { BossBattles } from '../components/enhanced/BossBattles';
import { AuraMeter } from '../components/enhanced/AuraMeter';
import { useCountUp } from '../hooks/useCountUp';


export default function Dashboard() {
  const addXpParticle = useUIStore(state => state.addXpParticle);
  const { profile, stats, loading } = useProfile();
  const { weeklyData, grade } = useWeeklyActivity();
  
  const currentLevel = profile?.current_level ?? 1;
  const currentXp = profile?.current_xp ?? 0;
  const xpNeeded = currentLevel * 100;
  const xpPercent = Math.min(100, Math.round((currentXp % xpNeeded) / xpNeeded * 100));
  const rank = getRankFromLevel(currentLevel);

  // Animated Count Ups for stats
  const animatedLevel = useCountUp(currentLevel);
  const animatedAura = useCountUp(profile?.aura_level ?? 100);
  const animatedStreak = useCountUp(profile?.streak_days ?? 0);
  
  const handleTestXP = (e: React.MouseEvent) => {
    addXpParticle(e.clientX, e.clientY, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="font-display text-xs text-[#A78BFA] uppercase tracking-[0.2em] animate-pulse glow-text">
          Loading System Data...
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1440px] mx-auto w-full space-y-8 relative overflow-hidden"
    >
      {/* Background glowing violet & gold blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-monarch/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Identity */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-xl border border-monarch-glow/30 shadow-[0_0_20px_rgba(124,58,237,0.15)] flex items-center justify-center bg-void z-10 shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover animate-pulse" />
            ) : (
              <Shield className="w-12 h-12 text-[#A78BFA] animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 w-full z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="font-display text-[10px] text-[#A78BFA] tracking-widest uppercase font-bold">Rank: {rank}-Class Hunter</p>
                <h1 className="font-display text-3xl font-black text-[#F1F5F9] uppercase tracking-wider glow-text mt-1">{profile?.display_name || profile?.username || 'Player_01'}</h1>
              </div>
              <div className="text-right">
                <p className="font-display text-[10px] text-[#94A3B8] tracking-widest uppercase">LVL</p>
                <p className="font-display text-4xl font-bold text-[#F59E0B] glow-gold">{animatedLevel}</p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="w-full h-4 bg-void/50 border border-white/5 rounded-full relative overflow-hidden mt-4 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-monarch to-[#A78BFA] relative rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[10px] text-[#94A3B8] tracking-wide">
              <span>{currentXp} XP</span>
              <span>{xpNeeded} XP</span>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none text-white">
            <Shield className="w-64 h-64" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-rows-2 gap-6">
          <div className="stat-card p-6 flex items-center justify-between group cursor-pointer" onClick={handleTestXP}>
            <div>
              <p className="font-display text-[10px] text-[#A78BFA] tracking-widest uppercase font-bold">Aura Level</p>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-6 h-6 text-[#A78BFA] animate-pulse" />
                <span className="font-display text-3xl font-extrabold text-[#F1F5F9]">{animatedAura}%</span>
              </div>
            </div>
            {/* Aura Bar */}
            <div className="w-2.5 h-12 bg-void/50 border border-white/5 rounded-full flex flex-col justify-end overflow-hidden shadow-inner">
              <div 
                className="w-full bg-gradient-to-t from-monarch to-monarch-glow shadow-[0_0_12px_rgba(124,58,237,0.6)] rounded-full transition-all duration-500" 
                style={{ height: `${animatedAura}%` }}
              />
            </div>
          </div>

          <div className="stat-card p-6 flex items-center justify-between">
            <div>
              <p className="font-display text-[10px] text-[#F59E0B] tracking-widest uppercase font-bold">Current Streak</p>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-6 h-6 text-[#F59E0B]" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
                <span className="font-display text-3xl font-extrabold text-[#F1F5F9]">{animatedStreak} <span className="text-xs text-[#94A3B8] font-body tracking-normal font-normal">DAYS</span></span>
              </div>
            </div>
            <div className="font-mono text-[10px] text-[#F59E0B]/70 text-right leading-relaxed">
              MULTIPLIER<br/>
              <span className="text-lg font-bold text-[#F59E0B]">{(1 + animatedStreak * 0.05).toFixed(2)}x</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stat Rings */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-md font-bold uppercase tracking-widest border-l-2 border-[#7C3AED] pl-3 text-[#F1F5F9]">
              Player Stats
            </h2>
            <Target className="w-4 h-4 text-[#7C3AED]" />
          </div>
          {stats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {stats.map((stat) => (
                <StatRing key={stat.stat_name} statName={stat.stat_name.charAt(0).toUpperCase() + stat.stat_name.slice(1)} level={stat.level} xp={stat.xp % 100} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#94A3B8]/30 font-mono text-xs uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
              No stats initialized. Complete tasks to level up.
            </div>
          )}
        </div>

        {/* Productivity & Consistency */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-display text-md font-bold uppercase tracking-widest border-l-2 border-[#7C3AED] pl-3 mb-6 text-[#F1F5F9]">
              Productivity
            </h2>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-void/50 shadow-[0_0_24px_rgba(124,58,237,0.15)] bg-void/20">
                <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/30 border-t-[#06B6D4] animate-[spin_10s_linear_infinite]" />
                <div className="text-center z-10">
                  <span className="block font-display text-4xl font-black text-[#06B6D4] glow-text">{grade}</span>
                  <span className="font-display text-[9px] uppercase tracking-widest text-[#94A3B8]">Grade</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-widest mb-4 text-[#94A3B8] border-b border-white/5 pb-2">
              7-Day Output
            </h2>
            <div className="h-40 w-full" aria-label="7-day productivity output bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} aria-label="7-Day Productivity Output Bar Chart">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#4C1D95" stopOpacity={0.15}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }} 
                    contentStyle={{ 
                      background: 'rgba(13, 17, 23, 0.95)', 
                      border: '1px solid rgba(124, 58, 237, 0.25)', 
                      borderRadius: '8px', 
                      fontFamily: 'Inter, sans-serif', 
                      fontSize: '11px',
                      color: '#F1F5F9',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }} 
                  />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Orbitron' }} tickLine={false} axisLine={false} />
                  <Bar dataKey="score" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* ── Enhanced RPG Additions (additive only) ── */}
      <AuraMeter aura={profile?.aura_score ?? 0} />
      <JourneyTimeline
        currentLevel={currentLevel}
        currentXP={profile?.total_xp_alltime ?? currentXp}
        avgDailyXP={200}
      />
      <DailyLaws />
      <BossBattles />

    </motion.div>
  );
}
