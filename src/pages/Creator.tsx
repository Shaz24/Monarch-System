import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Camera, Plus, Radio, Award } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';
import { EmptyState } from '../components/ui/EmptyState';

export default function Creator() {
  const { addXpParticle } = useUIStore();
  const { logs, addLog } = useActivityLogs('creator');
  const { stats } = useProfile();
  
  // Form State
  const [type, setType] = useState('Video Production');
  const [duration, setDuration] = useState('120');
  const [platform, setPlatform] = useState('YouTube');

  // Helper to get real stats
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };

  const charismaStat = getStat('charisma');
  const wealthStat = getStat('wealth');

  // Dynamic platform highlight color for flash animation
  const platformColor = useMemo(() => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return '#ff0000';
    if (p.includes('instagram')) return '#e1306c';
    if (p.includes('tiktok')) return '#00f2fe';
    if (p.includes('x') || p.includes('twitter')) return '#ffffff';
    return '#ff5a00';
  }, [platform]);

  // Influence Score computations (visual only)
  const totalXp = useMemo(() => {
    return logs.reduce((sum, l) => sum + l.xp_earned, 0);
  }, [logs]);

  const [displayedInfluence, setDisplayedInfluence] = useState(0);
  useEffect(() => {
    if (totalXp === 0) return;
    let start = 0;
    const end = totalXp;
    const durationMs = 800;
    const stepTime = Math.max(Math.floor(durationMs / 40), 10);
    const timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        setDisplayedInfluence(end);
        clearInterval(timer);
      } else {
        setDisplayedInfluence(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [totalXp]);

  const influenceTier = useMemo(() => {
    if (totalXp < 500) return { name: 'MICRO', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
    if (totalXp < 2000) return { name: 'RISING', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    if (totalXp < 5000) return { name: 'INFLUENCER', color: 'text-[#ff5a00] bg-[#ff5a00]/10 border-[#ff5a00]/20' };
    return { name: 'MEDIA TITAN', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse' };
  }, [totalXp]);

  const getPlatformEmoji = (plat: string) => {
    const p = (plat || '').toLowerCase();
    if (p.includes('youtube')) return '🎥';
    if (p.includes('x') || p.includes('twitter')) return '𝕏';
    if (p.includes('instagram')) return '📸';
    if (p.includes('tiktok')) return '🎵';
    return '📡';
  };

  const handleLogCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate XP
    const base = 2.0;
    const dur = parseInt(duration) || 0;
    const xpEarned = Math.round(base * dur);

    let statCategories = [];
    if (type === 'Networking' || type === 'Live Streaming') statCategories = ['charisma'];
    else if (type === 'Business Strategy' || type === 'Sponsorships') statCategories = ['wealth'];
    else statCategories = ['charisma', 'wealth'];

    await addLog(type, dur, xpEarned, { platform }, statCategories);

    // Visual Feedback
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success('Content broadcast successful. Influence expanded.', { icon: '🎥' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8 relative"
    >
      {/* Pulse REC Monitor on the far top-right */}
      <div className="absolute top-8 right-6 md:right-12 flex items-center gap-2 z-20 pointer-events-none select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff003c] animate-[pulse-rec_1s_infinite]" />
        <span className="font-space-mono text-[10px] text-[#ff003c] font-bold tracking-widest uppercase">
          ● REC
        </span>
      </div>

      {/* Header zone with title & horizontal broadcast ticker tape */}
      <div className="border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-void border border-[#ff5a00]/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,90,0,0.2)]">
            <Radio className="w-8 h-8 text-[#ff5a00] animate-pulse" />
          </div>
          <div>
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
              Content <span className="text-[#ff5a00]">Creation</span>
            </h1>
            <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
              Broadcast to the masses. Accrue resources.
            </p>
          </div>
        </div>

        {/* Ticker tape */}
        <div className="w-full overflow-hidden bg-void/50 border border-white/5 py-1.5 px-3 rounded">
          <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] select-none font-space-mono text-[9px] text-[#ff5a00]/50 tracking-widest uppercase">
            <span>[ BROADCAST LIVE ] — [ INFLUENCE EXPANDING ] — [ CONTENT DEPLOYED ] — [ AUDIENCE GROWING ] — [ BROADCAST LIVE ] — [ INFLUENCE EXPANDING ] — [ CONTENT DEPLOYED ] — [ AUDIENCE GROWING ] —&nbsp;</span>
            <span>[ BROADCAST LIVE ] — [ INFLUENCE EXPANDING ] — [ CONTENT DEPLOYED ] — [ AUDIENCE GROWING ] — [ BROADCAST LIVE ] — [ INFLUENCE EXPANDING ] — [ CONTENT DEPLOYED ] — [ AUDIENCE GROWING ] —&nbsp;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Logging Form */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Publish Asset Form with ON AIR Badge & Platform flash */}
          <div 
            className="glass-panel p-6 border-t-2 relative bg-void/40 transition-all duration-300 animate-[flash-border_1.5s_infinite]"
            style={{ 
              borderTopColor: platformColor,
              // Inject css variable for keyframe access
              '--flash-color': platformColor 
            } as React.CSSProperties}
          >
            {/* ON AIR Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-[#ff003c]/10 border border-[#ff003c]/20 rounded select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff003c] animate-pulse" />
              <span className="font-space-mono text-[8px] text-[#ff003c] font-black tracking-widest uppercase">
                ON AIR
              </span>
            </div>

            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#ff5a00]">
              <Plus className="w-5 h-5" />
              Publish Asset
            </h2>
            
            <form onSubmit={handleLogCreation} className="space-y-6">
              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Content Type
                </label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-void border border-white/10 p-3 text-white font-archivo-narrow text-sm focus:border-[#ff5a00] focus:ring-0 outline-none w-full"
                >
                  <option className="bg-[#0a0a0f]" value="Video Production">Video Production</option>
                  <option className="bg-[#0a0a0f]" value="Live Streaming">Live Streaming</option>
                  <option className="bg-[#0a0a0f]" value="Writing/Blogging">Writing/Blogging</option>
                  <option className="bg-[#0a0a0f]" value="Business Strategy">Business Strategy</option>
                  <option className="bg-[#0a0a0f]" value="Networking">Networking</option>
                </select>
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Target Platform
                </label>
                <input 
                  type="text" 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. YouTube, X"
                  className="w-full bg-void border border-white/10 p-3 text-white font-archivo-narrow text-sm focus:border-[#ff5a00] focus:ring-0 outline-none w-full"
                />
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Duration (Minutes)
                </label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-void border border-white/10 p-3 text-white font-archivo-narrow text-sm focus:border-[#ff5a00] focus:ring-0 outline-none w-full"
                />
              </div>

              {/* Reach Estimate preview */}
              <div className="border border-[#ff5a00]/20 bg-[#ff5a00]/5 p-3 rounded font-space-mono text-[10px] text-white/40 leading-relaxed">
                <div>REACH ESTIMATE: <span className="text-[#ff5a00] font-bold">+{Math.round((parseInt(duration) || 0) * 2)} XP</span></div>
                <div className="mt-1">AUDIENCE VALUE: <span className="text-white font-bold">~{Math.round((parseInt(duration) || 0) * 10)} simulated</span></div>
              </div>

              <button type="submit" className="w-full btn-primary border-[#ff5a00] text-[#ff5a00] hover:bg-[#ff5a00] hover:text-void py-4 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform" style={{ boxShadow: '0 0 10px rgba(255, 90, 0, 0.3)' }}>
                <Camera className="w-5 h-5" />
                INITIATE BROADCAST
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Stats and History */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Charisma */}
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-void/50 border border-white/5 md:col-span-1">
              <StatRing statName="Charisma" level={charismaStat.level} xp={charismaStat.xp % 100} />
            </div>

            {/* Wealth */}
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-void/50 border border-white/5 md:col-span-1">
              <StatRing statName="Wealth" level={wealthStat.level} xp={wealthStat.xp % 100} />
            </div>

            {/* NEW: Influence Score Panel (Display only) */}
            <div className="glass-panel p-5 flex flex-col justify-center bg-void/50 border border-[#ff5a00]/30 md:col-span-1 relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff5a00] to-transparent" />
              <span className="font-space-mono text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#ff5a00]" />
                INFLUENCE SCORE
              </span>
              
              <span className="font-orbitron text-5xl font-black text-[#ff5a00] tracking-tight mt-2 drop-shadow-[0_0_10px_rgba(255,90,0,0.3)]">
                {displayedInfluence.toLocaleString()}
              </span>

              {/* Progress limit bar */}
              <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#ff5a00] to-[#ff003c] transition-all duration-500" 
                  style={{ width: `${Math.min(100, totalXp / 5)}%` }}
                />
              </div>

              {/* Broadcast Authority level designation badge */}
              <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                <span className="font-space-mono text-[8px] text-white/30 uppercase">
                  BROADCAST AUTHORITY
                </span>
                <span className={`px-1.5 py-0.5 text-[8.5px] rounded font-space-mono font-bold border ${influenceTier.color}`}>
                  {influenceTier.name}
                </span>
              </div>
            </div>

          </div>

          {/* Transmission Logs */}
          <div className="glass-panel p-6 border border-white/5 relative bg-void/30">
            
            {/* Ruled separator header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#ff5a00]" />
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white">
                Transmission Logs
              </h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            
            {logs.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No recent transmissions"
                description="Your content stream is silent. Initiate a broadcast or log a strategic sponsoring/networking session to begin."
              />
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id}
                      className="p-4 bg-void/50 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group/item hover:border-[#ff5a00]/50 transition-all duration-200"
                    >
                      {/* Faint VHS scanline effect overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" 
                        style={{
                          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)'
                        }}
                      />

                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-[#ff5a00]/10 flex items-center justify-center rounded">
                          <span className="text-xl select-none">
                            {getPlatformEmoji(log.metadata?.platform)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-archivo-narrow text-base text-white">
                              {log.metadata?.platform || 'Direct Broadcast'}
                            </h3>
                            <span className="font-space-mono text-[9px] text-[#ff5a00] font-bold">
                              REACH: ~{log.duration_minutes * 10}
                            </span>
                          </div>
                          <p className="font-space-mono text-[10px] text-white/40 mt-0.5">
                            {new Date(log.created_at).toLocaleDateString()} • {log.activity_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end relative z-10">
                        <span className="font-space-mono text-xs text-white/50 uppercase tracking-widest">
                          {log.duration_minutes} MIN
                        </span>
                        <span className="font-space-mono text-xs font-bold text-[#ff5a00] bg-[#ff5a00]/10 px-2.5 py-1">
                          +{log.xp_earned} XP
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
