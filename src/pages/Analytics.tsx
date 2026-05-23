import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Activity, Target, Trophy, Clock, Zap, Flame, FileDown } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/50 backdrop-blur-[2px] p-6 text-center z-10 border border-white/5 rounded-lg">
    <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-3">
      <Activity className="w-6 h-6 text-white/30 animate-pulse" />
    </div>
    <p className="font-orbitron text-xs font-semibold tracking-widest text-white/70 uppercase mb-1">
      Telemetry Offline
    </p>
    <p className="font-space-mono text-[10px] text-white/40 uppercase tracking-wider max-w-xs leading-relaxed">
      {message}
    </p>
  </div>
);

export default function Analytics() {
  const { stats, profile } = useProfile();
  const { user } = useAuthStore();
  const theme = useUIStore((state) => state.theme);
  const isLight = theme === 'light';

  const [allLogs, setAllLogs] = useState<any[]>([]);

  // Fetch all logs to dynamically populate advanced analytics
  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      if (!isSupabaseConfigured) {
        const categories = ['fitness', 'mind', 'coding', 'creator'];
        const logs: any[] = [];
        categories.forEach(cat => {
          const raw = localStorage.getItem(`monarch_logs_${cat}_${user.id}`);
          if (raw) {
            try {
              logs.push(...JSON.parse(raw));
            } catch (e) {}
          }
        });
        setAllLogs(logs);
      } else {
        try {
          const { data } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id);
          if (data) setAllLogs(data);
        } catch (e) {}
      }
    };

    fetchLogs();
  }, [user]);

  // Dynamic theme colors for charts
  const gridColor = isLight ? 'rgba(10, 15, 29, 0.12)' : 'rgba(255, 255, 255, 0.1)';
  const labelColor = isLight ? 'rgba(10, 15, 29, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  const tooltipBg = isLight ? '#ffffff' : '#080D1A';
  const tooltipBorder = isLight ? '#0066cc' : '#b829e3';
  const axisColor = isLight ? '#555555' : '#888888';

  // Radar Chart Mapping
  const statsMap = useMemo(() => {
    return stats.reduce((acc, s) => {
      acc[s.stat_name.toUpperCase().substring(0, 3)] = s.level * 100 + s.xp;
      return acc;
    }, {} as Record<string, number>);
  }, [stats]);

  const STATS_MATRIX = useMemo(() => {
    return [
      { subject: 'STR', A: statsMap['STR'] || 0 },
      { subject: 'END', A: statsMap['END'] || 0 },
      { subject: 'INT', A: statsMap['INT'] || 0 },
      { subject: 'FOC', A: statsMap['FOC'] || 0 },
      { subject: 'STO', A: statsMap['STO'] || 0 },
      { subject: 'DIS', A: statsMap['DIS'] || 0 },
      { subject: 'CRE', A: statsMap['CRE'] || 0 },
      { subject: 'CHA', A: statsMap['CHA'] || 0 },
      { subject: 'WEA', A: statsMap['WEA'] || 0 },
      { subject: 'CON', A: statsMap['CON'] || 0 },
    ];
  }, [statsMap]);

  // 1. XP Source Donut/Pie Chart calculation
  const pieData = useMemo(() => {
    const categories = {
      Fitness: 0,
      Discipline: 0,
      Coding: 0,
      Creator: 0
    };

    allLogs.forEach(log => {
      const cat = log.category.toLowerCase();
      if (cat === 'fitness') categories.Fitness += log.xp_earned || 0;
      else if (cat === 'mind') categories.Discipline += log.xp_earned || 0;
      else if (cat === 'coding') categories.Coding += log.xp_earned || 0;
      else if (cat === 'creator') categories.Creator += log.xp_earned || 0;
    });

    const total = categories.Fitness + categories.Discipline + categories.Coding + categories.Creator;
    if (total === 0) {
      return [];
    }

    return [
      { name: 'Fitness (Physical)', value: categories.Fitness },
      { name: 'Discipline (Mind)', value: categories.Discipline },
      { name: 'Coding (Intelligence)', value: categories.Coding },
      { name: 'Creator (Broadcast)', value: categories.Creator }
    ].filter(item => item.value > 0);
  }, [allLogs]);

  const COLORS = ['#EC4899', '#7C3AED', '#06B6D4', '#F59E0B'];

  // 2. XP Trajectory Area Chart (Grouped by Date)
  const areaData = useMemo(() => {
    const dailySums: Record<string, number> = {};
    allLogs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailySums[date] = (dailySums[date] || 0) + (log.xp_earned || 0);
    });

    const dates = Object.keys(dailySums).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Return last 10 points
    const result = dates.map(d => ({ date: d, xp: dailySums[d] }));
    if (result.length === 0) {
      return [];
    }
    return result.slice(-10);
  }, [allLogs]);

  // 3. Side-by-side grouped comparative weekly bar chart (Last 7 Days)
  const barData = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
      const dayStart = new Date(d);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23,59,59,999);

      const dayLogs = allLogs.filter(log => {
        const c = new Date(log.created_at);
        return c >= dayStart && c <= dayEnd;
      });

      const actualXP = dayLogs.reduce((sum, l) => sum + (l.xp_earned || 0), 0);
      // Let's compare actual XP vs. standard daily target of 200 XP
      list.push({
        day: dayLabel,
        Actual: actualXP,
        Target: 200
      });
    }
    return list;
  }, [allLogs]);

  // 4. Milestone level up timeline
  const milestones = useMemo(() => {
    const list: any[] = [];
    stats.forEach(s => {
      if (s.level > 1) {
        list.push({
          title: `${s.stat_name.toUpperCase()} Protocol Upgraded!`,
          desc: `Reached Level ${s.level} in the ${s.stat_name} domain.`,
          date: `Current Tier`,
          icon: Zap
        });
      }
    });

    if (list.length === 0) {
      list.push({
        title: "Discipline Protocol Initialized",
        desc: "Awakened as an active Hunter in the Monarch System.",
        date: "System Boot",
        icon: Activity
      });
    }
    return list;
  }, [stats]);

  // 5. Personal records statistics
  const records = useMemo(() => {
    const maxSingleDay = allLogs.reduce((max, log) => Math.max(max, log.xp_earned || 0), 0);
    const totalXp = allLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0);
    const totalFocusMinutes = allLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

    return {
      maxXP: maxSingleDay,
      totalXp: totalXp || profile?.total_xp_alltime || 0,
      focusHours: Math.round(totalFocusMinutes / 60),
      totalLogs: allLogs.length
    };
  }, [allLogs, profile]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1400px] mx-auto w-full space-y-8 print:p-0 print:bg-white print:text-black"
    >
      {/* HEADER HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 print:border-black print:pb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue print:shadow-none print:border-black">
            <Activity className="w-8 h-8 text-accent-blue print:text-black" />
          </div>
          <div>
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white print:text-black">
              System <span className="text-[#06B6D4] print:text-black">Analytics</span>
            </h1>
            <p className="font-space-mono text-xs text-white/50 tracking-widest uppercase mt-1 print:text-black/60">
              Biometric telemetry progression and core system matrices
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintReport}
          className="btn-primary py-2.5 px-5 flex items-center gap-2 text-xs tracking-widest uppercase shrink-0 print:hidden"
        >
          <FileDown className="w-4 h-4" />
          Export Telemetry PDF
        </button>
      </div>

      {/* PERSONAL RECORDS GRID PANEL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        
        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden print:border-black">
          <Trophy className="w-8 h-8 text-gold shrink-0" />
          <div>
            <span className="block font-space-mono text-[9px] uppercase text-white/40 tracking-wider print:text-black/60">Peak XP Gain</span>
            <span className="block font-display text-2xl font-black text-white glow-text mt-0.5 print:text-black">{records.maxXP} XP</span>
          </div>
        </div>

        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden print:border-black">
          <Zap className="w-8 h-8 text-cyan-400 shrink-0" />
          <div>
            <span className="block font-space-mono text-[9px] uppercase text-white/40 tracking-wider print:text-black/60">Cumulative XP</span>
            <span className="block font-display text-2xl font-black text-white glow-text mt-0.5 print:text-black">{records.totalXp} XP</span>
          </div>
        </div>

        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden print:border-black">
          <Clock className="w-8 h-8 text-[#A78BFA] shrink-0" />
          <div>
            <span className="block font-space-mono text-[9px] uppercase text-white/40 tracking-wider print:text-black/60">Focus Time</span>
            <span className="block font-display text-2xl font-black text-white glow-text mt-0.5 print:text-black">{records.focusHours} HR</span>
          </div>
        </div>

        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden print:border-black">
          <Flame className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <span className="block font-space-mono text-[9px] uppercase text-white/40 tracking-wider print:text-black/60">Active Streak</span>
            <span className="block font-display text-2xl font-black text-white glow-text mt-0.5 print:text-black">{profile?.streak_days || 0} Days</span>
          </div>
        </div>

      </div>

      {/* CORE Progression Charts GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
        
        {/* Radar Attribute Matrix */}
        <div className="glass-panel p-6 border-t-2 border-t-accent-purple print:border-black print:shadow-none">
          <h2 className="font-orbitron text-base font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-white print:text-black">
            <Target className="w-5 h-5 text-accent-purple print:text-black" />
            Biometric Stat Radar
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={STATS_MATRIX}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: labelColor, fontSize: 10, fontFamily: 'Space Mono' }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Attribute Value" dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 0, fontFamily: 'Space Mono', color: 'var(--color-text-primary)' }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XP Source Donut/Pie Chart */}
        <div className="glass-panel p-6 border-t-2 border-t-cyan-500 relative print:border-black print:shadow-none">
          <h2 className="font-orbitron text-base font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-white print:text-black">
            <Activity className="w-5 h-5 text-cyan-400 print:text-black" />
            XP Allocation Vector
          </h2>
          <div className="h-[350px] w-full flex flex-col md:flex-row items-center justify-between gap-4 relative">
            {allLogs.length === 0 && (
              <EmptyChartState message="No quest data allocated. Synchronize system activities to plot allocation vector." />
            )}
            <div className="w-full md:w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Pie Legend */}
            <div className="w-full md:w-2/5 space-y-3 font-space-mono text-[10px] text-white/60 print:text-black">
              {pieData.length === 0 ? (
                <div className="text-white/30 uppercase tracking-widest text-[9px]">Offline</div>
              ) : (
                pieData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index] }} />
                    <span className="flex-1 uppercase tracking-wider">{d.name}</span>
                    <span className="font-bold text-white print:text-black">{d.value} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Trajectory & Weekly Comparative Grouped bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
        
        {/* XP Trajectory Timeline Area */}
        <div className="glass-panel p-6 border-t-2 border-t-[#EC4899] relative print:border-black print:shadow-none">
          <h2 className="font-orbitron text-base font-bold uppercase tracking-widest mb-6 text-white print:text-black">
            XP Telemetry Trajectory
          </h2>
          <div className="h-[350px] w-full relative">
            {allLogs.length === 0 && (
              <EmptyChartState message="No cumulative telemetry records found. Track training sessions to initialize progression trajectory." />
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor, fontSize: 9, fontFamily: 'Space Mono' }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 9, fontFamily: 'Space Mono' }} />
                <Tooltip />
                <Area type="monotone" dataKey="xp" stroke="#EC4899" fillOpacity={1} fill="url(#colorTrajectory)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Comparative Weekly Bar Chart */}
        <div className="glass-panel p-6 border-t-2 border-t-gold relative print:border-black print:shadow-none">
          <h2 className="font-orbitron text-base font-bold uppercase tracking-widest mb-6 text-white print:text-black">
            Actual XP vs Daily Target quota
          </h2>
          <div className="h-[350px] w-full relative">
            {allLogs.length === 0 && (
              <EmptyChartState message="No weekly active logs registered. Complete daily objectives to evaluate quotas." />
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} tick={{ fill: axisColor, fontSize: 9, fontFamily: 'Space Mono' }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 9, fontFamily: 'Space Mono' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Actual" fill="#06B6D4" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Target" fill={isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.05)"} radius={[2, 2, 0, 0]} stroke={gridColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* MILESTONE TIMELINE LIST */}
      <div className="glass-panel p-6 border border-white/5 print:border-black">
        <h2 className="font-orbitron text-base font-bold uppercase tracking-widest mb-6 text-white print:text-black">
          Hunter Level Up Chronology
        </h2>

        <div className="relative border-l border-white/10 pl-6 space-y-6 print:border-black">
          {milestones.map((m, idx) => {
            return (
              <div key={idx} className="relative">
                {/* Timeline circle icon */}
                <div className="absolute -left-[35px] top-0 w-4 h-4 bg-void border border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] print:shadow-none print:bg-white print:border-black">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full print:bg-black" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-space-mono">
                    <span className="text-white font-bold uppercase tracking-wider print:text-black">{m.title}</span>
                    <span className="text-white/30 print:text-black/60">{m.date}</span>
                  </div>
                  <p className="font-space-mono text-[11px] text-white/50 print:text-black/70">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}
