import { motion } from 'framer-motion';
import { Flame, Shield, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatRing } from '../components/StatRing';
import { useUIStore } from '../store/uiStore';

// Dummy data since DB is not connected yet
const DUMMY_STATS = [
  { name: 'Strength', level: 5, xp: 250 },
  { name: 'Discipline', level: 8, xp: 750 },
  { name: 'Intelligence', level: 4, xp: 100 },
  { name: 'Creativity', level: 3, xp: 50 },
  { name: 'Endurance', level: 6, xp: 400 },
  { name: 'Charisma', level: 2, xp: 150 },
  { name: 'Focus', level: 7, xp: 600 },
  { name: 'Stoicism', level: 9, xp: 850 },
  { name: 'Wealth', level: 1, xp: 0 },
  { name: 'Consistency', level: 10, xp: 950 },
];

const WEEKLY_DATA = [
  { day: 'M', score: 60 },
  { day: 'T', score: 80 },
  { day: 'W', score: 50 },
  { day: 'T', score: 90 },
  { day: 'F', score: 70 },
  { day: 'S', score: 100 },
  { day: 'S', score: 85 },
];

export default function Dashboard() {
  const addXpParticle = useUIStore(state => state.addXpParticle);
  const currentLevel = 12;
  const currentXp = 850;
  const xpNeeded = 1200; // calculateXPForLevel(12) = 1200
  const xpPercent = (currentXp / xpNeeded) * 100;
  
  const handleTestXP = (e: React.MouseEvent) => {
    addXpParticle(e.clientX, e.clientY, 50);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1440px] mx-auto w-full space-y-8"
    >
      {/* Header Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Identity */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-none border-2 border-accent-blue shadow-neon-blue flex items-center justify-center bg-void z-10 shrink-0">
            <Shield className="w-12 h-12 text-accent-blue" />
          </div>
          
          <div className="flex-1 w-full z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="font-space-mono text-xs text-accent-blue tracking-widest uppercase">Rank: D-Class Hunter</p>
                <h1 className="font-orbitron text-4xl font-bold text-white uppercase tracking-wider">Player_01</h1>
              </div>
              <div className="text-right">
                <p className="font-space-mono text-sm text-white/50">LVL</p>
                <p className="font-orbitron text-3xl neon-text-blue">{currentLevel}</p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="w-full h-4 bg-void border border-white/10 relative overflow-hidden mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-accent-blue relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1 font-space-mono text-xs text-white/40">
              <span>{currentXp} XP</span>
              <span>{xpNeeded} XP</span>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <Shield className="w-64 h-64" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-rows-2 gap-6">
          <div className="glass-panel p-6 flex items-center justify-between group cursor-pointer" onClick={handleTestXP}>
            <div>
              <p className="font-space-mono text-xs text-accent-purple tracking-widest uppercase">Aura Level</p>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-6 h-6 text-accent-purple" />
                <span className="font-orbitron text-3xl font-bold text-white">100%</span>
              </div>
            </div>
            {/* Aura Bar */}
            <div className="w-2 h-12 bg-void border border-white/10 flex flex-col justify-end">
              <div className="w-full h-full bg-gradient-to-t from-accent-purple/20 to-accent-purple shadow-neon-purple" />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="font-space-mono text-xs text-[#ff5a00] tracking-widest uppercase">Current Streak</p>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-6 h-6 text-[#ff5a00]" style={{ filter: 'drop-shadow(0 0 5px rgba(255,90,0,0.5))' }} />
                <span className="font-orbitron text-3xl font-bold text-white">14 <span className="text-sm text-white/50">DAYS</span></span>
              </div>
            </div>
            <div className="font-space-mono text-xs text-[#ff5a00]/70 text-right">
              MULTIPLIER<br/>
              <span className="text-lg font-bold text-[#ff5a00]">1.2x</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stat Rings */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest border-l-4 border-accent-blue pl-3">
              Player Stats
            </h2>
            <Target className="w-5 h-5 text-accent-blue" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {DUMMY_STATS.map((stat) => (
              <StatRing key={stat.name} statName={stat.name} level={stat.level} xp={stat.xp} />
            ))}
          </div>
        </div>

        {/* Productivity & Consistency */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest border-l-4 border-accent-purple pl-3 mb-6">
              Productivity
            </h2>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-void shadow-neon-purple">
                <div className="absolute inset-0 rounded-full border-4 border-accent-purple opacity-50 border-t-accent-blue animate-[spin_10s_linear_infinite]" />
                <div className="text-center">
                  <span className="block font-orbitron text-4xl font-bold neon-text-blue">A</span>
                  <span className="font-space-mono text-xs uppercase tracking-widest text-white/50">Grade</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-sm font-bold uppercase tracking-widest mb-4 text-white/70">
              7-Day Output
            </h2>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_DATA}>
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 212, 255, 0.1)' }} 
                    contentStyle={{ backgroundColor: '#080D1A', border: '1px solid #00D4FF', borderRadius: 0, fontFamily: 'Space Mono' }} 
                  />
                  <XAxis dataKey="day" stroke="#555" tick={{ fill: '#888', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                  <Bar dataKey="score" fill="#00D4FF" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
