import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, Target } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

const XP_HISTORY = [
  { date: 'May 01', xp: 4000 },
  { date: 'May 05', xp: 5200 },
  { date: 'May 10', xp: 6800 },
  { date: 'May 15', xp: 8500 },
  { date: 'May 20', xp: 9100 },
  { date: 'May 25', xp: 11000 },
  { date: 'May 30', xp: 13500 },
];

export default function Analytics() {
  const { stats } = useProfile();

  // Create a mapping of stat_name to level/xp
  const statsMap = stats.reduce((acc, s) => {
    acc[s.stat_name.toUpperCase().substring(0, 3)] = s.level * 100 + s.xp;
    return acc;
  }, {} as Record<string, number>);

  // Compute stats matrix
  const STATS_MATRIX = [
    { subject: 'STR', A: statsMap['STR'] || 0, fullMark: 1000 },
    { subject: 'END', A: statsMap['END'] || 0, fullMark: 1000 },
    { subject: 'INT', A: statsMap['INT'] || 0, fullMark: 1000 },
    { subject: 'FOC', A: statsMap['FOC'] || 0, fullMark: 1000 },
    { subject: 'STO', A: statsMap['STO'] || 0, fullMark: 1000 },
    { subject: 'DIS', A: statsMap['DIS'] || 0, fullMark: 1000 },
    { subject: 'CRE', A: statsMap['CRE'] || 0, fullMark: 1000 },
    { subject: 'CHA', A: statsMap['CHA'] || 0, fullMark: 1000 },
    { subject: 'WEA', A: statsMap['WEA'] || 0, fullMark: 1000 },
    { subject: 'CON', A: statsMap['CON'] || 0, fullMark: 1000 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue">
          <Activity className="w-8 h-8 text-accent-blue" />
        </div>
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
            System <span className="text-accent-blue">Analytics</span>
          </h1>
          <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
            Data telemetry and progression matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart */}
        <div className="glass-panel p-6 border-t-2 border-t-accent-purple">
          <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-purple" />
            Stat Matrix
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={STATS_MATRIX}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Space Mono' }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Player" dataKey="A" stroke="#00D4FF" fill="#b829e3" fillOpacity={0.4} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080D1A', border: '1px solid #b829e3', borderRadius: 0, fontFamily: 'Space Mono' }} 
                  itemStyle={{ color: '#00D4FF' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart */}
        <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
          <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-blue" />
            XP Trajectory
          </h2>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={XP_HISTORY}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#555" tick={{ fill: '#888', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080D1A', border: '1px solid #00D4FF', borderRadius: 0, fontFamily: 'Space Mono' }} 
                />
                <Area type="monotone" dataKey="xp" stroke="#00D4FF" fillOpacity={1} fill="url(#colorXp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
