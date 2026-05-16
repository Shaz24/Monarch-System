import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Camera, TrendingUp, Plus } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';

interface CreatorLog {
  id: string;
  type: string;
  duration: number;
  xp_earned: number;
  date: string;
  platform: string;
}

export default function Creator() {
  const { addXpParticle } = useUIStore();
  const [logs, setLogs] = useState<CreatorLog[]>([]);
  
  // Form State
  const [type, setType] = useState('Video Production');
  const [duration, setDuration] = useState('120');
  const [platform, setPlatform] = useState('YouTube');

  // Dummy Stat state for UI
  const [charismaXP, setCharismaXP] = useState(450);
  const [wealthXP, setWealthXP] = useState(150);

  const handleLogCreation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate XP
    const base = 2.0;
    const dur = parseInt(duration) || 0;
    const xpEarned = Math.round(base * dur);

    const newLog: CreatorLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration: dur,
      xp_earned: xpEarned,
      date: new Date().toLocaleDateString(),
      platform
    };

    setLogs([newLog, ...logs]);
    
    // Distribute XP
    if (type === 'Networking' || type === 'Live Streaming') setCharismaXP(prev => prev + xpEarned);
    else if (type === 'Business Strategy' || type === 'Sponsorships') setWealthXP(prev => prev + xpEarned);
    else {
      setCharismaXP(prev => prev + Math.floor(xpEarned * 0.6));
      setWealthXP(prev => prev + Math.floor(xpEarned * 0.4));
    }

    // Visual Feedback
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success('Content broadcast successful. Influence expanded.', { icon: '🎥' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue">
          <Video className="w-8 h-8 text-accent-blue" />
        </div>
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
            Content <span className="text-accent-blue">Creation</span>
          </h1>
          <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
            Broadcast to the masses. Accrue resources.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Logging Form */}
        <div className="xl:col-span-1 space-y-8">
          <div className="glass-panel p-6 border-t-2 border-t-[#ff5a00]">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#ff5a00]" />
              Publish Asset
            </h2>
            
            <form onSubmit={handleLogCreation} className="space-y-6">
              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Content Type
                </label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-[#ff5a00] focus:outline-none transition-colors"
                >
                  <option>Video Production</option>
                  <option>Live Streaming</option>
                  <option>Writing/Blogging</option>
                  <option>Business Strategy</option>
                  <option>Networking</option>
                </select>
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Target Platform
                </label>
                <input 
                  type="text" 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. YouTube, X"
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-[#ff5a00] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Duration (Minutes)
                </label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-[#ff5a00] focus:outline-none transition-colors"
                />
              </div>

              <button type="submit" className="w-full btn-primary border-[#ff5a00] text-[#ff5a00] hover:bg-[#ff5a00] hover:text-void py-4 flex items-center justify-center gap-2 mt-4" style={{ boxShadow: '0 0 10px rgba(255, 90, 0, 0.3)' }}>
                <Camera className="w-5 h-5" />
                INITIATE BROADCAST
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Stats and History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Related Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatRing statName="Charisma" level={Math.floor(charismaXP / 100) + 1} xp={charismaXP % 100} />
            <StatRing statName="Wealth" level={Math.floor(wealthXP / 100) + 1} xp={wealthXP % 100} />
          </div>

          {/* Log History */}
          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-[#ff5a00] pl-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#ff5a00]" />
              Transmission Logs
            </h2>
            
            {logs.length === 0 ? (
              <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
                No recent transmissions.
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id}
                      className="p-4 bg-void/50 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ff5a00]/10 flex items-center justify-center">
                          <Video className="w-5 h-5 text-[#ff5a00]" />
                        </div>
                        <div>
                          <h3 className="font-archivo-narrow text-lg text-white">{log.platform}</h3>
                          <p className="font-space-mono text-xs text-white/50">{log.date} • {log.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                        <span className="font-space-mono text-sm text-white/70">{log.duration} MIN</span>
                        <span className="font-space-mono text-sm font-bold text-[#ff5a00] bg-[#ff5a00]/10 px-3 py-1">
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
